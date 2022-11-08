'use strict'

import AuthService from './AuthService.mjs'
import Fastify from 'fastify'
import FMongo from '@fastify/mongodb'
import Fjwt from '@fastify/jwt'
import mississippi from 'mississippi'

const fastify = Fastify({ logger: 'info' })

await fastify.register(FMongo, {
    forceClose: true,
    url: 'mongodb://localhost:27017/mydb'
})
await fastify.register(Fjwt, {
    secret: 'supersecret'
})

const authService = new AuthService(fastify.mongo.db.collection('credentials'), fastify.jwt)

fastify.addHook("onRequest", async (request, reply) => {
    const config = request.routeConfig

    if (config.skipJWT) {
        return;
    }

    // throw error in case of invalid/expired JWT
    const payload = await request.jwtVerify()

    const { role } = payload

    request.log.info({ actualRole: role, allowedRoles: config.rolesAllowed }, 'check the user role')

    if (!config.rolesAllowed.includes(role)) {
        reply.code(403)
            .send({
                message: 'role not allowed',
                actualRole: role,
                allowedRoles: config.rolesAllowed,
            })
        return;
    }
})

fastify.post('/login', {
    config: {
        skipJWT: true,
    },
    schema: {
        body: {
            type: 'object',
            required: ['username', 'password'],
            properties: {
                username: { type: 'string' },
                password: { type: 'string' },
            },
            additionalProperties: false,
        },
        response: {
            200: {
                type: 'object',
                properties: {
                    token: { type: 'string' }
                }
            }
        }
    }
}, login) 

async function login (req) {
    return authService.login(req.body)
}

fastify.post('/:collectionName', {
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

fastify.get('/:collectionName', {
    config: {
        rolesAllowed: ['admin', 'viewer']
    },
}, async function (req) {
    const db = this.mongo.db
    const coll = db.collection(req.params.collectionName)

    const objs = await coll.find({}).toArray()

    return objs
})

fastify.get('/:collectionName/jsonlines', {
    config: {
        rolesAllowed: ['admin', 'viewer']
    },
}, async function (req, reply) {
    const db = this.mongo.db
    const coll = db.collection(req.params.collectionName)

    const count = await coll.countDocuments()

    const s = coll.find().stream()

    let stringify = mississippi.through.obj(function(d, enc, cb) {
        cb(null, JSON.stringify(d) + '\n')
    })

    reply.header('Content-Type', 'application/json-lines')
    reply.header('X-Count', count)

    return s.pipe(stringify)
})

fastify.listen(3000)
