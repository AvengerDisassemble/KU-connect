/**
 * @fileoverview Integration tests for Student Dashboard
 * Tests dashboard data retrieval, structure, and sections for STUDENT role
 */

const request = require('supertest')
const prisma = require('../../../../src/models/prisma')
const app = require('../../../../src/app')
const { cleanupDatabase, createTestToken, TEST_DEGREE_TYPES } = require('../../utils/testHelpers')

jest.setTimeout(30000)

let degreeType
let studentUser, hrUser, employerUser
let studentToken, employerToken
let testJobs = []
let testApplications = []

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret'

  await cleanupDatabase(prisma, { logSuccess: false })

  // Create degree type
  degreeType = await prisma.degreeType.create({
    data: { name: TEST_DEGREE_TYPES.BACHELOR }
  })

  // Create student user
  studentUser = await prisma.user.create({
    data: {
      name: 'Student',
      surname: 'Dashboard',
      email: 'student-dash@test.com',
      username: 'student_dash',
      password: 'Pass123',
      role: 'STUDENT',
      status: 'APPROVED',
      verified: true,
      student: {
        create: {
          degreeTypeId: degreeType.id,
          address: 'Bangkok, Thailand',
          gpa: 3.5,
          expectedGraduationYear: 2026
        }
      }
    },
    include: { student: true }
  })
  studentToken = createTestToken({ id: studentUser.id, role: 'STUDENT' })

  // Create HR user
  hrUser = await prisma.user.create({
    data: {
      name: 'HR',
      surname: 'Dashboard',
      email: 'hr-dash@test.com',
      username: 'hr_dash',
      password: 'Pass123',
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName: 'DashCorp',
          industry: 'IT_SOFTWARE',
          companySize: 'ELEVEN_TO_FIFTY',
          address: 'Bangkok Office',
          phoneNumber: '02-123-4567'
        }
      }
    },
    include: { hr: true }
  })
  employerToken = createTestToken({ id: hrUser.id, role: 'EMPLOYER' })

  // Create test jobs
  const hrData = await prisma.hR.findUnique({ where: { userId: hrUser.id } })
  const futureDeadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

  for (let i = 1; i <= 7; i++) {
    const job = await prisma.job.create({
      data: {
        hrId: hrData.id,
        title: `Job Position ${i}`,
        companyName: 'DashCorp',
        description: `Test job ${i}`,
        location: 'Bangkok, Thailand',
        jobType: 'full-time',
        workArrangement: 'hybrid',
        duration: 'Permanent',
        minSalary: 40000,
        maxSalary: 60000,
        application_deadline: futureDeadline,
        email: hrUser.email,
        phone_number: '02-123-4567'
      }
    })
    testJobs.push(job)
  }

  // Create test applications with different statuses
  const student = await prisma.student.findUnique({ where: { userId: studentUser.id } })
  
  const statuses = ['PENDING', 'PENDING', 'QUALIFIED', 'REJECTED', 'QUALIFIED']
  for (let i = 0; i < 5; i++) {
    const application = await prisma.application.create({
      data: {
        studentId: student.id,
        jobId: testJobs[i].id,
        status: statuses[i]
      }
    })
    testApplications.push(application)
  }

  // Create student preferences for recommendations
  await prisma.studentPreference.create({
    data: {
      studentId: student.id,
      desiredLocation: 'Bangkok',
      minSalary: 35000,
      industry: 'IT_SOFTWARE',
      jobType: 'full-time',
      remoteWork: 'hybrid'
    }
  })
})

afterAll(async () => {
  await cleanupDatabase(prisma, { logSuccess: false })
  await prisma.$disconnect()
})

describe('Student Dashboard - Integration Tests', () => {
  
  // ============================================
  // 1. Authentication & Authorization
  // ============================================
  describe('Authentication & Authorization', () => {
    
    it('should require authentication (401 without token)', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .expect(401)
      
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/token|authentication|unauthorized/i)
    })

    it('should allow STUDENT role', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      expect(res.body.success).toBe(true)
      expect(res.body.data.userRole).toBe('STUDENT')
    })

    it('should return student dashboard data', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      expect(res.body.data).toHaveProperty('dashboard')
      expect(res.body.data.dashboard).toHaveProperty('totals')
      expect(res.body.data.dashboard).toHaveProperty('applicationStats')
      expect(res.body.data.dashboard).toHaveProperty('recentJobs')
      expect(res.body.data.dashboard).toHaveProperty('myApplications')
      expect(res.body.data.dashboard).toHaveProperty('recommendedJobs')
    })
  })

  // ============================================
  // 2. Dashboard Structure
  // ============================================
  describe('Dashboard Structure', () => {
    
    it('should return correct response structure', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      expect(res.body).toHaveProperty('success', true)
      expect(res.body).toHaveProperty('message')
      expect(res.body).toHaveProperty('data')
      expect(res.body.data).toHaveProperty('userRole')
      expect(res.body.data).toHaveProperty('timestamp')
    })

    it('should include userRole = STUDENT', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      expect(res.body.data.userRole).toBe('STUDENT')
    })

    it('should include all dashboard sections', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { dashboard } = res.body.data
      expect(dashboard).toHaveProperty('totals')
      expect(dashboard).toHaveProperty('applicationStats')
      expect(dashboard).toHaveProperty('recentJobs')
      expect(dashboard).toHaveProperty('myApplications')
      expect(dashboard).toHaveProperty('recommendedJobs')
      expect(dashboard).toHaveProperty('quickActions')
    })

    it('should include timestamp', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      expect(res.body.data).toHaveProperty('timestamp')
      expect(typeof res.body.data.timestamp).toBe('string')
      
      // Verify it's a valid ISO date string
      const date = new Date(res.body.data.timestamp)
      expect(date.toString()).not.toBe('Invalid Date')
    })
  })

  // ============================================
  // 3. Totals Section
  // ============================================
  describe('Totals Section', () => {
    
    it('should return correct total jobs count', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      expect(res.body.data.dashboard.totals).toHaveProperty('jobs')
      expect(res.body.data.dashboard.totals.jobs).toBe(testJobs.length)
    })

    it('should count all jobs in database', async () => {
      const totalJobs = await prisma.job.count()
      
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      expect(res.body.data.dashboard.totals.jobs).toBe(totalJobs)
    })
  })

  // ============================================
  // 4. Application Stats
  // ============================================
  describe('Application Stats', () => {
    
    it('should group applications by status', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { applicationStats } = res.body.data.dashboard
      expect(applicationStats).toHaveProperty('total')
      expect(applicationStats).toHaveProperty('submitted')
      expect(applicationStats).toHaveProperty('qualified')
      expect(applicationStats).toHaveProperty('rejected')
      expect(applicationStats).toHaveProperty('hired')
    })

    it('should return correct application counts', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { applicationStats } = res.body.data.dashboard
      
      // We created: 2 PENDING, 2 QUALIFIED, 1 REJECTED (HIRED changed to QUALIFIED)
      expect(applicationStats.total).toBe(5)
      expect(applicationStats.submitted).toBe(2) // PENDING count
      expect(applicationStats.qualified).toBe(2)
      expect(applicationStats.rejected).toBe(1)
      expect(applicationStats.hired).toBe(0) // Always 0 in current implementation
    })

    it('should calculate correct totals', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { applicationStats } = res.body.data.dashboard
      const sum = applicationStats.submitted + 
                  applicationStats.qualified + 
                  applicationStats.rejected + 
                  applicationStats.hired
      
      expect(applicationStats.total).toBe(sum)
    })
  })

  // ============================================
  // 5. Recent Jobs
  // ============================================
  describe('Recent Jobs', () => {
    
    it('should return last 5 jobs', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { recentJobs } = res.body.data.dashboard
      expect(recentJobs.length).toBeLessThanOrEqual(5)
    })

    it('should include HR company name', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { recentJobs } = res.body.data.dashboard
      expect(recentJobs.length).toBeGreaterThan(0)
      
      recentJobs.forEach(job => {
        expect(job).toHaveProperty('hr')
        expect(job.hr).toHaveProperty('companyName')
        expect(job.hr.companyName).toBe('DashCorp')
      })
    })

    it('should order by createdAt DESC', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { recentJobs } = res.body.data.dashboard
      
      // Check ordering (newer jobs first)
      for (let i = 1; i < recentJobs.length; i++) {
        const currentDate = new Date(recentJobs[i - 1].createdAt)
        const nextDate = new Date(recentJobs[i].createdAt)
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime())
      }
    })

    it('should include required fields', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { recentJobs } = res.body.data.dashboard
      expect(recentJobs.length).toBeGreaterThan(0)
      
      recentJobs.forEach(job => {
        expect(job).toHaveProperty('id')
        expect(job).toHaveProperty('title')
        expect(job).toHaveProperty('location')
        expect(job).toHaveProperty('jobType')
        expect(job).toHaveProperty('application_deadline')
        expect(job).toHaveProperty('hr')
        expect(job.hr).toHaveProperty('companyName')
      })
    })
  })

  // ============================================
  // 6. My Applications
  // ============================================
  describe('My Applications', () => {
    
    it('should return student\'s applications only', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { myApplications } = res.body.data.dashboard
      expect(myApplications.length).toBeGreaterThan(0)
      expect(myApplications.length).toBe(testApplications.length)
    })

    it('should return last 5 applications', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { myApplications } = res.body.data.dashboard
      expect(myApplications.length).toBeLessThanOrEqual(5)
    })

    it('should include job details', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { myApplications } = res.body.data.dashboard
      expect(myApplications.length).toBeGreaterThan(0)
      
      myApplications.forEach(application => {
        expect(application).toHaveProperty('job')
        expect(application.job).toHaveProperty('title')
        expect(application.job).toHaveProperty('location')
        expect(application.job).toHaveProperty('hr')
        expect(application.job.hr).toHaveProperty('companyName')
      })
    })

    it('should include application status', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { myApplications } = res.body.data.dashboard
      
      myApplications.forEach(application => {
        expect(application).toHaveProperty('status')
        expect(['PENDING', 'QUALIFIED', 'REJECTED']).toContain(application.status)
      })
    })

    it('should order by application date DESC', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { myApplications } = res.body.data.dashboard
      
      // Check ordering
      for (let i = 1; i < myApplications.length; i++) {
        const currentDate = new Date(myApplications[i - 1].createdAt)
        const nextDate = new Date(myApplications[i].createdAt)
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime())
      }
    })
  })

  // ============================================
  // 7. Recommended Jobs
  // ============================================
  describe('Recommended Jobs', () => {
    
    it('should return up to 10 jobs', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { recommendedJobs } = res.body.data.dashboard
      expect(recommendedJobs.length).toBeLessThanOrEqual(10)
    })

    it('should filter by student preferences', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { recommendedJobs } = res.body.data.dashboard
      expect(recommendedJobs.length).toBeGreaterThan(0)
      
      // All recommendations should have basic job properties
      recommendedJobs.forEach(job => {
        expect(job).toHaveProperty('id')
        expect(job).toHaveProperty('title')
        expect(job).toHaveProperty('location')
        expect(job).toHaveProperty('companyName')
      })
    })

    it('should exclude expired jobs', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { recommendedJobs } = res.body.data.dashboard
      
      recommendedJobs.forEach(job => {
        const deadline = new Date(job.application_deadline)
        expect(deadline.getTime()).toBeGreaterThan(Date.now())
      })
    })

    it('should work with no preferences (fallback to address)', async () => {
      // Create new student without preferences
      const newStudent = await prisma.user.create({
        data: {
          name: 'Student',
          surname: 'NoPref',
          email: 'student-nopref@test.com',
          username: 'student_nopref',
          password: 'Pass123',
          role: 'STUDENT',
          status: 'APPROVED',
          verified: true,
          student: {
            create: {
              degreeTypeId: degreeType.id,
              address: 'Bangkok',
              gpa: 3.0,
              expectedGraduationYear: 2027
            }
          }
        }
      })
      const newStudentToken = createTestToken({ id: newStudent.id, role: 'STUDENT' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', newStudentToken)
        .expect(200)
      
      const { recommendedJobs } = res.body.data.dashboard
      expect(recommendedJobs.length).toBeGreaterThan(0)
      
      // Should use address for location filtering
      recommendedJobs.forEach(job => {
        expect(job.location.toLowerCase()).toContain('bangkok')
      })

      // Cleanup
      await prisma.student.delete({ where: { userId: newStudent.id } })
      await prisma.user.delete({ where: { id: newStudent.id } })
    })
  })

  // ============================================
  // 8. Quick Actions
  // ============================================
  describe('Quick Actions', () => {
    
    it('should return predefined action list', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { quickActions } = res.body.data.dashboard
      expect(Array.isArray(quickActions)).toBe(true)
      expect(quickActions.length).toBeGreaterThan(0)
    })

    it('should include expected student actions', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { quickActions } = res.body.data.dashboard
      
      expect(quickActions).toContain('Browse Jobs')
      expect(quickActions).toContain('Update Preferences')
      expect(quickActions).toContain('View Applications')
    })

    it('should return quickActions as array of strings', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const { quickActions } = res.body.data.dashboard
      
      expect(Array.isArray(quickActions)).toBe(true)
      quickActions.forEach(action => {
        expect(typeof action).toBe('string')
      })
    })
  })

  // ============================================
  // 9. Student with No Applications
  // ============================================
  describe('Student with No Applications', () => {
    
    it('should return zeros for student with no applications', async () => {
      // Create new student without applications
      const newStudent = await prisma.user.create({
        data: {
          name: 'Student',
          surname: 'NoApp',
          email: 'student-noapp@test.com',
          username: 'student_noapp',
          password: 'Pass123',
          role: 'STUDENT',
          status: 'APPROVED',
          verified: true,
          student: {
            create: {
              degreeTypeId: degreeType.id,
              address: 'Bangkok',
              gpa: 3.0,
              expectedGraduationYear: 2027
            }
          }
        }
      })
      const newStudentToken = createTestToken({ id: newStudent.id, role: 'STUDENT' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', newStudentToken)
        .expect(200)
      
      const { applicationStats, myApplications } = res.body.data.dashboard
      
      expect(applicationStats.total).toBe(0)
      expect(applicationStats.submitted).toBe(0)
      expect(applicationStats.qualified).toBe(0)
      expect(applicationStats.rejected).toBe(0)
      expect(applicationStats.hired).toBe(0)
      expect(myApplications.length).toBe(0)

      // Cleanup
      await prisma.student.delete({ where: { userId: newStudent.id } })
      await prisma.user.delete({ where: { id: newStudent.id } })
    })
  })
})