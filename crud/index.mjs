import mississippi from 'mississippi'

export default async function (fastify) {
  fastify.post('/crud/:collectionName', {
    config: {
      rolesAllowed: ['admin']
    },
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            insertedId: { type: 'string' }
          }
        }
      }
    }
  }, insertIntoDB)

  async function insertIntoDB (req) {
    const db = this.mongo.db
    const coll = db.collection(req.params.collectionName)

    const obj = await coll.insertOne(req.body)

    return obj
  }

  fastify.get('/crud/:collectionName', {
    config: {
      rolesAllowed: ['admin', 'viewer']
    }
  }, async function (req) {
    const db = this.mongo.db
    const coll = db.collection(req.params.collectionName)

    const objs = await coll.find({}).toArray()

    return objs
  })

  fastify.get('/crud/:collectionName/jsonlines', {
    config: {
      rolesAllowed: ['admin', 'viewer']
    }
  }, async function (req, reply) {
    const db = this.mongo.db
    const coll = db.collection(req.params.collectionName)

    const count = await coll.countDocuments()

    const s = coll.find().stream()

    const stringify = mississippi.through.obj(function (d, enc, cb) {
      cb(null, JSON.stringify(d) + '\n')
    })

    reply.header('Content-Type', 'application/json-lines')
    reply.header('X-Count', count)

    return s.pipe(stringify)
  })
}
