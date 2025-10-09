/**
 * @fileoverview Integration tests for Job routes (Express + SQLite + Supertest)
 * @module tests/routes/job/job.routes.test
 */

const request = require('supertest')
const express = require('express')
const jwt = require('jsonwebtoken')
const { execSync } = require('child_process')
const prisma = require('../../../../src/models/prisma')

/**
 * Helpers
 */
function tokenFor (payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'testsecret', { algorithm: 'HS256' })
}

async function cleanDb () {
  // SQLite: wipe all tables except _prisma_migrations
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;')
  const tables = await prisma.$queryRawUnsafe(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT IN ('_prisma_migrations')
  `)
  for (const { name } of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}";`)
  }
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;')
}

async function seedMinimal () {
  await prisma.degreeType.create({ data: { name: 'Bachelor' } })

  const admin = await prisma.user.create({
    data: { email: 'admin@test.com', password: 'pass', role: 'ADMIN' }
  })

  const hr = await prisma.user.create({
    data: {
      email: 'hr@test.com',
      password: 'pass',
      role: 'EMPLOYER',
      hr: {
        create: {
          companyName: 'TestCorp',
          address: 'Bangkok',
          industry: 'IT_SOFTWARE',
          companySize: 'ELEVEN_TO_FIFTY'
        }
      }
    }
  })

  const hr2 = await prisma.user.create({
    data: {
      email: 'hr2@test.com',
      password: 'pass',
      role: 'EMPLOYER',
      hr: {
        create: {
          companyName: 'OtherCorp',
          address: 'Bangkok',
          industry: 'IT_SOFTWARE',
          companySize: 'ELEVEN_TO_FIFTY'
        }
      }
    }
  })

  const student = await prisma.user.create({
    data: {
      email: 'student@test.com',
      password: 'pass',
      role: 'STUDENT',
      student: { create: { degreeTypeId: 1, address: 'KU', gpa: 3.5, expectedGraduationYear: 2026 } }
    }
  })

  const job1 = await prisma.job.create({
    data: {
      title: 'Backend Engineer',
      description: 'Node.js',
      location: 'Bangkok',
      workType: 'ONSITE',
      hrId: hr.hr.id,
      companyName: 'TestCorp'
    }
  })

  const job2 = await prisma.job.create({
    data: {
      title: 'Frontend Engineer',
      description: 'React',
      location: 'Bangkok',
      workType: 'HYBRID',
      hrId: hr.hr.id,
      companyName: 'TestCorp'
    }
  })

  return { admin, hr, hr2, student, job1, job2 }
}

let app
let adminToken
let hrToken
let hr2Token
let studentToken
let seeded

beforeAll(async () => {
  process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'file:./test.db'
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

  // run latest migrations against SQLite test db
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })

  app = express()
  app.use(express.json())
  // mount your actual job routes here
  app.use('/api/job', require('../../../../src/routes/job'))

  await cleanDb()
  seeded = await seedMinimal()

  adminToken = 'Bearer ' + tokenFor({ id: seeded.admin.id, role: 'ADMIN' })
  hrToken = 'Bearer ' + tokenFor({ id: seeded.hr.id, role: 'EMPLOYER', hr: { id: seeded.hr.hr.id } })
  hr2Token = 'Bearer ' + tokenFor({ id: seeded.hr2.id, role: 'EMPLOYER', hr: { id: seeded.hr2.hr.id } })
  studentToken = 'Bearer ' + tokenFor({ id: seeded.student.id, role: 'STUDENT' })
})

beforeEach(async () => {
  await cleanDb()
  seeded = await seedMinimal()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Job routes (integration)', () => {
  describe('GET /api/job', () => {
    it('returns paginated list', async () => {
      const res = await request(app).get('/api/job?page=1&pageSize=1')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data.items)).toBe(true)
      expect(res.body.data.items.length).toBe(1)
      expect(res.body.data.total).toBeGreaterThanOrEqual(2)
    })
  })

  describe('GET /api/job/search/:query', () => {
    it('returns filtered jobs by query', async () => {
      const res = await request(app).get('/api/job/search/Frontend')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.find(j => j.title.includes('Frontend'))).toBeTruthy()
    })
  })

  describe('GET /api/job/:id', () => {
    it('returns job details', async () => {
      const res = await request(app).get(`/api/job/${seeded.job1.id}`)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(seeded.job1.id)
    })
  })

  describe('POST /api/job', () => {
    it('HR creates new job', async () => {
      const res = await request(app)
        .post('/api/job')
        .set('Authorization', hrToken)
        .send({ title: 'Data Engineer', description: 'ETL', location: 'Bangkok', workType: 'REMOTE' })
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.title).toBe('Data Engineer')
    })

    it('Student cannot create job (403)', async () => {
      const res = await request(app)
        .post('/api/job')
        .set('Authorization', studentToken)
        .send({ title: 'Nope', description: 'x', location: 'x', workType: 'ONSITE' })
      expect(res.status).toBe(403)
    })
  })

  describe('PATCH /api/job/:id', () => {
    it('HR owner updates job', async () => {
      const res = await request(app)
        .patch(`/api/job/${seeded.job1.id}`)
        .set('Authorization', hrToken)
        .send({ title: 'Backend Engineer II' })
      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('Backend Engineer II')
    })

    it('Student cannot update (403)', async () => {
      const res = await request(app)
        .patch(`/api/job/${seeded.job1.id}`)
        .set('Authorization', studentToken)
        .send({ title: 'Hack' })
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /api/job/:id', () => {
    it('Admin can delete any job', async () => {
      const res = await request(app)
        .delete(`/api/job/${seeded.job1.id}`)
        .set('Authorization', adminToken)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('HR owner can delete own job', async () => {
      // create job for hr2 and delete with hr2
      const created = await prisma.job.create({
        data: {
          title: 'Temp',
          description: 'remove',
          location: 'Bangkok',
          workType: 'ONSITE',
          hrId: seeded.hr2.hr.id,
          companyName: 'OtherCorp'
        }
      })
      const res = await request(app)
        .delete(`/api/job/${created.id}`)
        .set('Authorization', hr2Token)
      expect(res.status).toBe(200)
    })

    it('Another HR cannot delete (403)', async () => {
      const res = await request(app)
        .delete(`/api/job/${seeded.job2.id}`)
        .set('Authorization', hr2Token)
      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/job/:id (apply)', () => {
    it('Student applies successfully', async () => {
      const res = await request(app)
        .post(`/api/job/${seeded.job1.id}`)
        .set('Authorization', studentToken)
        .send({ resumeUrl: 'resume.pdf' })
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('PENDING')
    })

    it('Duplicate application returns 409', async () => {
      await prisma.application.create({
        data: {
          jobId: seeded.job1.id,
          studentId: seeded.student.id,
          status: 'PENDING'
        }
      })
      const res = await request(app)
        .post(`/api/job/${seeded.job1.id}`)
        .set('Authorization', studentToken)
        .send({ resumeUrl: 'resume.pdf' })
      expect(res.status).toBe(409)
    })
  })

  describe('GET /api/job/:id/applyer', () => {
    it('HR retrieves applicants', async () => {
      await prisma.application.create({
        data: {
          jobId: seeded.job1.id,
          studentId: seeded.student.id,
          status: 'PENDING'
        }
      })
      const res = await request(app)
        .get(`/api/job/${seeded.job1.id}/applyer`)
        .set('Authorization', hrToken)
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('POST /api/job/:id/applyer (manage status)', () => {
    it('HR updates applicant status', async () => {
      const appRow = await prisma.application.create({
        data: {
          jobId: seeded.job1.id,
          studentId: seeded.student.id,
          status: 'PENDING'
        }
      })
      const res = await request(app)
        .post(`/api/job/${seeded.job1.id}/applyer`)
        .set('Authorization', hrToken)
        .send({ applicationId: appRow.id, status: 'QUALIFIED' })
      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('QUALIFIED')
    })
  })
})
