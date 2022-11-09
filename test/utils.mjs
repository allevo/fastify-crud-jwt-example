import crypto from 'crypto'

import fastifyMongodb from '@fastify/mongodb'
import Fastify from 'fastify'

export async function getToken (t, fastify, username, password) {
  const response = await fastify.inject({
    method: 'POST',
    path: '/auth/login',
    payload: { username, password }
  })

  t.equal(response.statusCode, 200)
  t.ok(response.json().token)

  return response.json().token
}

export async function startFastify (t) {
  const fastify = Fastify()
  t.teardown(() => fastify.close())

  const uuid = crypto.randomUUID()
  await fastify.register(fastifyMongodb, {
    forceClose: true,
    url: 'mongodb://localhost:27017/' + uuid
  })
  await fastify.mongo.db.collection('credentials').insertMany([
    { username: 'foo', password: 'bar', profile: { role: 'admin' } },
    { username: 'pippo', password: 'pluto', profile: { role: 'viewer' } }
  ])

  return fastify
}
