
/**
 * @fileoverview Unit tests for example-database-usage route
 * @author KU Connect Team
 */

const request = require('supertest')
const express = require('express')
jest.mock('../../../../src/generated/prisma', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findMany: jest.fn()
      }
    }))
  }
})
const { PrismaClient } = require('../../../../src/generated/prisma')
const exampleDbRouter = require('../../../../src/routes/example-database-usage/index')

describe('example-database-usage route', () => {
  let app, prismaMock
  beforeAll(() => {
    app = express()
    app.use(express.json())
    app.use('/', exampleDbRouter)
    prismaMock = new PrismaClient()
  })

  it('GET / should return users from prisma', async () => {
    const users = [{ id: 1, username: 'prof.johndoe' }]
    prismaMock.user.findMany.mockResolvedValue(users)
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(users)
  })

  it('GET / should handle prisma error', async () => {
    prismaMock.user.findMany.mockRejectedValue(new Error('fail'))
    const res = await request(app).get('/')
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: 'Internal Server Error' })
  })
})
