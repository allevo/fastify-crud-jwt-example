'use strict'

import tap from 'tap'

import auth from '../auth/index.mjs'
import crud from '../crud/index.mjs'
import { getToken, startFastify } from './utils.mjs'

tap.test('crud', async t => {
  const fastify = await startFastify(t)

  fastify.register(auth)
  fastify.register(crud)

  t.test('admin is able to store entity', async t => {
    const token = await getToken(t, fastify, 'foo', 'bar')

    const response = await fastify.inject({
      method: 'POST',
      path: '/crud/books',
      headers: {
        Authorization: `Bearer ${token}`
      },
      payload: { title: 'Harry Potter 1' }
    })
    t.equal(response.statusCode, 200, response.body)
    const responseBody = response.json()
    const insertedId = responseBody.insertedId
    t.ok(insertedId)

    t.test('admin is able to fetch the list of books', async t => {
      const books = await getBooks(t, fastify, token)

      t.ok(books.length, 1)
      t.ok(books[0]._id, insertedId)
    })

    t.test('viewer is able to fetch the list of books', async t => {
      const viewerToken = await getToken(t, fastify, 'pippo', 'pluto')

      const books = await getBooks(t, fastify, viewerToken)
      t.ok(books.length, 1)
      t.ok(books[0]._id, insertedId)
    })
  })

  t.test('viewer is not able to store entity', async t => {
    const viewerToken = await getToken(t, fastify, 'pippo', 'pluto')

    const response = await fastify.inject({
      method: 'POST',
      path: '/crud/books',
      headers: {
        Authorization: `Bearer ${viewerToken}`
      }
    })
    t.equal(response.statusCode, 403, response.body)
  })

  t.test('anonymous user is not able to store entity', async t => {
    const response = await fastify.inject({
      method: 'POST',
      path: '/crud/books'
    })
    t.equal(response.statusCode, 401, response.body)
  })

  t.test('anonymous user is not able to fetch entities', async t => {
    const response = await fastify.inject({
      method: 'POST',
      path: '/crud/books'
    })
    t.equal(response.statusCode, 401, response.body)
  })
})

async function getBooks (t, fastify, token) {
  const response = await fastify.inject({
    method: 'GET',
    path: '/crud/books',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  t.equal(response.statusCode, 200, response.body)
  return response.json()
}
