const { PrismaClient } = require('../../../src/generated/prisma')
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById,
  findOrCreateGoogleUser
} = require('../../../src/services/authService')
const { hashPassword } = require('../../../src/utils/passwordUtils')
const { generateRefreshToken, generateJwtId, getRefreshTokenExpiry } = require('../../../src/utils/tokenUtils')

const prisma = new PrismaClient()

// Mock the password and token utilities
jest.mock('../../../src/utils/passwordUtils')
jest.mock('../../../src/utils/tokenUtils')

// Allow enabling these integration tests in local dev by setting RUN_ALL_TESTS=true
const describeIfOAuth = describe

// OAuth tests are disabled for CI/CD as they require complex database setup
// These tests work locally but may fail in GitHub Actions due to environment differences
describeIfOAuth('AuthService - OAuth Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('findOrCreateGoogleUser', () => {
    const mockGoogleProfile = {
      providerAccountId: 'google-123456',
      email: 'test@example.com',
      name: 'John',
      surname: 'Doe',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token'
    }

    beforeEach(async () => {
      // Clean up test data in dependency-safe order to avoid FK constraint violations
      await prisma.refreshToken.deleteMany().catch(() => {})
      await prisma.account.deleteMany().catch(() => {})
      await prisma.student.deleteMany().catch(() => {})
      await prisma.admin.deleteMany().catch(() => {})
      await prisma.hR.deleteMany().catch(() => {})
      await prisma.professor.deleteMany().catch(() => {})
      await prisma.jobReport.deleteMany().catch(() => {})
      await prisma.notification.deleteMany().catch(() => {})
      await prisma.announcement.deleteMany().catch(() => {})
      await prisma.resume.deleteMany().catch(() => {})
      await prisma.application.deleteMany().catch(() => {})
      await prisma.studentInterest.deleteMany().catch(() => {})
      await prisma.savedJob.deleteMany().catch(() => {})
      await prisma.job.deleteMany().catch(() => {})
      await prisma.requirement.deleteMany().catch(() => {})
      await prisma.qualification.deleteMany().catch(() => {})
      await prisma.responsibility.deleteMany().catch(() => {})
      await prisma.benefit.deleteMany().catch(() => {})
      await prisma.tag.deleteMany().catch(() => {})
      await prisma.user.deleteMany().catch(() => {})
    })

    it('should return existing user when account already exists', async () => {
      // Create a user and account
      const existingUser = await prisma.user.create({
        data: {
          name: 'John',
          surname: 'Doe',
          email: 'test@example.com',
          password: null,
          role: 'STUDENT',
          verified: true
        }
      })

      await prisma.account.create({
        data: {
          userId: existingUser.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: 'google-123456',
          access_token: 'old-token',
          token_type: 'Bearer',
          scope: 'profile email'
        }
      })

      const result = await findOrCreateGoogleUser(mockGoogleProfile)

      expect(result.id).toBe(existingUser.id)
      expect(result.email).toBe('test@example.com')
      expect(result.verified).toBe(true)
    })

    it('should link Google account to existing user with same email', async () => {
      // Create a user without Google account
      const existingUser = await prisma.user.create({
        data: {
          name: 'John',
          surname: 'Doe',
          email: 'test@example.com',
          password: await hashPassword('password123'),
          role: 'STUDENT',
          verified: false
        }
      })

      const result = await findOrCreateGoogleUser(mockGoogleProfile)

      expect(result.id).toBe(existingUser.id)
      expect(result.email).toBe('test@example.com')

      // Verify that account was created and linked
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: 'google-123456'
          }
        }
      })

      expect(account).not.toBeNull()
      expect(account.userId).toBe(existingUser.id)
      expect(account.provider).toBe('google')
    })

    it('should create new user, account, and student record for new Google user', async () => {
      const result = await findOrCreateGoogleUser(mockGoogleProfile)

      expect(result.email).toBe('test@example.com')
      expect(result.name).toBe('John')
      expect(result.surname).toBe('Doe')
      expect(result.role).toBe('STUDENT')
      expect(result.verified).toBe(true)

      // Verify user was created
      const user = await prisma.user.findUnique({
        where: { email: 'test@example.com' }
      })
      expect(user).not.toBeNull()
      expect(user.password).toBeNull() // OAuth users have no password

      // Verify account was created
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: 'google-123456'
          }
        }
      })
      expect(account).not.toBeNull()
      expect(account.userId).toBe(user.id)

      // Verify student record was created
      const student = await prisma.student.findUnique({
        where: { userId: user.id }
      })
      expect(student).not.toBeNull()
      expect(student.address).toBe('To be updated')
      // Just check that degreeTypeId exists and is a string
      expect(student.degreeTypeId).toBeDefined()
      expect(typeof student.degreeTypeId).toBe('string')
    })
  })

  describe('loginUser - OAuth Protection', () => {
    beforeEach(async () => {
      // Clean up test data in dependency-safe order to avoid FK constraint violations
      await prisma.refreshToken.deleteMany().catch(() => {})
      await prisma.account.deleteMany().catch(() => {})
      await prisma.student.deleteMany().catch(() => {})
      await prisma.admin.deleteMany().catch(() => {})
      await prisma.hR.deleteMany().catch(() => {})
      await prisma.professor.deleteMany().catch(() => {})
      await prisma.jobReport.deleteMany().catch(() => {})
      await prisma.notification.deleteMany().catch(() => {})
      await prisma.announcement.deleteMany().catch(() => {})
      await prisma.resume.deleteMany().catch(() => {})
      await prisma.application.deleteMany().catch(() => {})
      await prisma.studentInterest.deleteMany().catch(() => {})
      await prisma.savedJob.deleteMany().catch(() => {})
      await prisma.user.deleteMany().catch(() => {})
    })

    it('should throw error when trying to login OAuth user with password', async () => {
      // Create OAuth-only user (no password)
      await prisma.user.create({
        data: {
          name: 'Jane',
          surname: 'Smith',
          email: 'oauth@example.com',
          password: null, // No password for OAuth users
          role: 'STUDENT',
          verified: true
        }
      })

      await expect(
        loginUser('oauth@example.com', 'anypassword')
      ).rejects.toThrow('This account uses OAuth authentication. Please sign in with Google.')
    })

    it('should successfully login user with password', async () => {
      const hashedPassword = 'hashed_password_123'
      hashPassword.mockResolvedValue(hashedPassword)

      // Create user with password
      await prisma.user.create({
        data: {
          name: 'John',
          surname: 'Doe',
          email: 'local@example.com',
          password: hashedPassword,
          role: 'STUDENT',
          verified: true
        }
      })

      // Mock password comparison and token generation
      const { comparePassword } = require('../../../src/utils/passwordUtils')
      comparePassword.mockResolvedValue(true)
      generateJwtId.mockReturnValue('jwt-id-123')
      generateRefreshToken.mockReturnValue('refresh-token-123')
      getRefreshTokenExpiry.mockReturnValue(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

      const { generateAccessToken } = require('../../../src/utils/tokenUtils')
      generateAccessToken.mockReturnValue('access-token-123')

      const result = await loginUser('local@example.com', 'password123')

      expect(result.user.email).toBe('local@example.com')
      expect(result.accessToken).toBe('access-token-123')
      expect(result.refreshToken).toBe('refresh-token-123')
      expect(result.user.password).toBeUndefined() // Password should not be in response
    })

    it('should throw error for non-existent user', async () => {
      await expect(
        loginUser('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials')
    })
  })
})
