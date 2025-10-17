/**
 * @fileoverview Integration tests for Job Report routes (Express + SQLite + Supertest)
 * @module tests/routes/job/jobReport.routes.test
 */

// IMPORTANT: Set environment variable BEFORE requiring any modules
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'testsecret'

const request = require('supertest')
const express = require('express')
const jwt = require('jsonwebtoken')
const { execSync } = require('child_process')
// Use the same Prisma instance as the application to avoid cache issues
const prisma = require('../../../../src/models/prisma')

// Clear the require cache for auth-related modules to ensure they pick up the env var
Object.keys(require.cache).forEach(key => {
  if (key.includes('tokenUtils') || key.includes('authMiddleware') || key.includes('authService')) {
    delete require.cache[key]
  }
})

function tokenFor (payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET || 'testsecret', { algorithm: 'HS256' })
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
  // Create a degree type for student (or use existing) - use upsert to handle race conditions
  let degreeType = await prisma.degreeType.upsert({
    where: { name: 'Bachelor' },
    update: {},
    create: { name: 'Bachelor' }
  })

  // Use upsert for atomic user creation to avoid race conditions
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      name: 'Admin',
      surname: 'User',
      email: 'admin@test.com',
      password: 'pass',
      role: 'ADMIN',
      admin: { create: {} }
    }
  })

  const hr = await prisma.user.upsert({
    where: { email: 'hr@test.com' },
    update: {},
    create: {
      name: 'HR',
      surname: 'User',
      email: 'hr@test.com',
      password: 'pass',
      role: 'EMPLOYER',
      hr: { create: { companyName: 'TestCorp', address: 'Bangkok', industry: 'IT_SOFTWARE', companySize: 'ELEVEN_TO_FIFTY' } }
    },
    include: { hr: true }
  })

  // Create multiple students for different tests to avoid conflicts
  const student1 = await prisma.user.upsert({
    where: { email: 'student1@test.com' },
    update: {},
    create: {
      name: 'Student1',
      surname: 'User',
      email: 'student1@test.com',
      password: 'pass',
      role: 'STUDENT',
      student: {
        create: {
          degreeTypeId: degreeType.id,
          address: 'KU',
          gpa: 3.5,
          expectedGraduationYear: 2026
        }
      }
    },
    include: { student: true }
  })

  const student2 = await prisma.user.upsert({
    where: { email: 'student2@test.com' },
    update: {},
    create: {
      name: 'Student2',
      surname: 'User',
      email: 'student2@test.com',
      password: 'pass',
      role: 'STUDENT',
      student: {
        create: {
          degreeTypeId: degreeType.id,
          address: 'KU',
          gpa: 3.6,
          expectedGraduationYear: 2026
        }
      }
    },
    include: { student: true }
  })

  const student3 = await prisma.user.upsert({
    where: { email: 'student3@test.com' },
    update: {},
    create: {
      name: 'Student3',
      surname: 'User',
      email: 'student3@test.com',
      password: 'pass',
      role: 'STUDENT',
      student: {
        create: {
          degreeTypeId: degreeType.id,
          address: 'KU',
          gpa: 3.7,
          expectedGraduationYear: 2026
        }
      }
    },
    include: { student: true }
    })

  const job = await prisma.job.findFirst({
    where: {
      title: 'Backend Developer',
      hrId: hr.hr.id
    }
  }) || await prisma.job.create({
    data: {
      title: 'Backend Developer',
      description: 'Node.js development',
      location: 'Bangkok',
      jobType: 'full-time',
      workArrangement: 'on-site',
      duration: '6-month',
      minSalary: 40000,
      maxSalary: 60000,
      application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      phone_number: '+66812345678',
      hrId: hr.hr.id,
      companyName: 'TestCorp'
    }
  })

  return { admin, hr, student1, student2, student3, job, degreeType }
}

let app
let adminToken
let hrToken
let student1Token
let student2Token
let student3Token
let seeded

beforeAll(async () => {
  app = express()
  app.use(express.json())
  // mount your job + job report routes root (assuming report lives under /api/job as specified)
  app.use('/api/job', require('../../../../src/routes/job'))
  
  // Clean and seed once for all tests
  await cleanDb()
  
  seeded = await seedBase()
  
  // Generate tokens for all users
  adminToken = 'Bearer ' + tokenFor({ id: seeded.admin.id, role: 'ADMIN' })
  hrToken = 'Bearer ' + tokenFor({ id: seeded.hr.id, role: 'EMPLOYER', hr: { id: seeded.hr.hr.id } })
  student1Token = 'Bearer ' + tokenFor({ id: seeded.student1.id, role: 'STUDENT' })
  student2Token = 'Bearer ' + tokenFor({ id: seeded.student2.id, role: 'STUDENT' })
  student3Token = 'Bearer ' + tokenFor({ id: seeded.student3.id, role: 'STUDENT' })
})

beforeEach(async () => {
  // Clean all reports before each test for isolation
  await prisma.jobReport.deleteMany()
})

afterAll(async () => {
  // Disconnect from database (cleanup removed to avoid conflicts with other test files)
  await prisma.$disconnect()
})

describe('Job Report routes (integration)', () => {
  describe('POST /api/job/:id/report', () => {
    it('creates report by authenticated non-owner', async () => {
      const res = await request(app)
        .post(`/api/job/${seeded.job.id}/report`)
        .set('Authorization', student1Token)
        .send({ reason: 'This is a scam job posting' })
      
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.reason).toBe('This is a scam job posting')
    })

    it('403 when HR owner tries to report own job', async () => {
      const res = await request(app)
        .post(`/api/job/${seeded.job.id}/report`)
        .set('Authorization', hrToken)
        .send({ reason: 'This should not work for owner' })
      expect(res.status).toBe(403)
    })

    it('400 duplicate when same user reports the same job twice', async () => {
      // First report via HTTP (using student2)
      const firstRes = await request(app)
        .post(`/api/job/${seeded.job.id}/report`)
        .set('Authorization', student2Token)
        .send({ reason: 'This is spam content' })
      expect(firstRes.status).toBe(201)
      
      // Second report with same user should fail
      const res = await request(app)
        .post(`/api/job/${seeded.job.id}/report`)
        .set('Authorization', student2Token)
        .send({ reason: 'Reporting again as spam' })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/job/reports', () => {
    it('Admin lists all reports', async () => {
      // Create a report via HTTP first (using student3)
      const createRes = await request(app)
        .post(`/api/job/${seeded.job.id}/report`)
        .set('Authorization', student3Token)
        .send({ reason: 'Contains bad content here' })
      expect(createRes.status).toBe(201)
      
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
        .set('Authorization', student1Token)
      expect(res.status).toBe(403)
    })
  })

  describe('DELETE /api/job/reports/:reportId', () => {
    it('Admin deletes a report', async () => {
      // Create report via HTTP (using student1 - reusing is OK since beforeEach cleans)
      const createRes = await request(app)
        .post(`/api/job/${seeded.job.id}/report`)
        .set('Authorization', student1Token)
        .send({ reason: 'This is a phishing attempt' })
      expect(createRes.status).toBe(201)
      const reportId = createRes.body.data.id
      
      const res = await request(app)
        .delete(`/api/job/reports/${reportId}`)
        .set('Authorization', adminToken)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('forbidden for non-admin', async () => {
      // Create report via HTTP (using student2 - reusing is OK since beforeEach cleans)
      const createRes = await request(app)
        .post(`/api/job/${seeded.job.id}/report`)
        .set('Authorization', student2Token)
        .send({ reason: 'Testing delete permissions here' })
      expect(createRes.status).toBe(201)
      const reportId = createRes.body.data.id
      
      const res = await request(app)
        .delete(`/api/job/reports/${reportId}`)
        .set('Authorization', student2Token)
      expect(res.status).toBe(403)
    })
  })
})
