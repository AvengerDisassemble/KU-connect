const request = require('supertest')
const app = require('../../src/app')
const { PrismaClient } = require('../../src/generated/prisma')

const prisma = new PrismaClient()

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Clean up any existing test data - delete in correct order to avoid foreign key constraints
    await prisma.refreshToken.deleteMany()
    await prisma.student.deleteMany()
    await prisma.professor.deleteMany()
    await prisma.admin.deleteMany()
    await prisma.hR.deleteMany()
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    })

    // Seed required degree types for testing
    await prisma.degreeType.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Computer Science'
      }
    })
  })

  afterAll(async () => {
    // Clean up test data - delete in correct order to avoid foreign key constraints
    await prisma.refreshToken.deleteMany()
    await prisma.student.deleteMany()
    await prisma.professor.deleteMany()
    await prisma.admin.deleteMany()
    await prisma.hR.deleteMany()
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'test'
        }
      }
    })
    await prisma.degreeType.deleteMany({
      where: {
        id: 1
      }
    })
    await prisma.$disconnect()
  })

  describe('POST /api/register/alumni', () => {
    it('should register a new alumni successfully', async () => {
      const alumniData = {
        name: 'John',
        surname: 'Doe',
        email: 'john.alumni.test@ku.th',
        password: 'Password123',
        degreeTypeId: 1,
        address: '123 Test Street, Bangkok, Thailand'
      }

      const response = await request(app)
        .post('/api/register/alumni')
        .send(alumniData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Alumni registration successful')
      expect(response.body.data.user.email).toBe(alumniData.email)
      expect(response.body.data.user.role).toBe('STUDENT')
      expect(response.body.data.user.password).toBeUndefined()
    })

    it('should not register alumni with invalid data', async () => {
      const invalidData = {
        name: 'J',
        email: 'invalid-email',
        password: '123'
      }

      const response = await request(app)
        .post('/api/register/alumni')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })

    it('should not register alumni with duplicate email', async () => {
      const alumniData = {
        name: 'Jane',
        surname: 'Doe',
        email: 'john.alumni.test@ku.th', // Same email as above
        password: 'Password123',
        degreeTypeId: 1,
        address: '456 Test Street, Bangkok, Thailand'
      }

      const response = await request(app)
        .post('/api/register/alumni')
        .send(alumniData)
      
      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/register/enterprise', () => {
    it('should register a new enterprise successfully', async () => {
      const enterpriseData = {
        name: 'Alice',
        surname: 'Smith',
        email: 'alice.enterprise.test@company.com',
        password: 'Password123',
        companyName: 'Test Company Ltd.',
        address: '789 Business District, Bangkok, Thailand'
      }

      const response = await request(app)
        .post('/api/register/enterprise')
        .send(enterpriseData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Enterprise registration successful')
      expect(response.body.data.user.email).toBe(enterpriseData.email)
      expect(response.body.data.user.role).toBe('EMPLOYER')
      expect(response.body.data.user.password).toBeUndefined()
    })

    it('should not register enterprise with invalid data', async () => {
      const invalidData = {
        name: 'A',
        companyName: 'T'
      }

      const response = await request(app)
        .post('/api/register/enterprise')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('POST /api/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'john.alumni.test@ku.th',
          password: 'Password123'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.data.user.email).toBe('john.alumni.test@ku.th')
      expect(response.body.data.user.password).toBeUndefined()

      // Check if cookies are set
      const cookies = response.headers['set-cookie']
      expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true)
      expect(cookies.some(cookie => cookie.includes('refreshToken'))).toBe(true)
    })

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'john.alumni.test@ku.th',
          password: 'WrongPassword'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should not login with missing data', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: 'test@example.com'
          // Missing password
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.errors).toBeDefined()
    })
  })

  describe('Authentication Protected Routes', () => {
    let accessToken
    let refreshToken

    beforeAll(async () => {
      // Login to get tokens
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: 'john.alumni.test@ku.th',
          password: 'Password123'
        })

      // Extract tokens from cookies
      const cookies = loginResponse.headers['set-cookie'] || []
      accessToken = cookies
        .find(cookie => cookie && cookie.includes('accessToken'))
        ?.split(';')[0]
        ?.split('=')[1]
      refreshToken = cookies
        .find(cookie => cookie && cookie.includes('refreshToken'))
        ?.split(';')[0]
        ?.split('=')[1]
    })

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`accessToken=${accessToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('john.alumni.test@ku.th')
    })

    it('should not access protected route without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Token refreshed successfully')

      // Check if new access token is set
      const cookies = response.headers['set-cookie']
      expect(cookies.some(cookie => cookie.includes('accessToken'))).toBe(true)
    })

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Logout successful')
    })
  })
})