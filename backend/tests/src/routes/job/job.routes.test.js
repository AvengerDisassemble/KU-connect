/**
 * @fileoverview Integration tests for Job routes (Express + Prisma + Supertest)
 * @module tests/routes/job/job.routes.test
 */

const request = require('supertest')
const { PrismaClient } = require('../../../../src/generated/prisma')
const app = require('../../../../src/app')
const jwt = require('jsonwebtoken')

const prisma = new PrismaClient()
jest.setTimeout(30000) // give DB setup more time

describe('Job Routes (Integration)', () => {
  let admin, hr, hr2, student
  let job1, job2
  let adminToken, hrToken, hr2Token, studentToken

  /**
   * Clean and seed database
   */
  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

    // --- Clean all ---
    await prisma.application.deleteMany()
    await prisma.job.deleteMany()
    await prisma.student.deleteMany()
    await prisma.hR.deleteMany()
    await prisma.user.deleteMany()
    await prisma.degreeType.deleteMany()

    // --- Seed minimal data ---
    const degreeType = await prisma.degreeType.create({ data: { name: 'Bachelor' } })

    admin = await prisma.user.create({
      data: { email: 'admin@test.com', password: 'pass', role: 'ADMIN' }
    })

    hr = await prisma.user.create({
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
      },
      include: { hr: true }
    })

    hr2 = await prisma.user.create({
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
      },
      include: { hr: true }
    })

    student = await prisma.user.create({
      data: {
        email: 'student@test.com',
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
      }
    })

    job1 = await prisma.job.create({
      data: {
        title: 'Backend Engineer',
        description: 'Node.js',
        location: 'Bangkok',
        workType: 'ONSITE',
        hrId: hr.hr.id,
        companyName: 'TestCorp'
      }
    })

    job2 = await prisma.job.create({
      data: {
        title: 'Frontend Engineer',
        description: 'React',
        location: 'Bangkok',
        workType: 'HYBRID',
        hrId: hr.hr.id,
        companyName: 'TestCorp'
      }
    })

    // --- Create tokens ---
    const secret = process.env.JWT_SECRET
    adminToken = `Bearer ${jwt.sign({ id: admin.id, role: 'ADMIN' }, secret)}`
    hrToken = `Bearer ${jwt.sign({ id: hr.id, role: 'EMPLOYER', hr: { id: hr.hr.id } }, secret)}`
    hr2Token = `Bearer ${jwt.sign({ id: hr2.id, role: 'EMPLOYER', hr: { id: hr2.hr.id } }, secret)}`
    studentToken = `Bearer ${jwt.sign({ id: student.id, role: 'STUDENT' }, secret)}`
  })

  afterAll(async () => {
    await prisma.application.deleteMany()
    await prisma.job.deleteMany()
    await prisma.student.deleteMany()
    await prisma.hR.deleteMany()
    await prisma.user.deleteMany()
    await prisma.degreeType.deleteMany()
    await prisma.$disconnect()
  })

  // ───────────────────────────────
  // GET /api/job
  // ───────────────────────────────
  describe('GET /api/job', () => {
    it('should return paginated jobs list', async () => {
      const res = await request(app).get('/api/job?page=1&pageSize=1')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.data.items)).toBe(true)
      expect(res.body.data.total).toBeGreaterThanOrEqual(2)
    })
  })

  // ───────────────────────────────
  // GET /api/job/:id
  // ───────────────────────────────
  describe('GET /api/job/:id', () => {
    it('should return job details', async () => {
      const res = await request(app).get(`/api/job/${job1.id}`)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data.id).toBe(job1.id)
    })
  })

  // ───────────────────────────────
  // POST /api/job
  // ───────────────────────────────
  describe('POST /api/job', () => {
    it('should allow HR to create a job', async () => {
      const newJob = {
        title: 'Data Engineer',
        description: 'ETL pipeline',
        location: 'Bangkok',
        workType: 'REMOTE'
      }

      const res = await request(app)
        .post('/api/job')
        .set('Authorization', hrToken)
        .send(newJob)

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.title).toBe('Data Engineer')
    })

    it('should not allow Student to create a job', async () => {
      const res = await request(app)
        .post('/api/job')
        .set('Authorization', studentToken)
        .send({ title: 'Hacker', description: 'bad', location: 'Mars' })

      expect(res.status).toBe(403)
      expect(res.body.success).toBe(false)
    })
  })

  // ───────────────────────────────
  // PATCH /api/job/:id
  // ───────────────────────────────
  describe('PATCH /api/job/:id', () => {
    it('should allow HR owner to update job', async () => {
      const res = await request(app)
        .patch(`/api/job/${job1.id}`)
        .set('Authorization', hrToken)
        .send({ title: 'Backend Engineer II' })

      expect(res.status).toBe(200)
      expect(res.body.data.title).toBe('Backend Engineer II')
    })

    it('should forbid Student update', async () => {
      const res = await request(app)
        .patch(`/api/job/${job1.id}`)
        .set('Authorization', studentToken)
        .send({ title: 'Hack' })

      expect(res.status).toBe(403)
    })
  })

  // ───────────────────────────────
  // DELETE /api/job/:id
  // ───────────────────────────────
  describe('DELETE /api/job/:id', () => {
    it('should allow Admin to delete any job', async () => {
      const res = await request(app)
        .delete(`/api/job/${job1.id}`)
        .set('Authorization', adminToken)

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    it('should allow HR owner to delete own job', async () => {
      const newJob = await prisma.job.create({
        data: {
          title: 'Temporary',
          description: 'Remove soon',
          location: 'Bangkok',
          workType: 'ONSITE',
          hrId: hr2.hr.id,
          companyName: 'OtherCorp'
        }
      })

      const res = await request(app)
        .delete(`/api/job/${newJob.id}`)
        .set('Authorization', hr2Token)

      expect(res.status).toBe(200)
    })

    it('should not allow another HR to delete', async () => {
      const res = await request(app)
        .delete(`/api/job/${job2.id}`)
        .set('Authorization', hr2Token)

      expect(res.status).toBe(403)
    })
  })

  // ───────────────────────────────
  // POST /api/job/:id (apply)
  // ───────────────────────────────
  describe('POST /api/job/:id', () => {
    it('should allow Student to apply', async () => {
      const res = await request(app)
        .post(`/api/job/${job2.id}`)
        .set('Authorization', studentToken)
        .send({ resumeUrl: 'resume.pdf' })

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('PENDING')
    })

    it('should reject duplicate application', async () => {
      await prisma.application.create({
        data: {
          jobId: job2.id,
          studentId: student.id,
          status: 'PENDING'
        }
      })

      const res = await request(app)
        .post(`/api/job/${job2.id}`)
        .set('Authorization', studentToken)
        .send({ resumeUrl: 'resume.pdf' })

      expect(res.status).toBe(409)
    })
  })

  // ───────────────────────────────
  // GET /api/job/:id/applyer
  // ───────────────────────────────
  describe('GET /api/job/:id/applyer', () => {
    it('should allow HR to view applicants', async () => {
      await prisma.application.create({
        data: {
          jobId: job2.id,
          studentId: student.id,
          status: 'PENDING'
        }
      })

      const res = await request(app)
        .get(`/api/job/${job2.id}/applyer`)
        .set('Authorization', hrToken)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBeGreaterThan(0)
    })
  })

  // ───────────────────────────────
  // POST /api/job/:id/applyer (manage)
  // ───────────────────────────────
  describe('POST /api/job/:id/applyer', () => {
    it('should allow HR to update applicant status', async () => {
      const application = await prisma.application.create({
        data: {
          jobId: job2.id,
          studentId: student.id,
          status: 'PENDING'
        }
      })

      const res = await request(app)
        .post(`/api/job/${job2.id}/applyer`)
        .set('Authorization', hrToken)
        .send({ applicationId: application.id, status: 'QUALIFIED' })

      expect(res.status).toBe(200)
      expect(res.body.data.status).toBe('QUALIFIED')
    })
  })
})
