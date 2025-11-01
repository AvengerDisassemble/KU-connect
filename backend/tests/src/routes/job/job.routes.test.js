/**
 * @fileoverview Integration tests for Job routes (Express + Prisma + Supertest)
 * @module tests/routes/job/job.routes.test
 */

// IMPORTANT: Set environment variable BEFORE requiring any modules
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'testsecret'

const request = require('supertest')
const prisma = require('../../../../src/models/prisma')

// Clear the require cache for auth-related modules to ensure they pick up the env var
Object.keys(require.cache).forEach(key => {
  if (key.includes('tokenUtils') || key.includes('authMiddleware') || key.includes('authService')) {
    delete require.cache[key]
  }
})

const app = require('../../../../src/app')
const { createTestToken, TEST_DEGREE_TYPES } = require('../../utils/testHelpers')

jest.setTimeout(30000) // give DB setup more time

describe('Job Routes (Integration)', () => {
  let admin, hr, hr2, student
  let job1, job2
  let adminToken, hrToken, hr2Token, studentToken
  let degreeType // Store degreeType at module level to ensure accessibility

  /**
   * Clean and seed database
   */
  beforeAll(async () => {
    // --- DO NOT clean all data - tests share database state ---
    // --- Only seed data if it doesn't exist ---
    
    // Use upsert for degreeType to handle race conditions
    degreeType = await prisma.degreeType.upsert({
      where: { name: TEST_DEGREE_TYPES.BACHELOR },
      update: {},
      create: { name: TEST_DEGREE_TYPES.BACHELOR }
    })

    // Use upsert for atomic user creation to avoid race conditions
    admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: { status: 'APPROVED' },
      create: {
        name: "Admin",
        surname: "User",
        email: "admin@test.com",
        password: "Pass",
        role: "ADMIN",
        status: "APPROVED",
        admin: {
          create: {}
        }
      }
    })

    hr = await prisma.user.upsert({
      where: { email: 'hr@test.com' },
      update: { status: 'APPROVED' },
      create: {
        name: 'HR',
        surname: 'User',
        email: 'hr@test.com',
        password: 'Pass',
        role: 'EMPLOYER',
        status: 'APPROVED',
        hr: {
          create: {
            companyName: 'TestCorp',
            address: 'Bangkok',
            industry: 'IT_SOFTWARE',
            companySize: 'ELEVEN_TO_FIFTY',
            phoneNumber: '02-111-2222'
          }
        }
      },
      include: { hr: true }
    })

    hr2 = await prisma.user.upsert({
      where: { email: 'hr2@test.com' },
      update: { status: 'APPROVED' },
      create: {
        name: 'HR2',
        surname: 'User',
        email: 'hr2@test.com',
        password: 'Pass',
        role: 'EMPLOYER',
        status: 'APPROVED',
        hr: {
          create: {
            companyName: 'OtherCorp',
            address: 'Bangkok',
            industry: 'IT_SOFTWARE',
            companySize: 'ELEVEN_TO_FIFTY',
            phoneNumber: '02-333-4444'
          }
        }
      },
      include: { hr: true }
    })

    student = await prisma.user.upsert({
      where: { email: 'student@test.com' },
      update: { status: 'APPROVED' },
      create: {
        name: 'Student',
        surname: 'User',
        email: 'student@test.com',
        password: 'Pass',
        role: 'STUDENT',
        status: 'APPROVED',
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

    // Find or create job1
    job1 = await prisma.job.findFirst({
      where: { 
        title: 'Backend Engineer',
        hrId: hr.hr.id
      }
    })
    if (!job1) {
      job1 = await prisma.job.create({
        data: {
          title: 'Backend Engineer',
          description: 'Node.js',
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
    }

    // Find or create job2
    job2 = await prisma.job.findFirst({
      where: { 
        title: 'Frontend Engineer',
        hrId: hr.hr.id
      }
    })
    if (!job2) {
      job2 = await prisma.job.create({
        data: {
          title: 'Frontend Engineer',
          description: 'React',
          location: 'Bangkok',
          jobType: 'full-time',
          workArrangement: 'hybrid',
          duration: '1-year',
          minSalary: 35000,
          maxSalary: 55000,
          application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          phone_number: '+66812345679',
          hrId: hr.hr.id,
          companyName: 'TestCorp'
        }
      })
    }

    // --- Create tokens ---
    adminToken = createTestToken({ id: admin.id, role: 'ADMIN' })
    hrToken = createTestToken({ id: hr.id, role: 'EMPLOYER', hr: { id: hr.hr.id } })
    hr2Token = createTestToken({ id: hr2.id, role: 'EMPLOYER', hr: { id: hr2.hr.id } })
    studentToken = createTestToken({ id: student.id, role: 'STUDENT' })
  })

  // Clean up applications between tests to avoid duplicates
  // Only delete applications for THIS test file's student to avoid interfering with other test files
  beforeEach(async () => {
    if (student?.student?.id) {
      await prisma.application.deleteMany({
        where: { studentId: student.student.id }
      })
    }
  })

  afterAll(async () => {
    // Disconnect from database (cleanup removed to avoid conflicts with other test files)
    await prisma.$disconnect()
  })

  // ───────────────────────────────
  // POST /api/job/list - List jobs with filters
  // ───────────────────────────────
  describe('POST /api/job/list', () => {
    it('should return paginated jobs list', async () => {
      const res = await request(app)
        .post('/api/job/list')
        .set('Authorization', studentToken) // All job routes require auth
        .send({ page: 1, pageSize: 1 }) // Send filters in body instead of query
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
      const res = await request(app)
        .get(`/api/job/${job1.id}`)
        .set('Authorization', studentToken) // All job routes require auth
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
        description: 'ETL pipeline development',
        location: 'Bangkok',
        jobType: 'full-time',
        workArrangement: 'remote', // Correct field name (not workType)
        duration: '1-year',
        minSalary: 50000,
        maxSalary: 80000,
        application_deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days from now
        phone_number: '+66812345678'
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
      // Create a temporary job for this test
      const tempJob = await prisma.job.create({
        data: {
          title: 'Admin Delete Test',
          description: 'Will be deleted by admin',
          location: 'Bangkok',
          jobType: 'contract',
          workArrangement: 'on-site',
          duration: '3-month',
          minSalary: 30000,
          maxSalary: 45000,
          application_deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          phone_number: '+66812345681',
          hrId: hr.hr.id,
          companyName: 'TestCorp'
        }
      })

      const res = await request(app)
        .delete(`/api/job/${tempJob.id}`)
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
          jobType: 'contract',
          workArrangement: 'on-site',
          duration: '3-month',
          minSalary: 30000,
          maxSalary: 45000,
          application_deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          phone_number: '+66812345680',
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
      // Create a temporary job owned by hr (not hr2)
      const jobOwnedByHr = await prisma.job.create({
        data: {
          title: 'HR1 Job',
          description: 'Owned by hr1, hr2 should not be able to delete',
          location: 'Bangkok',
          jobType: 'contract',
          workArrangement: 'on-site',
          duration: '3-month',
          minSalary: 30000,
          maxSalary: 45000,
          application_deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          phone_number: '+66812345682',
          hrId: hr.hr.id,
          companyName: 'TestCorp'
        }
      })

      const res = await request(app)
        .delete(`/api/job/${jobOwnedByHr.id}`)
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
        .send({ resumeLink: 'https://example.com/resume.pdf' }) // Correct field name and valid URL

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.data.status).toBe('PENDING')
    })

    it('should reject duplicate application', async () => {
      // Create application directly (the test above already created one via API)
      // But we need to ensure we have the student ID
      const studentRecord = await prisma.student.findFirst({
        where: { userId: student.id }
      })

      await prisma.application.create({
        data: {
          jobId: job2.id,
          studentId: studentRecord.id,
          status: 'PENDING'
        }
      })

      const res = await request(app)
        .post(`/api/job/${job2.id}`)
        .set('Authorization', studentToken)
        .send({ resumeLink: 'https://example.com/resume.pdf' }) // Correct field name and valid URL

      expect(res.status).toBe(409)
    })
  })

  // ───────────────────────────────
  // GET /api/job/:id/applyer
  // ───────────────────────────────
  describe('GET /api/job/:id/applyer', () => {
    it('should allow HR to view applicants', async () => {
      // Get student record ID
      const studentRecord = await prisma.student.findFirst({
        where: { userId: student.id }
      })

      await prisma.application.create({
        data: {
          jobId: job2.id,
          studentId: studentRecord.id,
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
      // Get student record ID
      const studentRecord = await prisma.student.findFirst({
        where: { userId: student.id }
      })

      const application = await prisma.application.create({
        data: {
          jobId: job2.id,
          studentId: studentRecord.id,
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
