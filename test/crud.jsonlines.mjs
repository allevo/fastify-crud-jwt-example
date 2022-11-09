'use strict'

import tap from 'tap'

import auth from '../auth/index.mjs'
import crud from '../crud/index.mjs'
import { getToken, startFastify } from './utils.mjs'

tap.test('crud - jsonlines', async t => {
  const fastify = await startFastify(t)

  fastify.register(auth)
  fastify.register(crud)

  const token = await getToken(t, fastify, 'foo', 'bar')

  const ids = []
  for (let i = 0; i < 10; i++) {
    const response = await fastify.inject({
      method: 'POST',
      path: '/crud/books',
      headers: {
        Authorization: `Bearer ${token}`
      },
      payload: { title: 'Harry Potter ' + i }
    })
    t.equal(response.statusCode, 200, response.body)
    const responseBody = response.json()
    const insertedId = responseBody.insertedId
    t.ok(insertedId)

    ids.push(insertedId)
  }

  t.test('should return new lines json', async t => {
    const response = await fastify.inject({
      method: 'GET',
      path: '/crud/books/jsonlines',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    t.equal(response.statusCode, 200, response.body)

    const returnedIds = response.body.split('\n')
      .filter(l => l.length)
      .map(l => JSON.parse(l))
      .map(o => o._id)

    ids.sort()
    returnedIds.sort()
    t.strictSame(returnedIds, ids)

    t.equal(response.headers['x-count'], returnedIds.length)
  })
})
