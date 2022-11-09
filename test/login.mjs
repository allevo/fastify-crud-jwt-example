'use strict'

import tap from 'tap'

import auth from '../auth/index.mjs'
import { getToken, startFastify } from './utils.mjs'

tap.test('POST /login', async t => {
  const fastify = await startFastify(t)

  fastify.register(auth)

  t.test('should return a token if the credentials are right', async t => {
    const token = await getToken(t, fastify, 'foo', 'bar')
    t.ok(token)
  })

  t.test('should return 500 if the credentials are wrong', async t => {
    const response = await fastify.inject({
      method: 'POST',
      path: '/auth/login',
      payload: {
        username: 'bad',
        password: 'credentials'
      }
    })

    t.equal(response.statusCode, 500)
  })
})
