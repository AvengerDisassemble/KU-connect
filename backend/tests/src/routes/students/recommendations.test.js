/**
 * @fileoverview Integration tests for Job Recommendations
 * Tests multi-criteria filtering logic for personalized job recommendations
 */

const request = require('supertest')
const prisma = require('../../src/models/prisma')
const app = require('../../src/app')
const { cleanupDatabase, createTestToken, TEST_DEGREE_TYPES } = require('../src/utils/testHelpers')

jest.setTimeout(30000)

let degreeType
let studentUser, hrUser
let studentToken
let testJobs = []

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
      surname: 'Recommendation',
      email: 'student-rec@test.com',
      username: 'student_rec',
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
      surname: 'Recommendation',
      email: 'hr-rec@test.com',
      username: 'hr_rec',
      password: 'Pass123',
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName: 'TechCorp',
          industry: 'IT_SOFTWARE',
          companySize: 'ELEVEN_TO_FIFTY',
          address: 'Bangkok Office',
          phoneNumber: '02-123-4567'
        }
      }
    },
    include: { hr: true }
  })

  // Create another HR user with different industry
  const hrUser2 = await prisma.user.create({
    data: {
      name: 'HR2',
      surname: 'Commerce',
      email: 'hr-ecom@test.com',
      username: 'hr_ecom',
      password: 'Pass123',
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName: 'ShopMart',
          industry: 'E_COMMERCE',
          companySize: 'TWO_HUNDRED_PLUS',
          address: 'Chiang Mai Office',
          phoneNumber: '02-234-5678'
        }
      }
    },
    include: { hr: true }
  })

  // Create diverse test jobs
  const hrData = await prisma.hR.findUnique({ where: { userId: hrUser.id } })
  const hrData2 = await prisma.hR.findUnique({ where: { userId: hrUser2.id } })
  
  const futureDeadline = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  const expiredDeadline = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)

  // Job 1: IT Software, Bangkok, Full-time, Hybrid, 60k-100k (High salary)
  const job1 = await prisma.job.create({
    data: {
      hrId: hrData.id,
      title: 'Senior Software Engineer',
      companyName: 'TechCorp',
      description: 'Lead software development',
      location: 'Bangkok, Thailand',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Permanent',
      minSalary: 60000,
      maxSalary: 100000,
      application_deadline: futureDeadline,
      email: hrUser.email,
      phone_number: '02-123-4567'
    }
  })
  testJobs.push(job1)

  // Job 2: IT Software, Bangkok, Full-time, Hybrid, 45k-70k (Mid-career hybrid)
  const job2 = await prisma.job.create({
    data: {
      hrId: hrData.id,
      title: 'Software Engineer',
      companyName: 'TechCorp',
      description: 'Develop applications',
      location: 'Bangkok, Thailand',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Permanent',
      minSalary: 45000,
      maxSalary: 70000,
      application_deadline: futureDeadline,
      email: hrUser.email,
      phone_number: '02-123-4567'
    }
  })
  testJobs.push(job2)

  // Job 3: IT Software, Bangkok, Full-time, On-site, 40k-65k
  const job3 = await prisma.job.create({
    data: {
      hrId: hrData.id,
      title: 'Mid-Level Developer',
      companyName: 'TechCorp',
      description: 'Build applications',
      location: 'Bangkok, Thailand',
      jobType: 'full-time',
      workArrangement: 'on-site',
      duration: 'Permanent',
      minSalary: 40000,
      maxSalary: 65000,
      application_deadline: futureDeadline,
      email: hrUser.email,
      phone_number: '02-123-4567'
    }
  })
  testJobs.push(job3)

  // Job 4: IT Software, Bangkok, Internship, Remote, 10k-18k
  const job4 = await prisma.job.create({
    data: {
      hrId: hrData.id,
      title: 'Software Intern',
      companyName: 'TechCorp',
      description: 'Learn development',
      location: 'Bangkok, Thailand',
      jobType: 'internship',
      workArrangement: 'remote',
      duration: '6 months',
      minSalary: 10000,
      maxSalary: 18000,
      application_deadline: futureDeadline,
      email: hrUser.email,
      phone_number: '02-123-4567'
    }
  })
  testJobs.push(job4)

  // Job 5: E-Commerce, Chiang Mai, Full-time, Remote, 42k-65k
  const job5 = await prisma.job.create({
    data: {
      hrId: hrData2.id,
      title: 'E-commerce Manager',
      companyName: 'ShopMart',
      description: 'Manage online store',
      location: 'Chiang Mai, Thailand',
      jobType: 'full-time',
      workArrangement: 'remote',
      duration: 'Permanent',
      minSalary: 42000,
      maxSalary: 65000,
      application_deadline: futureDeadline,
      email: hrUser2.email,
      phone_number: '02-234-5678'
    }
  })
  testJobs.push(job5)

  // Job 6: E-Commerce, Bangkok, Part-time, Hybrid, 20k-35k
  const job6 = await prisma.job.create({
    data: {
      hrId: hrData2.id,
      title: 'Part-time Marketing',
      companyName: 'ShopMart',
      description: 'Marketing campaigns',
      location: 'Bangkok, Thailand',
      jobType: 'part-time',
      workArrangement: 'hybrid',
      duration: 'Flexible',
      minSalary: 20000,
      maxSalary: 35000,
      application_deadline: futureDeadline,
      email: hrUser2.email,
      phone_number: '02-234-5678'
    }
  })
  testJobs.push(job6)

  // Job 7: IT Software, Phuket, Full-time, Remote, 35k-55k
  const job7 = await prisma.job.create({
    data: {
      hrId: hrData.id,
      title: 'Remote Developer',
      companyName: 'TechCorp',
      description: 'Work remotely',
      location: 'Phuket, Thailand',
      jobType: 'full-time',
      workArrangement: 'remote',
      duration: 'Permanent',
      minSalary: 35000,
      maxSalary: 55000,
      application_deadline: futureDeadline,
      email: hrUser.email,
      phone_number: '02-123-4567'
    }
  })
  testJobs.push(job7)

  // Job 8: IT Software, Bangkok, Full-time, Hybrid, 25k (Below common threshold)
  const job8 = await prisma.job.create({
    data: {
      hrId: hrData.id,
      title: 'Junior Developer',
      companyName: 'TechCorp',
      description: 'Entry level',
      location: 'Bangkok, Thailand',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Permanent',
      minSalary: 25000,
      maxSalary: 40000,
      application_deadline: futureDeadline,
      email: hrUser.email,
      phone_number: '02-123-4567'
    }
  })
  testJobs.push(job8)

  // Job 9: Expired job (should not appear in recommendations)
  const job9 = await prisma.job.create({
    data: {
      hrId: hrData.id,
      title: 'Expired Position',
      companyName: 'TechCorp',
      description: 'Expired',
      location: 'Bangkok, Thailand',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Permanent',
      minSalary: 50000,
      maxSalary: 80000,
      application_deadline: expiredDeadline,
      email: hrUser.email,
      phone_number: '02-123-4567'
    }
  })
  testJobs.push(job9)
})

afterAll(async () => {
  await cleanupDatabase(prisma, { logSuccess: false })
  await prisma.$disconnect()
})

describe('Job Recommendations - Integration Tests', () => {
  
  // ============================================
  // 1. Location Filtering
  // ============================================
  describe('Location Filtering', () => {
    
    beforeEach(async () => {
      // Clear preferences before each test
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })
    })

    it('should filter jobs by desiredLocation (Bangkok)', async () => {
      // Set preferences with Bangkok location
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ desiredLocation: 'Bangkok' })

      // Get dashboard to check recommendations
      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBeGreaterThan(0)
      
      // All recommendations should contain "Bangkok"
      recommendations.forEach(job => {
        expect(job.location.toLowerCase()).toContain('bangkok')
      })
    })

    it('should be case-insensitive', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ desiredLocation: 'BANGKOK' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBeGreaterThan(0)
    })

    it('should use partial matching (contains)', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ desiredLocation: 'Chiang' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBeGreaterThan(0)
      recommendations.forEach(job => {
        expect(job.location.toLowerCase()).toContain('chiang')
      })
    })
  })

  // ============================================
  // 2. Salary Filtering
  // ============================================
  describe('Salary Filtering', () => {
    
    beforeEach(async () => {
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })
    })

    it('should return jobs with minSalary >= student minSalary', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ minSalary: 40000 })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBeGreaterThan(0)
      
      // All jobs should have minSalary >= 40000
      recommendations.forEach(job => {
        expect(job.minSalary).toBeGreaterThanOrEqual(40000)
      })
    })

    it('should exclude jobs below threshold', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ minSalary: 50000 })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      
      // Should not include jobs with minSalary < 50000
      const lowSalaryJobs = recommendations.filter(job => job.minSalary < 50000)
      expect(lowSalaryJobs.length).toBe(0)
    })

    it('should work with null minSalary (no filter)', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ desiredLocation: 'Bangkok' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      
      // Should return jobs of all salary ranges
      const salaries = recommendations.map(job => job.minSalary)
      expect(Math.min(...salaries)).toBeLessThan(30000)
      expect(Math.max(...salaries)).toBeGreaterThan(40000)
    })
  })

  // ============================================
  // 3. Industry Filtering
  // ============================================
  describe('Industry Filtering', () => {
    
    beforeEach(async () => {
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })
    })

    it('should filter by exact industry match (IT_SOFTWARE)', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ industry: 'IT_SOFTWARE' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBeGreaterThan(0)
      
      // All jobs should be from TechCorp (IT_SOFTWARE)
      recommendations.forEach(job => {
        expect(job.companyName).toBe('TechCorp')
      })
    })

    it('should exclude non-matching industries', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ industry: 'E_COMMERCE' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBeGreaterThan(0)
      
      // All jobs should be from ShopMart (E_COMMERCE)
      recommendations.forEach(job => {
        expect(job.companyName).toBe('ShopMart')
      })
    })

    it('should work with null industry (no filter)', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ desiredLocation: 'Bangkok' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      
      // Should return jobs from multiple industries
      const companies = [...new Set(recommendations.map(job => job.companyName))]
      expect(companies.length).toBeGreaterThan(1)
    })
  })

  // ============================================
  // 4. Job Type Filtering
  // ============================================
  describe('Job Type Filtering', () => {
    
    beforeEach(async () => {
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })
    })

    it('should filter by jobType (full-time)', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ jobType: 'full-time' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBeGreaterThan(0)
      
      recommendations.forEach(job => {
        expect(job.jobType).toBe('full-time')
      })
    })

    it('should exclude non-matching job types', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ jobType: 'internship' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      
      recommendations.forEach(job => {
        expect(job.jobType).toBe('internship')
      })
    })

    it('should work with null jobType (no filter)', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ desiredLocation: 'Bangkok' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      
      // Should include various job types
      const jobTypes = [...new Set(recommendations.map(job => job.jobType))]
      expect(jobTypes.length).toBeGreaterThan(1)
    })
  })

  // ============================================
  // 5. Work Arrangement Filtering
  // ============================================
  describe('Work Arrangement Filtering', () => {
    
    beforeEach(async () => {
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })
    })

    it('should filter by workArrangement (hybrid)', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ remoteWork: 'hybrid' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBeGreaterThan(0)
      
      recommendations.forEach(job => {
        expect(job.workArrangement.toLowerCase()).toBe('hybrid')
      })
    })

    it('should exclude non-matching arrangements', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ remoteWork: 'remote' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      
      recommendations.forEach(job => {
        expect(job.workArrangement.toLowerCase()).toBe('remote')
      })
    })

    it('should work with null remoteWork (no filter)', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ jobType: 'full-time' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      
      // Should include various work arrangements
      const arrangements = [...new Set(recommendations.map(job => job.workArrangement))]
      expect(arrangements.length).toBeGreaterThan(1)
    })
  })

  // ============================================
  // 6. Combined Filters (AND logic)
  // ============================================
  describe('Combined Filters', () => {
    
    beforeEach(async () => {
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })
    })

    it('should apply all filters together - Mid-career + Hybrid', async () => {
      // This is the user's main use case
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({
          desiredLocation: 'Bangkok',
          minSalary: 40000,
          industry: 'IT_SOFTWARE',
          jobType: 'full-time',
          remoteWork: 'hybrid'
        })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBeGreaterThan(0)
      
      // Should match ALL criteria
      recommendations.forEach(job => {
        expect(job.location.toLowerCase()).toContain('bangkok')
        expect(job.minSalary).toBeGreaterThanOrEqual(40000)
        expect(job.companyName).toBe('TechCorp') // IT_SOFTWARE
        expect(job.jobType).toBe('full-time')
        expect(job.workArrangement.toLowerCase()).toBe('hybrid')
      })
    })

    it('should return jobs matching ALL criteria', async () => {
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({
          industry: 'E_COMMERCE',
          jobType: 'part-time',
          remoteWork: 'hybrid'
        })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBeGreaterThan(0)
      
      recommendations.forEach(job => {
        expect(job.companyName).toBe('ShopMart')
        expect(job.jobType).toBe('part-time')
        expect(job.workArrangement.toLowerCase()).toBe('hybrid')
      })
    })

    it('should return empty array if no matches', async () => {
      // Impossible combination
      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({
          industry: 'E_COMMERCE',
          jobType: 'internship', // ShopMart has no internships
          remoteWork: 'hybrid'
        })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBe(0)
    })
  })

  // ============================================
  // 7. Deadline Filtering
  // ============================================
  describe('Deadline Filtering', () => {
    
    it('should exclude expired jobs', async () => {
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })

      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ industry: 'IT_SOFTWARE' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      
      // Should not include expired job
      const expiredJob = recommendations.find(job => job.title === 'Expired Position')
      expect(expiredJob).toBeUndefined()
    })

    it('should include only active jobs', async () => {
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })

      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ desiredLocation: 'Bangkok' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      
      // All jobs should have future deadlines
      recommendations.forEach(job => {
        const deadline = new Date(job.application_deadline)
        expect(deadline.getTime()).toBeGreaterThan(Date.now())
      })
    })
  })

  // ============================================
  // 8. Limit & Ordering
  // ============================================
  describe('Limit and Ordering', () => {
    
    it('should limit results to 10 by default', async () => {
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      expect(recommendations.length).toBeLessThanOrEqual(10)
    })

    it('should order by newest first (id DESC)', async () => {
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })

      await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({ industry: 'IT_SOFTWARE' })

      const res = await request(app)
        .get('/api/profile/dashboard')
        .set('Authorization', studentToken)
        .expect(200)
      
      const recommendations = res.body.data.dashboard.recommendedJobs
      
      // Check ordering (newer jobs should come first)
      for (let i = 1; i < recommendations.length; i++) {
        const currentId = parseInt(recommendations[i - 1].id)
        const nextId = parseInt(recommendations[i].id)
        expect(currentId).toBeGreaterThan(nextId)
      }
    })
  })
})
