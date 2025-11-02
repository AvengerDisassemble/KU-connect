// Integration tests for Saved Jobs

// Ensure test DB is used before any imports that load Prisma
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./test.db'
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'testsecret'

const fs = require('fs')
const path = require('path')
// Remove leftover test database to avoid schema/type mismatches from prior runs
const dbPath = path.resolve(process.cwd(), 'test.db')
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath)
  } catch (err) {
    // ignore unlink errors during test cleanup
  }
}

const request = require('supertest')
const prisma = require('../../src/models/prisma')
const app = require('../../src/app')
const { createTestToken } = require('./utils/testHelpers')

jest.setTimeout(30000)

describe('Saved Jobs (integration)', () => {
  let user
  let hr
  let job1
  let job2
  let userToken

  beforeAll(async () => {
    // Seed minimal data: degreeType needed for student creation
    let degreeType
    try {
      degreeType = await prisma.degreeType.create({ data: { name: 'Bachelor' } })
    } catch (err) {
      // If unique constraint (already exists), find it instead of upsert
      if (err && err.code === 'P2002') {
        degreeType = await prisma.degreeType.findUnique({ where: { name: 'Bachelor' } })
      } else {
        throw err
      }
    }

    hr = await prisma.user.upsert({
      where: { email: 'saved-hr@test.com' },
      update: {},
      create: {
        name: 'SavedHR',
        surname: 'User',
        email: 'saved-hr@test.com',
        password: 'Pass',
        role: 'EMPLOYER',
        hr: { create: { companyName: 'SeedCorp', address: 'Bangkok', industry: 'IT_SOFTWARE', companySize: 'ONE_TO_TEN' } }
      },
      include: { hr: true }
    })

    // student user (we create a Student record to match schema expectations)
    user = await prisma.user.upsert({
      where: { email: 'saved-user@test.com' },
      update: {},
      create: {
        name: 'Saved',
        surname: 'User',
        email: 'saved-user@test.com',
        password: 'Pass',
        role: 'STUDENT',
        student: { create: { degreeTypeId: degreeType.id, address: 'KU', gpa: 3.0, expectedGraduationYear: 2026 } }
      },
      include: { student: true }
    })

    job1 = await prisma.job.create({
      data: {
        title: 'Saved Job 1',
        description: 'Test job 1',
        location: 'Bangkok',
        jobType: 'full-time',
        workArrangement: 'on-site',
        duration: '6-month',
        minSalary: 10000,
        maxSalary: 20000,
        application_deadline: new Date(Date.now() + 1000 * 60 * 60 * 24),
        phone_number: '+66810000001',
        hrId: hr.hr.id,
        companyName: 'SeedCorp'
      }
    })

    job2 = await prisma.job.create({
      data: {
        title: 'Saved Job 2',
        description: 'Test job 2',
        location: 'Bangkok',
        jobType: 'full-time',
        workArrangement: 'on-site',
        duration: '6-month',
        minSalary: 12000,
        maxSalary: 22000,
        application_deadline: new Date(Date.now() + 1000 * 60 * 60 * 24),
        phone_number: '+66810000002',
        hrId: hr.hr.id,
        companyName: 'SeedCorp'
      }
    })

    userToken = createTestToken({ id: user.id, role: 'STUDENT' })
  })

  beforeEach(async () => {
    await prisma.savedJob.deleteMany()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  test('GET empty returns empty list', async () => {
    const res = await request(app).get(`/api/${user.id}/saved`).expect(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.items).toEqual([])
  })

  test('POST create then GET shows item', async () => {
    const post = await request(app)
      .post(`/api/${user.id}/saved`)
      .send({ jobId: job1.id })
      .expect(201)
    expect(post.body.success).toBe(true)

    const get = await request(app).get(`/api/${user.id}/saved`).expect(200)
    expect(get.body.success).toBe(true)
    expect(get.body.data.items.length).toBe(1)
    expect(get.body.data.items[0].job.id).toBe(job1.id)
  })

  test('POST duplicate returns 409', async () => {
    await prisma.savedJob.create({ data: { userId: user.id, jobId: job2.id } })
    const res = await request(app)
      .post(`/api/${user.id}/saved`)
      .send({ jobId: job2.id })
      .expect(409)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('ALREADY_SAVED')
  })

  test('DELETE existing then GET not listed', async () => {
    await prisma.savedJob.create({ data: { userId: user.id, jobId: job1.id } })
    await request(app)
      .delete(`/api/${user.id}/saved`)
      .send({ jobId: job1.id })
      .expect(204)

    const get = await request(app).get(`/api/${user.id}/saved`).expect(200)
    expect(get.body.data.items).toEqual([])
  })

  test('DELETE non-existing returns 404', async () => {
    const res = await request(app)
      .delete(`/api/${user.id}/saved`)
      .send({ jobId: job2.id })
      .expect(404)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  test('Validation errors for missing jobId', async () => {
    const res = await request(app)
      .post(`/api/${user.id}/saved`)
      .send({ jobId: '' })
      .expect(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})
