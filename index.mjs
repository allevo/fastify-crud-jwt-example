'use strict'

import Fastify from 'fastify'
import FMongo from '@fastify/mongodb'

import auth from './auth/index.mjs'
import crud from './crud/index.mjs'

const fastify = Fastify({ logger: 'info' })

await fastify.register(FMongo, {
  forceClose: true,
  url: 'mongodb://localhost:27017/mydb'
})

fastify.register(auth)
fastify.register(crud)

fastify.listen(3000)
