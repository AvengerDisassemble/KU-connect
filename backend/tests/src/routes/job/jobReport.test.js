/**
 * @fileoverview Integration tests for Job Report routes (Express + SQLite + Supertest)
 * @module tests/routes/job/jobReport.routes.test
 */

const request = require('supertest')
const express = require('express')
const jwt = require('jsonwebtoken')
const { execSync } = require('child_process')
const prisma = require('../../../../src/models/prisma')

function tokenFor (payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'testsecret', { algorithm: 'HS256' })
}

async function cleanDb () {
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

async function seedBase () {
  const admin = await prisma.user.create({
    data: { email: 'admin@test.com', password: 'pass', role: 'ADMIN' }
  })

  const hr = await prisma.user.create({
    data: {
      email: 'hr@test.com',
      password: 'pass',
      role: 'EMPLOYER',
      hr: { create: { companyName: 'TestCorp', address: 'Bangkok', industry: 'IT_SOFTWARE', companySize: 'ELEVEN_TO_FIFTY' } }
    }
  })

  const student = await prisma.user.create({
    data: { email: 'student@test.com', password: 'pass', role: 'STUDENT' }
  })

  const job = await prisma.job.create({
    data: {
      title: 'Backend',
      description: 'Node.js',
      location: 'Bangkok',
      workType: 'ONSITE',
      hrId: hr.hr.id,
      companyName: 'TestCorp'
    }
  })

  return { admin, hr, student, job }
}

let app
let adminToken
let hrToken
let studentToken
let seeded

beforeAll(async () => {
  app = express()
  app.use(express.json())
  // mount your job + job report routes root (assuming report lives under /api/job as specified)
  app.use('/api/job', require('../../../../src/routes/job'))

  await cleanDb()
  seeded = await seedBase()

  adminToken = 'Bearer ' + tokenFor({ id: seeded.admin.id, role: 'ADMIN' })
  hrToken = 'Bearer ' + tokenFor({ id: seeded.hr.id, role: 'EMPLOYER', hr: { id: seeded.hr.hr.id } })
  studentToken = 'Bearer ' + tokenFor({ id: seeded.student.id, role: 'STUDENT' })
})

beforeEach(async () => {
  await cleanDb()
  seeded = await seedBase()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('Job Report routes (integration)', () => {
  describe('POST /api/job/:id/report', () => {
    it('creates report by authenticated non-owner', async () => {
      const res = await request(app)
        .post(`/api/job/${seeded.job.id}/report`)
        .set('Authorization', studentToken)
        .send({ reason: 'scam' })
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.reason).toBe('scam')
    })

    it('403 when HR owner tries to report own job', async () => {
      const res = await request(app)
        .post(`/api/job/${seeded.job.id}/report`)
        .set('Authorization', hrToken)
        .send({ reason: 'nope' })
      expect(res.status).toBe(403)
    })

    it('400 duplicate when same user reports the same job twice', async () => {
      await prisma.jobReport.create({ data: { userId: seeded.student.id, jobId: seeded.job.id, reason: 'spam' } })
      const res = await request(app)
        .post(`/api/job/${seeded.job.id}/report`)
        .set('Authorization', studentToken)
        .send({ reason: 'spam again' })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/job/reports', () => {
    it('Admin lists all reports', async () => {
      await prisma.jobReport.create({ data: { userId: seeded.student.id, jobId: seeded.job.id, reason: 'bad content' } })
      const res = await request(app)
        .get('/api/job/reports')
        .set('Authorization', adminToken)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1)
    })

    it('403 for non-Admin', async () => {
      const res = await request(app)
        .get('/api/job/reports')
        .set('Authorization', studentToken)
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /api/job/reports/:reportId', () => {
    it('Admin deletes a report', async () => {
      const report = await prisma.jobReport.create({ data: { userId: seeded.student.id, jobId: seeded.job.id, reason: 'phishing' } })
      const res = await request(app)
        .delete(`/api/job/reports/${report.id}`)
        .set('Authorization', adminToken)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('forbidden for non-admin', async () => {
      const report = await prisma.jobReport.create({ data: { userId: seeded.student.id, jobId: seeded.job.id, reason: 'x' } })
      const res = await request(app)
        .delete(`/api/job/reports/${report.id}`)
        .set('Authorization', studentToken)
      expect(res.status).toBe(403)
    })
  })
})
