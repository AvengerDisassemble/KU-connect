/**
 * @module tests/controllers/adminController.professor.test
 * @description Integration tests for admin professor creation endpoint
 */

const request = require('supertest')
const app = require('../../src/app')
const prisma = require('../../src/models/prisma')
const jwt = require('jsonwebtoken')
const { hashPassword } = require('../../src/utils/passwordUtils')

describe('Admin Controller - Create Professor', () => {
  let adminToken, studentToken
  let adminUserId, studentUserId

  beforeAll(async () => {
    // Create admin user
    const hashedPass = await hashPassword('adminpass123')
    const adminUser = await prisma.user.create({
      data: {
        name: 'Test',
        surname: 'Admin',
        email: `admin-prof-test-${Date.now()}@test.com`,
        password: hashedPass,
        role: 'ADMIN',
        status: 'APPROVED',
        verified: true
      }
    })
    adminUserId = adminUser.id

    await prisma.admin.create({
      data: {
        userId: adminUserId
      }
    })

    // Create student user (for testing authorization)
    const studentUser = await prisma.user.create({
      data: {
        name: 'Test',
        surname: 'Student',
        email: `student-prof-test-${Date.now()}@test.com`,
        password: hashedPass,
        role: 'STUDENT',
        status: 'APPROVED',
        verified: true
      }
    })
    studentUserId = studentUser.id

    // Get degreeType for student
    let degreeType = await prisma.degreeType.findFirst()
    if (!degreeType) {
      degreeType = await prisma.degreeType.create({
        data: { name: 'Test Degree' }
      })
    }

    await prisma.student.create({
      data: {
        userId: studentUserId,
        degreeTypeId: degreeType.id,
        address: '123 Test St'
      }
    })

    // Generate tokens (use 'id' field, not 'userId')
    adminToken = jwt.sign(
      { id: adminUserId, role: 'ADMIN' },
      process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
      { expiresIn: '1h' }
    )

    studentToken = jwt.sign(
      { id: studentUserId, role: 'STUDENT' },
      process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret',
      { expiresIn: '1h' }
    )
  })

  afterAll(async () => {
    // Clean up created test users
    if (adminUserId) {
      await prisma.admin.deleteMany({ where: { userId: adminUserId } })
      await prisma.user.deleteMany({ where: { id: adminUserId } })
    }
    if (studentUserId) {
      await prisma.student.deleteMany({ where: { userId: studentUserId } })
      await prisma.user.deleteMany({ where: { id: studentUserId } })
    }
    // Clean up any created professors
    await prisma.professor.deleteMany({
      where: {
        user: {
          email: {
            contains: 'prof-integration-test'
          }
        }
      }
    })
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'prof-integration-test'
        }
      }
    })
  })

  describe('POST /api/admin/users/professor - Success Cases', () => {
    it('should create professor with all required fields', async () => {
      const email = `prof-integration-test-1-${Date.now()}@ku.ac.th`
      const response = await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'John',
          surname: 'Smith',
          email,
          department: 'Computer Science'
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Professor account created successfully')
      expect(response.body.data.user).toBeDefined()
      expect(response.body.data.user.email).toContain('prof-integration-test-1')
      expect(response.body.data.user.role).toBe('PROFESSOR')
      expect(response.body.data.user.status).toBe('APPROVED')
      expect(response.body.data.user.verified).toBe(true)
      expect(response.body.data.professor).toBeDefined()
      expect(response.body.data.professor.department).toBe('Computer Science')
      expect(response.body.data.credentials.temporaryPassword).toBeDefined()
      expect(response.body.data.emailSent).toBeDefined()
    })

    it('should create professor with all optional fields', async () => {
      const response = await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Jane',
          surname: 'Doe',
          email: `prof-integration-test-2-${Date.now()}@ku.ac.th`,
          department: 'Mathematics',
          phoneNumber: '+66-123-456789',
          officeLocation: 'Building A, Room 301',
          title: 'Assistant Professor'
        })
        .expect(201)

      expect(response.body.data.professor.phoneNumber).toBe('+66-123-456789')
      expect(response.body.data.professor.officeLocation).toBe('Building A, Room 301')
      expect(response.body.data.professor.title).toBe('Assistant Professor')
    })

    it('should create professor with auto-generated password', async () => {
      const response = await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Auto',
          surname: 'Password',
          email: `prof-integration-test-3-${Date.now()}@ku.ac.th`,
          department: 'Physics'
        })
        .expect(201)

      expect(response.body.data.credentials).toBeDefined()
      expect(response.body.data.credentials.temporaryPassword).toBeDefined()
      expect(typeof response.body.data.credentials.temporaryPassword).toBe('string')
      expect(response.body.data.credentials.temporaryPassword.length).toBeGreaterThanOrEqual(12)
    })

    it('should create professor with custom password', async () => {
      const response = await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Custom',
          surname: 'Password',
          email: `prof-integration-test-4-${Date.now()}@ku.ac.th`,
          department: 'Chemistry',
          password: 'CustomPass123!'
        })
        .expect(201)

      expect(response.body.data.credentials).toBeUndefined()
    })

    it('should allow professor to login immediately after creation', async () => {
      const professorEmail = `prof-integration-test-5-${Date.now()}@ku.ac.th`
      const customPassword = 'MyPass123!'

      // Create professor
      const createResponse = await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Login',
          surname: 'Test',
          email: professorEmail,
          department: 'Biology',
          password: customPassword
        })
        .expect(201)

      expect(createResponse.body.data.user.status).toBe('APPROVED')
      expect(createResponse.body.data.user.verified).toBe(true)

      // Try to login
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: professorEmail,
          password: customPassword
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)
      expect(loginResponse.body.data.user.email).toBe(professorEmail)
      expect(loginResponse.body.data.user.role).toBe('PROFESSOR')
    })
  })

  describe('POST /api/admin/users/professor - Validation Errors', () => {
    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          surname: 'Smith',
          email: 'test@ku.ac.th',
          department: 'Computer Science'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Validation failed')
      expect(response.body.errors).toContain('Name is required and must be a non-empty string')
    })

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'John',
          surname: 'Smith',
          department: 'Computer Science'
        })
        .expect(400)

      expect(response.body.errors).toContain('Email is required')
    })

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'John',
          surname: 'Smith',
          email: 'invalid-email',
          department: 'Computer Science'
        })
        .expect(400)

      expect(response.body.errors).toContain('Email must be a valid email address')
    })

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'John',
          surname: 'Smith',
          email: `test-${Date.now()}@ku.ac.th`,
          department: 'Computer Science',
          password: 'weak'
        })
        .expect(400)

      expect(response.body.errors.some(e => e.includes('Password'))).toBe(true)
    })

    it('should return 409 for duplicate email', async () => {
      const duplicateEmail = `prof-integration-test-dup-${Date.now()}@ku.ac.th`

      // Create first professor
      await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'First',
          surname: 'Professor',
          email: duplicateEmail,
          department: 'Computer Science'
        })
        .expect(201)

      // Try to create second with same email
      const response = await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Second',
          surname: 'Professor',
          email: duplicateEmail,
          department: 'Mathematics'
        })
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Email already registered')
    })
  })

  describe('POST /api/admin/users/professor - Authorization', () => {
    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/admin/users/professor')
        .send({
          name: 'John',
          surname: 'Smith',
          email: 'test@ku.ac.th',
          department: 'Computer Science'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .post('/api/admin/users/professor')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'John',
          surname: 'Smith',
          email: 'test@ku.ac.th',
          department: 'Computer Science'
        })
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })
})
