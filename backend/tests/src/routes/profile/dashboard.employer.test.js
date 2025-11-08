/**
 * @fileoverview Integration tests for Employer Dashboard
 * Tests dashboard data retrieval, structure, and sections for EMPLOYER role
 */

const request = require('supertest')
const prisma = require('../../../../src/models/prisma')
const app = require('../../../../src/app')
const { cleanupDatabase, createTestToken, TEST_DEGREE_TYPES } = require('../../utils/testHelpers')

jest.setTimeout(30000)

let degreeType
let studentUser1, studentUser2, hrUser
let hrToken
let testJobs = []
let testApplications = []

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret'

  await cleanupDatabase(prisma, { logSuccess: false })

  // Create degree type
  degreeType = await prisma.degreeType.create({
    data: { name: TEST_DEGREE_TYPES.BACHELOR }
  })

  // Create HR user
  hrUser = await prisma.user.create({
    data: {
      name: 'HR',
      surname: 'EmployerDash',
      email: 'hr-empdash@test.com',
      username: 'hr_empdash',
      password: 'Pass123',
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName: 'EmployerDashCorp',
          description: 'Leading tech company',
          industry: 'IT_SOFTWARE',
          companySize: 'FIFTY_ONE_TO_TWO_HUNDRED',
          address: 'Bangkok Office',
          website: 'https://empdashcorp.com',
          phoneNumber: '02-123-4567'
        }
      }
    },
    include: { hr: true }
  })
  hrToken = createTestToken({ id: hrUser.id, role: 'EMPLOYER' })

  // Create another HR user (for isolation testing)
  const otherHR = await prisma.user.create({
    data: {
      name: 'Other',
      surname: 'HR',
      email: 'other-hr@test.com',
      username: 'other_hr',
      password: 'Pass123',
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName: 'OtherCorp',
          industry: 'E_COMMERCE',
          companySize: 'ONE_TO_TEN',
          address: 'Chiang Mai',
          phoneNumber: '02-999-9999'
        }
      }
    }
  })

  // Create student users
  studentUser1 = await prisma.user.create({
    data: {
      name: 'Student',
      surname: 'One',
      email: 'student1-empdash@test.com',
      username: 'student1_empdash',
      password: 'Pass123',
      role: 'STUDENT',
      status: 'APPROVED',
      verified: true,
      student: {
        create: {
          degreeTypeId: degreeType.id,
          address: 'Bangkok',
          gpa: 3.7,
          expectedGraduationYear: 2026
        }
      }
    },
    include: { student: true }
  })

  studentUser2 = await prisma.user.create({
    data: {
      name: 'Student',
      surname: 'Two',
      email: 'student2-empdash@test.com',
      username: 'student2_empdash',
      password: 'Pass123',
      role: 'STUDENT',
      status: 'APPROVED',
      verified: true,
      student: {
        create: {
          degreeTypeId: degreeType.id,
          address: 'Chiang Mai',
          gpa: 3.2,
          expectedGraduationYear: 2025
        }
      }
    },
    include: { student: true }
  })

  // Create test jobs for this HR
  const hrData = await prisma.hR.findUnique({ where: { userId: hrUser.id } })
  const otherHRData = await prisma.hR.findUnique({ where: { userId: otherHR.id } })
  
  const futureDeadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  const expiredDeadline = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)

  // Create 6 jobs for this employer (5 active + 1 expired)
  for (let i = 1; i <= 5; i++) {
    const job = await prisma.job.create({
      data: {
        hrId: hrData.id,
        title: `Active Position ${i}`,
        companyName: 'EmployerDashCorp',
        description: `Active job ${i}`,
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

  // Create 1 expired job
  const expiredJob = await prisma.job.create({
    data: {
      hrId: hrData.id,
      title: 'Expired Position',
      companyName: 'EmployerDashCorp',
      description: 'Expired job',
      location: 'Bangkok, Thailand',
      jobType: 'full-time',
      workArrangement: 'on-site',
      duration: 'Permanent',
      minSalary: 35000,
      maxSalary: 55000,
      application_deadline: expiredDeadline,
      email: hrUser.email,
      phone_number: '02-123-4567'
    }
  })
  testJobs.push(expiredJob)

  // Create job for other HR (should not appear in dashboard)
  await prisma.job.create({
    data: {
      hrId: otherHRData.id,
      title: 'Other Company Job',
      companyName: 'OtherCorp',
      description: 'Other job',
      location: 'Chiang Mai',
      jobType: 'part-time',
      workArrangement: 'remote',
      duration: 'Flexible',
      minSalary: 25000,
      maxSalary: 40000,
      application_deadline: futureDeadline,
      email: otherHR.email,
      phone_number: '02-999-9999'
    }
  })

  // Create applications to this employer's jobs
  const student1 = await prisma.student.findUnique({ where: { userId: studentUser1.id } })
  const student2 = await prisma.student.findUnique({ where: { userId: studentUser2.id } })
  
  const statuses = ['PENDING', 'PENDING', 'QUALIFIED', 'REJECTED']
  
  // Student 1 applies to first 2 jobs
  for (let i = 0; i < 2; i++) {
    const application = await prisma.application.create({
      data: {
        studentId: student1.id,
        jobId: testJobs[i].id,
        status: statuses[i]
      }
    })
    testApplications.push(application)
  }

  // Student 2 applies to next 2 jobs
  for (let i = 2; i < 4; i++) {
    const application = await prisma.application.create({
      data: {
        studentId: student2.id,
        jobId: testJobs[i].id,
        status: statuses[i]
      }
    })
    testApplications.push(application)
  }
})

afterAll(async () => {
  await cleanupDatabase(prisma, { logSuccess: false })
  await prisma.$disconnect()
})

describe('Employer Dashboard - Integration Tests', () => {
  
  // ============================================
  // 1. Authentication & Authorization
  // ============================================
  describe('Authentication & Authorization', () => {
    
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .expect(401)
      
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/token|authentication|unauthorized/i)
    })

    it('should allow EMPLOYER role', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      expect(res.body.success).toBe(true)
      expect(res.body.data.userRole).toBe('EMPLOYER')
    })

    it('should return employer dashboard data', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      expect(res.body.data).toHaveProperty('dashboard')
      expect(res.body.data.dashboard).toHaveProperty('companyInfo')
      expect(res.body.data.dashboard).toHaveProperty('totals')
      expect(res.body.data.dashboard).toHaveProperty('applicationStats')
      expect(res.body.data.dashboard).toHaveProperty('myJobPostings')
      expect(res.body.data.dashboard).toHaveProperty('recentApplications')
    })
  })

  // ============================================
  // 2. Dashboard Structure
  // ============================================
  describe('Dashboard Structure', () => {
    
    it('should return correct response structure', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      expect(res.body).toHaveProperty('success', true)
      expect(res.body).toHaveProperty('message')
      expect(res.body).toHaveProperty('data')
      expect(res.body.data).toHaveProperty('userRole')
      expect(res.body.data).toHaveProperty('timestamp')
    })

    it('should include userRole = EMPLOYER', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      expect(res.body.data.userRole).toBe('EMPLOYER')
    })

    it('should include all dashboard sections', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { dashboard } = res.body.data
      expect(dashboard).toHaveProperty('companyInfo')
      expect(dashboard).toHaveProperty('totals')
      expect(dashboard).toHaveProperty('applicationStats')
      expect(dashboard).toHaveProperty('myJobPostings')
      expect(dashboard).toHaveProperty('recentApplications')
      expect(dashboard).toHaveProperty('quickActions')
    })

    it('should include timestamp', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      expect(res.body.data).toHaveProperty('timestamp')
      const date = new Date(res.body.data.timestamp)
      expect(date.toString()).not.toBe('Invalid Date')
    })
  })

  // ============================================
  // 3. Company Section
  // ============================================
  describe('Company Section', () => {
    
    it('should return HR company information', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { companyInfo } = res.body.data.dashboard
      expect(companyInfo).toHaveProperty('hrId')
      expect(companyInfo).toHaveProperty('companyName')
    })

    it('should include correct company details', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { companyInfo } = res.body.data.dashboard
      expect(companyInfo.companyName).toBe('EmployerDashCorp')
    })
  })

  // ============================================
  // 4. Totals Section
  // ============================================
  describe('Totals Section', () => {
    
    it('should return total job postings count', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { totals } = res.body.data.dashboard
      expect(totals).toHaveProperty('jobPostings')
      expect(totals.jobPostings).toBe(6) // 5 active + 1 expired
    })

    it('should separate active vs expired jobs', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { totals } = res.body.data.dashboard
      expect(totals).toHaveProperty('activeJobs')
      expect(totals).toHaveProperty('expiredJobs')
      expect(totals.activeJobs).toBe(5)
      expect(totals.expiredJobs).toBe(1)
    })

    it('should calculate correctly', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { totals } = res.body.data.dashboard
      expect(totals.jobPostings).toBe(totals.activeJobs + totals.expiredJobs)
    })
  })

  // ============================================
  // 5. Application Stats
  // ============================================
  describe('Application Stats', () => {
    
    it('should return application counts for employer\'s jobs only', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { applicationStats } = res.body.data.dashboard
      expect(applicationStats).toHaveProperty('total')
      expect(applicationStats.total).toBe(4) // 4 applications to this employer's jobs
    })

    it('should group by status', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { applicationStats } = res.body.data.dashboard
      expect(applicationStats).toHaveProperty('pending')
      expect(applicationStats).toHaveProperty('qualified')
      expect(applicationStats).toHaveProperty('rejected')
    })

    it('should have correct status counts', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { applicationStats } = res.body.data.dashboard
      
      // We created: 2 PENDING, 1 QUALIFIED, 1 REJECTED
      expect(applicationStats.total).toBe(4)
      expect(applicationStats.pending).toBe(2)
      expect(applicationStats.qualified).toBe(1)
      expect(applicationStats.rejected).toBe(1)
    })

    it('should not include applications to other employers\' jobs', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { applicationStats } = res.body.data.dashboard
      
      // Should only count applications to EmployerDashCorp jobs
      expect(applicationStats.total).toBe(4)
    })
  })

  // ============================================
  // 6. My Jobs
  // ============================================
  describe('My Jobs', () => {
    
    it('should return last 5 jobs posted by employer', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { myJobPostings } = res.body.data.dashboard
      expect(myJobPostings.length).toBeLessThanOrEqual(5)
    })

    it('should include application count per job', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { myJobPostings } = res.body.data.dashboard
      expect(myJobPostings.length).toBeGreaterThan(0)
      
      myJobPostings.forEach(job => {
        expect(job).toHaveProperty('_count')
        expect(job._count).toHaveProperty('applications')
        expect(typeof job._count.applications).toBe('number')
      })
    })

    it('should order by createdAt DESC', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { myJobPostings } = res.body.data.dashboard
      
      // Check ordering
      for (let i = 1; i < myJobPostings.length; i++) {
        const currentDate = new Date(myJobPostings[i - 1].createdAt)
        const nextDate = new Date(myJobPostings[i].createdAt)
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime())
      }
    })

    it('should only return employer\'s own jobs', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { myJobPostings } = res.body.data.dashboard
      
      myJobPostings.forEach(job => {
        expect(job.companyName).toBe('EmployerDashCorp')
      })
    })
  })

  // ============================================
  // 7. Recent Applications
  // ============================================
  describe('Recent Applications', () => {
    
    it('should return last 5 applications to employer\'s jobs', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { recentApplications } = res.body.data.dashboard
      expect(recentApplications.length).toBeLessThanOrEqual(5)
      expect(recentApplications.length).toBe(4) // We created 4 applications
    })

    it('should include student details', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { recentApplications } = res.body.data.dashboard
      
      recentApplications.forEach(application => {
        expect(application).toHaveProperty('student')
        expect(application.student).toHaveProperty('user')
        expect(application.student.user).toHaveProperty('name')
        expect(application.student.user).toHaveProperty('email')
        expect(application.student).toHaveProperty('degreeType')
      })
    })

    it('should include job title', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { recentApplications } = res.body.data.dashboard
      
      recentApplications.forEach(application => {
        expect(application).toHaveProperty('job')
        expect(application.job).toHaveProperty('title')
      })
    })

    it('should include application status', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { recentApplications } = res.body.data.dashboard
      
      recentApplications.forEach(application => {
        expect(application).toHaveProperty('status')
        expect(['PENDING', 'QUALIFIED', 'REJECTED']).toContain(application.status)
      })
    })

    it('should order by application date DESC', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { recentApplications } = res.body.data.dashboard
      
      for (let i = 1; i < recentApplications.length; i++) {
        const currentDate = new Date(recentApplications[i - 1].createdAt)
        const nextDate = new Date(recentApplications[i].createdAt)
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime())
      }
    })

    it('should only include applications to employer\'s jobs', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { recentApplications } = res.body.data.dashboard
      
      recentApplications.forEach(application => {
        expect(application.job.companyName).toBe('EmployerDashCorp')
      })
    })
  })

  // ============================================
  // 8. Quick Actions
  // ============================================
  describe('Quick Actions', () => {
    
    it('should return employer-specific actions', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { quickActions } = res.body.data.dashboard
      expect(Array.isArray(quickActions)).toBe(true)
      expect(quickActions.length).toBeGreaterThan(0)
    })

    it('should include expected employer actions', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { quickActions } = res.body.data.dashboard
      
      expect(quickActions).toContain('Post New Job')
      expect(quickActions).toContain('Review Applications')
      expect(quickActions).toContain('Edit Company Profile')
    })

    it('should return quickActions as array of strings', async () => {
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', hrToken)
        .expect(200)
      
      const { quickActions } = res.body.data.dashboard
      
      expect(Array.isArray(quickActions)).toBe(true)
      quickActions.forEach(action => {
        expect(typeof action).toBe('string')
      })
    })
  })

  // ============================================
  // 9. Employer with No Jobs
  // ============================================
  describe('Employer with No Jobs', () => {
    
    it('should return zeros for employer with no jobs', async () => {
      // Create new employer without jobs
      const newHR = await prisma.user.create({
        data: {
          name: 'New',
          surname: 'Employer',
          email: 'new-employer@test.com',
          username: 'new_employer',
          password: 'Pass123',
          role: 'EMPLOYER',
          status: 'APPROVED',
          verified: true,
          hr: {
            create: {
              companyName: 'NewCorp',
              industry: 'EMERGING_TECH',
              companySize: 'ONE_TO_TEN',
              address: 'Phuket',
              phoneNumber: '02-111-2222'
            }
          }
        }
      })
      const newHRToken = createTestToken({ id: newHR.id, role: 'EMPLOYER' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', newHRToken)
        .expect(200)
      
      const { totals, applicationStats, myJobPostings, recentApplications } = res.body.data.dashboard
      
      expect(totals.jobPostings).toBe(0)
      expect(totals.activeJobs).toBe(0)
      expect(totals.expiredJobs).toBe(0)
      expect(applicationStats.total).toBe(0)
      expect(applicationStats.pending).toBe(0)
      expect(myJobPostings.length).toBe(0)
      expect(recentApplications.length).toBe(0)

      // Cleanup
      await prisma.hR.delete({ where: { userId: newHR.id } })
      await prisma.user.delete({ where: { id: newHR.id } })
    })
  })
})
