import fp from 'fastify-plugin'
import Fjwt from '@fastify/jwt'

import AuthService from './AuthService.mjs'

export default fp(async function authLogin (fastify, opts) {
  await fastify.register(Fjwt, {
    secret: 'supersecret'
  })

  const authService = new AuthService(fastify.mongo.db.collection('credentials'), fastify.jwt)
  fastify.decorate('authService', authService)

  fastify.post('/auth/login', {
    config: {
      skipJWT: true
    },
    schema: {
      body: LOGIN.REQUEST_BODY,
      response: { 200: LOGIN.RESPONSE_BODY }
    }
  }, login)

  fastify.addHook('onRequest', async function (request, reply) {
    const config = request.routeConfig

    if (config.skipJWT) {
      return
    }

    // throw error in case of invalid/expired JWT
    const payload = await request.jwtVerify()

    if (!this.authService.isAllowed(request.log, payload, config)) {
      reply.code(403)
        .send({
          message: 'role not allowed',
          allowedRoles: config.rolesAllowed
        })
    }
  })
})

async function login (req) {
  return this.authService.login(req.body)
}

const LOGIN = {
  REQUEST_BODY: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string' },
      password: { type: 'string' }
    },
    additionalProperties: false
  },
  RESPONSE_BODY: {
    type: 'object',
    properties: {
      token: { type: 'string' }
    }
  }
}
