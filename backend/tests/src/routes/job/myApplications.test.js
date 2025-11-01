/**
 * @module tests/routes/job/myApplications
 * @description Integration tests for UC-S09: Check Application Status
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
const { createTestToken, TEST_DEGREE_TYPES, TEST_EMAILS, TEST_COMPANY_INFO } = require('../../utils/testHelpers')

describe('Student Applications (UC-S09: Check Application Status)', () => {
  let degreeType
  let student, student2
  let hr
  let job1, job2
  let studentToken, student2Token

  /**
   * Setup test data before all tests
   */
  beforeAll(async () => {
    // Use upsert for degreeType to handle race conditions
    degreeType = await prisma.degreeType.upsert({
      where: { name: TEST_DEGREE_TYPES.BACHELOR },
      update: {},
      create: { name: TEST_DEGREE_TYPES.BACHELOR }
    })

    // Create students (using unique emails to avoid conflicts with other test files)
    student = await prisma.user.upsert({
      where: { email: TEST_EMAILS.STUDENT_MYAPP },
      update: { status: 'APPROVED' },
      create: {
        name: 'Student',
        surname: 'MyApp',
        email: TEST_EMAILS.STUDENT_MYAPP,
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

    student2 = await prisma.user.upsert({
      where: { email: TEST_EMAILS.STUDENT2_MYAPP },
      update: { status: 'APPROVED' },
      create: {
        name: 'Student2',
        surname: 'MyApp',
        email: TEST_EMAILS.STUDENT2_MYAPP,
        password: 'Pass',
        role: 'STUDENT',
        status: 'APPROVED',
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

    // Create HR (using unique email to avoid conflicts with other test files)
    hr = await prisma.user.upsert({
      where: { email: TEST_EMAILS.HR_MYAPP },
      update: { status: 'APPROVED' },
      create: {
        name: 'HR',
        surname: 'MyApp',
        email: TEST_EMAILS.HR_MYAPP,
        password: 'Pass',
        role: 'EMPLOYER',
        status: 'APPROVED',
        hr: {
          create: {
            companyName: TEST_COMPANY_INFO.NAME + ' MyApp',
            address: TEST_COMPANY_INFO.ADDRESS,
            industry: TEST_COMPANY_INFO.INDUSTRY,
            companySize: TEST_COMPANY_INFO.SIZE,
            phoneNumber: '02-777-8888'
          }
        }
      },
      include: { hr: true }
    })

    // Create jobs
    job1 = await prisma.job.findFirst({
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

    job2 = await prisma.job.findFirst({
      where: {
        title: 'Frontend Developer',
        hrId: hr.hr.id
      }
    }) || await prisma.job.create({
      data: {
        title: 'Frontend Developer',
        description: 'React development',
        location: 'Bangkok',
        jobType: 'full-time',
        workArrangement: 'remote',
        duration: '12-month',
        minSalary: 35000,
        maxSalary: 55000,
        application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        phone_number: '+66812345679',
        hrId: hr.hr.id,
        companyName: 'TestCorp'
      }
    })

    // Generate tokens (use 'id' not 'userId', and include 'Bearer ' prefix)
    studentToken = createTestToken({ id: student.id, role: student.role })
    student2Token = createTestToken({ id: student2.id, role: student2.role })
  })

  /**
   * Disconnect Prisma after all tests
   */
  afterAll(async () => {
    // Clean up applications from this test's students
    if (student?.student?.id) {
      await prisma.application.deleteMany({
        where: { studentId: student.student.id }
      })
    }
    if (student2?.student?.id) {
      await prisma.application.deleteMany({
        where: { studentId: student2.student.id }
      })
    }
    await prisma.$disconnect()
  })

  // ===================== UC-S09: Main Success Scenario =====================

  describe('GET /api/job/my-applications', () => {
    it('should return empty array when student has no applications', async () => {
      // Clean up first to ensure empty state
      await prisma.application.deleteMany({
        where: { studentId: student.student.id }
      })

      const response = await request(app)
        .get('/api/job/my-applications')
        .set('Authorization', studentToken)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('No applications submitted yet')
      expect(response.body.data).toEqual([])
    })

    it('should return all applications for student with correct statuses', async () => {
      // Clean up first to ensure known state
      await prisma.application.deleteMany({
        where: { studentId: student.student.id }
      })

      // Create applications with different statuses
      await prisma.application.create({
        data: {
          jobId: job1.id,
          studentId: student.student.id,
          status: 'PENDING'
        }
      })

      await prisma.application.create({
        data: {
          jobId: job2.id,
          studentId: student.student.id,
          status: 'QUALIFIED'
        }
      })

      const response = await request(app)
        .get('/api/job/my-applications')
        .set('Authorization', studentToken)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Applications retrieved successfully')
      expect(response.body.data).toHaveLength(2)

      // Check first application (most recent)
      const app1 = response.body.data[0]
      expect(app1).toHaveProperty('id')
      expect(app1).toHaveProperty('status')
      expect(app1).toHaveProperty('appliedAt')
      expect(app1).toHaveProperty('updatedAt')
      expect(app1.job).toHaveProperty('id')
      expect(app1.job).toHaveProperty('title')
      expect(app1.job).toHaveProperty('companyName', 'TestCorp')
      expect(app1.job).toHaveProperty('location')
      expect(app1.job).toHaveProperty('jobType')
      expect(app1.job).toHaveProperty('workArrangement')
      expect(app1.job).toHaveProperty('minSalary')
      expect(app1.job).toHaveProperty('maxSalary')
      expect(app1.job).toHaveProperty('hrName')
      expect(Array.isArray(app1.job.tags)).toBe(true)

      // Verify statuses
      const statuses = response.body.data.map(a => a.status)
      expect(statuses).toContain('PENDING')
      expect(statuses).toContain('QUALIFIED')
    })

    it('should return only the authenticated student\'s applications', async () => {
      // Clean up first to ensure known state
      await prisma.application.deleteMany({
        where: {
          OR: [
            { studentId: student.student.id },
            { studentId: student2.student.id }
          ]
        }
      })

      // Student 1 applies to job1
      await prisma.application.create({
        data: {
          jobId: job1.id,
          studentId: student.student.id,
          status: 'PENDING'
        }
      })

      // Student 2 applies to job2
      await prisma.application.create({
        data: {
          jobId: job2.id,
          studentId: student2.student.id,
          status: 'QUALIFIED'
        }
      })

      // Student 1 checks their applications
      const response = await request(app)
        .get('/api/job/my-applications')
        .set('Authorization', studentToken)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].job.title).toBe('Backend Developer')
    })

    it('should return applications ordered by most recent first', async () => {
      // Clean up existing applications for this student first
      await prisma.application.deleteMany({
        where: { studentId: student.student.id }
      })

      // Create applications with time gaps
      const app1 = await prisma.application.create({
        data: {
          jobId: job1.id,
          studentId: student.student.id,
          status: 'PENDING'
        }
      })

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100))

      const app2 = await prisma.application.create({
        data: {
          jobId: job2.id,
          studentId: student.student.id,
          status: 'QUALIFIED'
        }
      })

      const response = await request(app)
        .get('/api/job/my-applications')
        .set('Authorization', studentToken)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(2)

      // Most recent should be first
      const firstApp = response.body.data[0]
      const secondApp = response.body.data[1]
      expect(new Date(firstApp.appliedAt).getTime()).toBeGreaterThan(
        new Date(secondApp.appliedAt).getTime()
      )
    })

    it('should include all three possible statuses: PENDING, QUALIFIED, REJECTED', async () => {
      // Clean up existing applications for this student first
      await prisma.application.deleteMany({
        where: { studentId: student.student.id }
      })

      // Create three jobs for three different statuses
      const job3 = await prisma.job.create({
        data: {
          title: 'DevOps Engineer',
          description: 'DevOps work',
          location: 'Bangkok',
          jobType: 'full-time',
          workArrangement: 'hybrid',
          duration: '12-month',
          minSalary: 45000,
          maxSalary: 65000,
          application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          phone_number: '+66812345680',
          hrId: hr.hr.id,
          companyName: 'TestCorp'
        }
      })

      await prisma.application.create({
        data: { jobId: job1.id, studentId: student.student.id, status: 'PENDING' }
      })

      await prisma.application.create({
        data: { jobId: job2.id, studentId: student.student.id, status: 'QUALIFIED' }
      })

      await prisma.application.create({
        data: { jobId: job3.id, studentId: student.student.id, status: 'REJECTED' }
      })

      const response = await request(app)
        .get('/api/job/my-applications')
        .set('Authorization', studentToken)

      expect(response.status).toBe(200)
      expect(response.body.data).toHaveLength(3)

      const statuses = response.body.data.map(a => a.status)
      expect(statuses).toContain('PENDING')
      expect(statuses).toContain('QUALIFIED')
      expect(statuses).toContain('REJECTED')
    })
  })

  // ===================== Authorization Tests =====================

  describe('Authorization', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/job/my-applications')

      expect(response.status).toBe(401)
    })

    it('should only allow STUDENT role', async () => {
      const hrToken = createTestToken({ id: hr.id, role: 'EMPLOYER' })

      const response = await request(app)
        .get('/api/job/my-applications')
        .set('Authorization', hrToken)

      expect(response.status).toBe(403)
    })
  })
})
