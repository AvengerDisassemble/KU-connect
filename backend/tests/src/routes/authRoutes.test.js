const request = require('supertest')
const { PrismaClient } = require('../../../src/generated/prisma')

const prisma = new PrismaClient()

// Set up environment variables for tests FIRST
process.env.GOOGLE_CLIENT_ID = 'test-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3000/api/auth/google/callback'
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret'
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret'

// Mock passport authentication BEFORE requiring anything that uses it
jest.mock('passport', () => {
  const actualPassport = jest.requireActual('passport')
  return {
    ...actualPassport,
    use: jest.fn(),
    initialize: jest.fn(() => (req, res, next) => next()),
    authenticate: jest.fn((strategy, options) => {
      // Return a middleware function
      return (req, res, next) => {
        if (options && options.failureRedirect) {
          // Default behavior for tests - just continue
          next()
        } else {
          // For initiation, redirect to Google
          res.redirect('https://accounts.google.com/o/oauth2/v2/auth')
        }
      }
    })
  }
})

const passport = require('passport')
const app = require('../../../src/app')

describe('Auth Routes - Google OAuth Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /api/auth/google', () => {
    it('should initiate Google OAuth flow', async () => {
      const response = await request(app)
        .get('/api/auth/google')

      // Should redirect to Google (status 302)
      expect(response.status).toBe(302)
      expect(response.headers.location).toContain('accounts.google.com')
    })
  })

  describe('GET /api/auth/google/callback', () => {
    beforeEach(async () => {
      // Clean up test data
      await prisma.refreshToken.deleteMany({})
      await prisma.account.deleteMany({})
      await prisma.student.deleteMany({})
      await prisma.user.deleteMany({})
    })

    it('should return JWT tokens on successful OAuth callback', async () => {
      // Ensure degree type exists
      await prisma.degreeType.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, name: 'Bachelor of Science' }
      })

      const mockUser = {
        id: 'test-user-id',
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
        role: 'STUDENT',
        verified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Override the authenticate mock for this specific test
      passport.authenticate.mockImplementationOnce((strategy, options) => {
        return (req, res, next) => {
          // Simulate successful authentication by attaching user to request
          req.user = mockUser
          next()
        }
      })

      const response = await request(app)
        .get('/api/auth/google/callback')

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body).toHaveProperty('refreshToken')
      expect(response.body.user.email).toBe('john.doe@example.com')
    })

    it('should redirect to /login on authentication failure', async () => {
      // Override the authenticate mock to simulate failure
      passport.authenticate.mockImplementationOnce((strategy, options) => {
        return (req, res, next) => {
          // Simulate authentication failure
          res.redirect(options.failureRedirect || '/login')
        }
      })

      const response = await request(app)
        .get('/api/auth/google/callback')

      expect(response.status).toBe(302)
      expect(response.headers.location).toBe('/login')
    })
  })

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      // Clean up test data
      await prisma.refreshToken.deleteMany({})
      await prisma.account.deleteMany({})
      await prisma.student.deleteMany({})
      await prisma.user.deleteMany({})
    })

    it('should refresh access token with valid refresh token', async () => {
      // Create a test user with refresh token
      const user = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'User',
          email: 'test@example.com',
          password: null,
          role: 'STUDENT',
          verified: true
        }
      })

      const { generateRefreshToken, getRefreshTokenExpiry } = require('../../../src/utils/tokenUtils')
      const refreshToken = generateRefreshToken({ id: user.id, jti: 'test-jti' })

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: getRefreshTokenExpiry()
        }
      })

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('accessToken')
      expect(response.body.user.email).toBe('test@example.com')
    })

    it('should return error for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      // Clean up test data
      await prisma.refreshToken.deleteMany({})
      await prisma.user.deleteMany({})
    })

    it('should logout user and invalidate refresh token', async () => {
      // Create a test user with refresh token
      const user = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'User',
          email: 'logout@example.com',
          password: null,
          role: 'STUDENT',
          verified: true
        }
      })

      const { generateRefreshToken, getRefreshTokenExpiry } = require('../../../src/utils/tokenUtils')
      const refreshToken = generateRefreshToken({ id: user.id, jti: 'logout-jti' })

      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: getRefreshTokenExpiry()
        }
      })

      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })

      expect(response.status).toBe(200)

      // Verify token was deleted
      const token = await prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      })
      expect(token).toBeNull()
    })
  })
})
