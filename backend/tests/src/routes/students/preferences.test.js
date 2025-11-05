/**
 * @fileoverview Integration tests for Student Preferences API
 * Tests CRUD operations for student preferences including validation and authorization
 */

const request = require('supertest')
const prisma = require('../../src/models/prisma')
const app = require('../../src/app')
const { cleanupDatabase, createTestToken, TEST_DEGREE_TYPES } = require('../src/utils/testHelpers')

jest.setTimeout(30000)

let degreeType
let studentUser, employerUser, adminUser
let studentToken, employerToken, adminToken

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret'

  await cleanupDatabase(prisma, { logSuccess: false })

  // Create required DegreeType
  degreeType = await prisma.degreeType.create({
    data: {
      name: TEST_DEGREE_TYPES.BACHELOR
    }
  })

  // Create test student user
  studentUser = await prisma.user.create({
    data: {
      name: 'Student',
      surname: 'TestUser',
      email: 'student-pref@test.com',
      username: 'student_pref',
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

  // Create test employer user
  employerUser = await prisma.user.create({
    data: {
      name: 'HR',
      surname: 'TestUser',
      email: 'hr-pref@test.com',
      username: 'hr_pref',
      password: 'Pass123',
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName: 'TestCorp',
          industry: 'IT_SOFTWARE',
          companySize: 'ELEVEN_TO_FIFTY',
          address: 'Bangkok Office',
          phoneNumber: '02-123-4567'
        }
      }
    },
    include: { hr: true }
  })
  employerToken = createTestToken({ id: employerUser.id, role: 'EMPLOYER' })

  // Create test admin user
  adminUser = await prisma.user.create({
    data: {
      name: 'Admin',
      surname: 'TestUser',
      email: 'admin-pref@test.com',
      username: 'admin_pref',
      password: 'Pass123',
      role: 'ADMIN',
      status: 'APPROVED',
      verified: true,
      admin: { create: {} }
    }
  })
  adminToken = createTestToken({ id: adminUser.id, role: 'ADMIN' })
})

afterAll(async () => {
  await cleanupDatabase(prisma, { logSuccess: false })
  await prisma.$disconnect()
})

describe('Student Preferences API - Integration Tests', () => {
  
  // ============================================
  // 1. GET Preferences (Initially Empty)
  // ============================================
  describe('GET /api/students/preferences - Initially Empty', () => {
    
    it('should return null when no preferences exist', async () => {
      const res = await request(app)
        .get('/api/students/preferences')
        .set('Authorization', studentToken)
        .expect(200)
      
      expect(res.body.success).toBe(true)
      expect(res.body.data).toBeNull()
    })

    it('should return 200 status for empty preferences', async () => {
      const res = await request(app)
        .get('/api/students/preferences')
        .set('Authorization', studentToken)
      
      expect(res.status).toBe(200)
    })

    it('should require authentication (401 without token)', async () => {
      const res = await request(app)
        .get('/api/students/preferences')
        .expect(401)
      
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/token|authentication|unauthorized/i)
    })

    it('should require STUDENT role (403 for EMPLOYER)', async () => {
      const res = await request(app)
        .get('/api/students/preferences')
        .set('Authorization', employerToken)
        .expect(403)
      
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/forbidden|not authorized|access denied/i)
    })

    it('should require STUDENT role (403 for ADMIN)', async () => {
      const res = await request(app)
        .get('/api/students/preferences')
        .set('Authorization', adminToken)
        .expect(403)
      
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/forbidden|not authorized|access denied/i)
    })
  })

  // ============================================
  // 2. PATCH Preferences (Create)
  // ============================================
  describe('PATCH /api/students/preferences - Create', () => {
    
    it('should create preferences with all valid fields', async () => {
      const preferences = {
        desiredLocation: 'Bangkok',
        minSalary: 40000,
        industry: 'IT_SOFTWARE',
        jobType: 'full-time',
        remoteWork: 'hybrid'
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(preferences)
        .expect(200)
      
      expect(res.body.success).toBe(true)
      expect(res.body.data).toMatchObject({
        desiredLocation: 'Bangkok',
        minSalary: 40000,
        industry: 'IT_SOFTWARE',
        jobType: 'full-time',
        remoteWork: 'hybrid'
      })
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data).toHaveProperty('studentId')
      expect(res.body.data).toHaveProperty('createdAt')
      expect(res.body.data).toHaveProperty('updatedAt')
    })

    it('should create preferences with partial fields', async () => {
      // First cleanup existing preferences
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })

      const preferences = {
        desiredLocation: 'Chiang Mai',
        minSalary: 35000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(preferences)
        .expect(200)
      
      expect(res.body.success).toBe(true)
      expect(res.body.data.desiredLocation).toBe('Chiang Mai')
      expect(res.body.data.minSalary).toBe(35000)
      expect(res.body.data.industry).toBeNull()
      expect(res.body.data.jobType).toBeNull()
      expect(res.body.data.remoteWork).toBeNull()
    })

    it('should validate industry enum values', async () => {
      const preferences = {
        industry: 'IT_SOFTWARE',
        minSalary: 30000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(preferences)
        .expect(200)
      
      expect(res.body.data.industry).toBe('IT_SOFTWARE')
    })

    it('should validate jobType enum values', async () => {
      const preferences = {
        jobType: 'internship',
        minSalary: 15000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(preferences)
        .expect(200)
      
      expect(res.body.data.jobType).toBe('internship')
    })

    it('should validate remoteWork enum values', async () => {
      const preferences = {
        remoteWork: 'remote',
        minSalary: 40000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(preferences)
        .expect(200)
      
      expect(res.body.data.remoteWork).toBe('remote')
    })

    it('should reject invalid industry values', async () => {
      const preferences = {
        industry: 'INVALID_INDUSTRY',
        minSalary: 30000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(preferences)
        .expect(400)
      
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/industry|validation|invalid/i)
    })

    it('should reject negative minSalary', async () => {
      const preferences = {
        minSalary: -1000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(preferences)
        .expect(400)
      
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/salary|validation|positive|greater/i)
    })

    it('should reject forbidden field: studentId', async () => {
      const preferences = {
        studentId: 'some-student-id',
        minSalary: 30000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(preferences)
        .expect(400)
      
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/studentId|forbidden|not allowed/i)
    })

    it('should reject forbidden field: id', async () => {
      const preferences = {
        id: 'some-id',
        minSalary: 30000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(preferences)
        .expect(400)
      
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/id|forbidden|not allowed/i)
    })

    it('should reject forbidden field: userId', async () => {
      const preferences = {
        userId: 'some-user-id',
        minSalary: 30000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(preferences)
        .expect(400)
      
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/userId|forbidden|not allowed/i)
    })

    it('should require at least one field', async () => {
      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send({})
        .expect(400)
      
      expect(res.body.success).toBe(false)
      expect(res.body.message).toMatch(/at least one|required|empty/i)
    })

    it('should require authentication', async () => {
      const preferences = {
        minSalary: 30000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .send(preferences)
        .expect(401)
      
      expect(res.body.success).toBe(false)
    })

    it('should require STUDENT role', async () => {
      const preferences = {
        minSalary: 30000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', employerToken)
        .send(preferences)
        .expect(403)
      
      expect(res.body.success).toBe(false)
    })
  })

  // ============================================
  // 3. PATCH Preferences (Update)
  // ============================================
  describe('PATCH /api/students/preferences - Update', () => {
    
    beforeAll(async () => {
      // Ensure preferences exist with all fields
      await prisma.studentPreference.deleteMany({
        where: { student: { userId: studentUser.id } }
      })

      const student = await prisma.student.findUnique({
        where: { userId: studentUser.id }
      })

      await prisma.studentPreference.create({
        data: {
          studentId: student.id,
          desiredLocation: 'Bangkok',
          minSalary: 40000,
          industry: 'IT_SOFTWARE',
          jobType: 'full-time',
          remoteWork: 'hybrid'
        }
      })
    })

    it('should update only specified fields (partial update)', async () => {
      const updates = {
        minSalary: 50000
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(updates)
        .expect(200)
      
      expect(res.body.data.minSalary).toBe(50000)
      expect(res.body.data.desiredLocation).toBe('Bangkok') // Preserved
      expect(res.body.data.industry).toBe('IT_SOFTWARE') // Preserved
      expect(res.body.data.jobType).toBe('full-time') // Preserved
      expect(res.body.data.remoteWork).toBe('hybrid') // Preserved
    })

    it('should preserve unchanged fields', async () => {
      const updates = {
        jobType: 'part-time'
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(updates)
        .expect(200)
      
      expect(res.body.data.jobType).toBe('part-time') // Updated
      expect(res.body.data.desiredLocation).toBe('Bangkok') // Preserved
      expect(res.body.data.minSalary).toBe(50000) // Preserved from previous update
    })

    it('should update all fields at once', async () => {
      const updates = {
        desiredLocation: 'Phuket',
        minSalary: 45000,
        industry: 'E_COMMERCE',
        jobType: 'contract',
        remoteWork: 'remote'
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(updates)
        .expect(200)
      
      expect(res.body.data).toMatchObject({
        desiredLocation: 'Phuket',
        minSalary: 45000,
        industry: 'E_COMMERCE',
        jobType: 'contract',
        remoteWork: 'remote'
      })
    })

    it('should handle null values correctly (clear field)', async () => {
      const updates = {
        industry: null,
        jobType: null
      }

      const res = await request(app)
        .patch('/api/students/preferences')
        .set('Authorization', studentToken)
        .send(updates)
        .expect(200)
      
      expect(res.body.data.industry).toBeNull()
      expect(res.body.data.jobType).toBeNull()
      expect(res.body.data.desiredLocation).toBe('Phuket') // Preserved
      expect(res.body.data.minSalary).toBe(45000) // Preserved
    })
  })

  // ============================================
  // 4. GET Preferences (After Creation)
  // ============================================
  describe('GET /api/students/preferences - After Creation', () => {
    
    it('should return created preferences', async () => {
      const res = await request(app)
        .get('/api/students/preferences')
        .set('Authorization', studentToken)
        .expect(200)
      
      expect(res.body.success).toBe(true)
      expect(res.body.data).not.toBeNull()
      expect(res.body.data).toHaveProperty('id')
      expect(res.body.data).toHaveProperty('studentId')
    })

    it('should include all saved fields', async () => {
      const res = await request(app)
        .get('/api/students/preferences')
        .set('Authorization', studentToken)
        .expect(200)
      
      expect(res.body.data).toHaveProperty('desiredLocation')
      expect(res.body.data).toHaveProperty('minSalary')
      expect(res.body.data).toHaveProperty('industry')
      expect(res.body.data).toHaveProperty('jobType')
      expect(res.body.data).toHaveProperty('remoteWork')
      expect(res.body.data).toHaveProperty('createdAt')
      expect(res.body.data).toHaveProperty('updatedAt')
    })

    it('should match upserted values', async () => {
      const res = await request(app)
        .get('/api/students/preferences')
        .set('Authorization', studentToken)
        .expect(200)
      
      expect(res.body.data.desiredLocation).toBe('Phuket')
      expect(res.body.data.minSalary).toBe(45000)
      expect(res.body.data.remoteWork).toBe('remote')
    })
  })

  // ============================================
  // 5. All Industry Enum Values
  // ============================================
  describe('Industry Enum Values', () => {
    const industries = [
      'IT_SOFTWARE',
      'IT_HARDWARE_AND_DEVICES',
      'IT_SERVICES',
      'NETWORK_SERVICES',
      'EMERGING_TECH',
      'E_COMMERCE',
      'OTHER'
    ]

    industries.forEach(industry => {
      it(`should accept industry: ${industry}`, async () => {
        const res = await request(app)
          .patch('/api/students/preferences')
          .set('Authorization', studentToken)
          .send({ industry })
          .expect(200)
        
        expect(res.body.data.industry).toBe(industry)
      })
    })
  })

  // ============================================
  // 6. All Job Type Enum Values
  // ============================================
  describe('Job Type Enum Values', () => {
    const jobTypes = ['internship', 'part-time', 'full-time', 'contract']

    jobTypes.forEach(jobType => {
      it(`should accept jobType: ${jobType}`, async () => {
        const res = await request(app)
          .patch('/api/students/preferences')
          .set('Authorization', studentToken)
          .send({ jobType })
          .expect(200)
        
        expect(res.body.data.jobType).toBe(jobType)
      })
    })
  })

  // ============================================
  // 7. All Work Arrangement Enum Values
  // ============================================
  describe('Work Arrangement Enum Values', () => {
    const workArrangements = ['on-site', 'remote', 'hybrid']

    workArrangements.forEach(remoteWork => {
      it(`should accept remoteWork: ${remoteWork}`, async () => {
        const res = await request(app)
          .patch('/api/students/preferences')
          .set('Authorization', studentToken)
          .send({ remoteWork })
          .expect(200)
        
        expect(res.body.data.remoteWork).toBe(remoteWork)
      })
    })
  })
})
