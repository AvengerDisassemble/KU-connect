
/**
 * @fileoverview Unit tests for app.js (Express app setup)
 * @author KU Connect Team
 */

const request = require('supertest')
const app = require('../../src/app')

describe('app.js', () => {
  it('should mount /api/example route and return correct message', async () => {
    const res = await request(app).get('/api/example')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'This is an example route!' })
  })

  it('should mount /api/example-subroute route and return correct message', async () => {
    const res = await request(app).get('/api/example-subroute')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'This is an example default subroute!' })
  })

  it('should mount /api/example-subroute/example route and return correct message', async () => {
    const res = await request(app).get('/api/example-subroute/example')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'This is an example subroute!' })
  })

  it('should mount /api/example-subroute/example/yes route and return correct message', async () => {
    const res = await request(app).get('/api/example-subroute/example/yes')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'This is an example subsubroute!' })
  })

  it('should mount /api/example-subroute/subroute1 route and return correct message', async () => {
    const res = await request(app).get('/api/example-subroute/subroute1')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ message: 'This is an example subsubroute!' })
  })
})
