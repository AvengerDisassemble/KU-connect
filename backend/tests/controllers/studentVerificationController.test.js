/**
 * @module tests/controllers/studentVerificationController.test
 * @description Test student verification document uploads for unverified accounts
 */

const request = require('supertest')
const app = require('../../src/app')
const prisma = require('../../src/models/prisma')
const jwt = require('jsonwebtoken')

// Mock storage provider to avoid actual file operations
jest.mock('../../src/services/storageFactory', () => ({
  uploadFile: jest.fn().mockResolvedValue('mock-verification-key-12345'),
  getFileUrl: jest.fn().mockResolvedValue('https://mock-url.com/student-verification'),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  getReadStream: jest.fn().mockResolvedValue({
    stream: require('stream').Readable.from(Buffer.from('%PDF-1.4 mock verification doc')),
    mimeType: 'application/pdf',
    filename: 'student-verification.pdf'
  }),
  getSignedDownloadUrl: jest.fn().mockResolvedValue(null) // Local storage returns null
}))

const storageProvider = require('../../src/services/storageFactory')

describe('Student Verification Controller', () => {
  let unverifiedStudentToken, verifiedStudentToken, adminToken
  let unverifiedStudentUserId, verifiedStudentUserId, adminUserId

  beforeAll(async () => {
    try {
      // Clean up any existing test data
      await prisma.student.deleteMany({
        where: {
          user: {
            email: {
              in: [
                'unverified-student@test.com',
                'verified-student@test.com'
              ]
            }
          }
        }
      })

      await prisma.admin.deleteMany({
        where: {
          user: {
            email: 'verification-admin@test.com'
          }
        }
      })

      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              'unverified-student@test.com',
              'verified-student@test.com',
              'verification-admin@test.com'
            ]
          }
        }
      })

      // Get or create degree type
      let degreeType = await prisma.degreeType.findFirst()
      if (!degreeType) {
        degreeType = await prisma.degreeType.create({
          data: { name: 'Computer Science' }
        })
      }

      // Create unverified student
      const unverifiedStudent = await prisma.user.create({
        data: {
          email: 'unverified-student@test.com',
          password: 'hashedPassword',
          name: 'Unverified',
          surname: 'Student',
          role: 'STUDENT',
          verified: false,
          student: {
            create: {
              address: '123 Test St',
              degreeTypeId: degreeType.id
            }
          }
        }
      })
      unverifiedStudentUserId = unverifiedStudent.id

      // Create verified student
      const verifiedStudent = await prisma.user.create({
        data: {
          email: 'verified-student@test.com',
          password: 'hashedPassword',
          name: 'Verified',
          surname: 'Student',
          role: 'STUDENT',
          verified: true,
          student: {
            create: {
              address: '456 Test Ave',
              degreeTypeId: degreeType.id
            }
          }
        }
      })
      verifiedStudentUserId = verifiedStudent.id

      // Create admin
      const admin = await prisma.user.create({
        data: {
          email: 'verification-admin@test.com',
          password: 'hashedPassword',
          name: 'Admin',
          surname: 'User',
          role: 'ADMIN',
          verified: true,
          admin: {
            create: {}
          }
        }
      })
      adminUserId = admin.id

      // Generate tokens using the same secret as the auth middleware
      const secret = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret'
      unverifiedStudentToken = jwt.sign(
        { id: unverifiedStudentUserId, role: 'STUDENT' },
        secret,
        { expiresIn: '1h' }
      )

      verifiedStudentToken = jwt.sign(
        { id: verifiedStudentUserId, role: 'STUDENT' },
        secret,
        { expiresIn: '1h' }
      )

      adminToken = jwt.sign(
        { id: adminUserId, role: 'ADMIN' },
        secret,
        { expiresIn: '1h' }
      )
    } catch (error) {
      console.error('Setup error:', error)
      throw error
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/documents/student-verification - Upload verification document', () => {
    it('should allow unverified student to upload verification document', async () => {
      const response = await request(app)
        .post('/api/documents/student-verification')
        .set('Authorization', `Bearer ${unverifiedStudentToken}`)
        .attach('verification', Buffer.from('mock pdf content'), {
          filename: 'student-id.pdf',
          contentType: 'application/pdf'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('uploaded successfully')
      expect(response.body.message).toContain('Pending admin review')
      expect(storageProvider.uploadFile).toHaveBeenCalled()
    })

    it('should accept JPEG files', async () => {
      const response = await request(app)
        .post('/api/documents/student-verification')
        .set('Authorization', `Bearer ${unverifiedStudentToken}`)
        .attach('verification', Buffer.from('mock jpeg content'), {
          filename: 'student-id.jpg',
          contentType: 'image/jpeg'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should accept PNG files', async () => {
      const response = await request(app)
        .post('/api/documents/student-verification')
        .set('Authorization', `Bearer ${unverifiedStudentToken}`)
        .attach('verification', Buffer.from('mock png content'), {
          filename: 'student-id.png',
          contentType: 'image/png'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    it('should reject already verified students', async () => {
      const response = await request(app)
        .post('/api/documents/student-verification')
        .set('Authorization', `Bearer ${verifiedStudentToken}`)
        .attach('verification', Buffer.from('mock pdf content'), {
          filename: 'student-id.pdf',
          contentType: 'application/pdf'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('already verified')
    })

    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/documents/student-verification')
        .set('Authorization', `Bearer ${unverifiedStudentToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('No file uploaded')
    })

    it('should reject non-student users', async () => {
      const response = await request(app)
        .post('/api/documents/student-verification')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('verification', Buffer.from('mock pdf content'), {
          filename: 'student-id.pdf',
          contentType: 'application/pdf'
        })

      expect(response.status).toBe(403)
    })

    it('should replace old verification document', async () => {
      // First upload
      await request(app)
        .post('/api/documents/student-verification')
        .set('Authorization', `Bearer ${unverifiedStudentToken}`)
        .attach('verification', Buffer.from('mock pdf content'), {
          filename: 'student-id-old.pdf',
          contentType: 'application/pdf'
        })

      jest.clearAllMocks()

      // Second upload (should replace)
      const response = await request(app)
        .post('/api/documents/student-verification')
        .set('Authorization', `Bearer ${unverifiedStudentToken}`)
        .attach('verification', Buffer.from('mock pdf content'), {
          filename: 'student-id-new.pdf',
          contentType: 'application/pdf'
        })

      expect(response.status).toBe(200)
      expect(storageProvider.deleteFile).toHaveBeenCalled()
      expect(storageProvider.uploadFile).toHaveBeenCalled()
    })
  })

  describe('GET /api/documents/student-verification/:userId/download - Download verification document', () => {
    beforeEach(async () => {
      // Ensure unverified student has a verification document
      await prisma.student.update({
        where: { userId: unverifiedStudentUserId },
        data: { verificationDocKey: 'mock-verification-key-12345' }
      })
    })

    it('should allow admin to download student verification document', async () => {
      const response = await request(app)
        .get(`/api/documents/student-verification/${unverifiedStudentUserId}/download`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toBe('application/pdf')
      expect(response.headers['content-disposition']).toContain('inline')
      expect(response.headers['cache-control']).toContain('no-store')
      expect(storageProvider.getReadStream).toHaveBeenCalled()
    })

    it('should allow student to download their own verification document', async () => {
      const response = await request(app)
        .get(`/api/documents/student-verification/${unverifiedStudentUserId}/download`)
        .set('Authorization', `Bearer ${unverifiedStudentToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toBe('application/pdf')
    })

    it('should deny other students from downloading', async () => {
      const response = await request(app)
        .get(`/api/documents/student-verification/${unverifiedStudentUserId}/download`)
        .set('Authorization', `Bearer ${verifiedStudentToken}`)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
    })

    it('should return 404 when verification document not found', async () => {
      // Clear verification document
      await prisma.student.update({
        where: { userId: unverifiedStudentUserId },
        data: { verificationDocKey: null }
      })

      const response = await request(app)
        .get(`/api/documents/student-verification/${unverifiedStudentUserId}/download`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(404)
      expect(response.body.message).toContain('not found')

      // Restore for other tests
      await prisma.student.update({
        where: { userId: unverifiedStudentUserId },
        data: { verificationDocKey: 'mock-verification-key-12345' }
      })
    })

    it('should set security headers correctly', async () => {
      const response = await request(app)
        .get(`/api/documents/student-verification/${unverifiedStudentUserId}/download`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.headers['cache-control']).toContain('no-store')
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['content-disposition']).toContain('inline')
    })
  })

  // Clean up after all tests
  afterAll(async () => {
    await prisma.$disconnect()
  })
})
