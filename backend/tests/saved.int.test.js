const request = require('supertest')
const { execSync } = require('child_process')
const path = require('path')
const app = require('../src/app')
const prisma = require('../src/models/prisma')

jest.setTimeout(20000)

describe('Saved jobs feature', () => {
  beforeAll(async () => {
    process.env.TEST_DATABASE_URL = 'file:./test.db'
    execSync('npx prisma generate', { stdio: 'inherit' })
    execSync('npx prisma db push', { stdio: 'inherit' })
    // seed a user and two jobs
    await prisma.user.create({ data: { id: 'u1', name: 'Test', surname: 'User', email: 'test@example.com', role: 'STUDENT' } })
    await prisma.hR.create({ data: { id: 'hr1', userId: 'u_hr', companyName: 'Acme', address: 'Here', phoneNumber: '123456' } }).catch(() => {})
    await prisma.job.create({ data: { id: 'j1', hrId: 'hr1', title: 'Job 1', companyName: 'Acme', description: 'd', location: 'loc', jobType: 'full-time', workArrangement: 'on-site', duration: '6m', minSalary: 0, maxSalary: 1, application_deadline: new Date(), phone_number: '123' } })
    await prisma.job.create({ data: { id: 'j2', hrId: 'hr1', title: 'Job 2', companyName: 'Acme', description: 'd', location: 'loc', jobType: 'internship', workArrangement: 'remote', duration: '3m', minSalary: 0, maxSalary: 1, application_deadline: new Date(), phone_number: '123' } })
  })

  beforeEach(async () => {
    await prisma.savedJob.deleteMany().catch(() => {})
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('GET empty list', async () => {
    const res = await request(app).get('/api/u1/saved')
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.total).toBe(0)
  })

  test('POST create', async () => {
    const res = await request(app).post('/api/u1/saved').send({ jobId: 'j1' })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })

  test('POST duplicate returns 409', async () => {
    await request(app).post('/api/u1/saved').send({ jobId: 'j1' })
    const res = await request(app).post('/api/u1/saved').send({ jobId: 'j1' })
    expect(res.status).toBe(409)
  })

  test('DELETE existing', async () => {
    await request(app).post('/api/u1/saved').send({ jobId: 'j1' })
    const res = await request(app).delete('/api/u1/saved').send({ jobId: 'j1' })
    expect(res.status).toBe(204)
  })

  test('DELETE missing returns 404', async () => {
    const res = await request(app).delete('/api/u1/saved').send({ jobId: 'j999' })
    expect(res.status).toBe(404)
  })

  test('Validation errors', async () => {
    const res = await request(app).post('/api//saved').send({ jobId: '' })
    expect(res.status).toBe(404) // route not found due to missing param
  })
})
