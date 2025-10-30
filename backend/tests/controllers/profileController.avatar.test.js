/**
 * @module tests/controllers/profileController.avatar.test
 * @description Test avatar upload and download functionality for profile controller
 */

const request = require('supertest')
const app = require('../../src/app')
const prisma = require('../../src/models/prisma')
const jwt = require('jsonwebtoken')

// Mock storage provider to avoid actual file operations
jest.mock('../../src/services/storageFactory', () => ({
  uploadFile: jest.fn().mockResolvedValue('avatars/user-123/avatar-timestamp.jpg'),
  getFileUrl: jest.fn().mockResolvedValue('https://mock-url.com/avatar.jpg'),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  getReadStream: jest.fn().mockResolvedValue({
    stream: require('stream').Readable.from(Buffer.from('fake-image-data')),
    mimeType: 'image/jpeg',
    filename: 'avatar.jpg'
  }),
  getSignedDownloadUrl: jest.fn().mockResolvedValue(null) // Local storage returns null
}))

describe('Profile Controller - Avatar Routes', () => {
  let studentToken, hrToken, adminToken, professorToken
  let studentUserId, hrUserId, adminUserId, professorUserId
  const storageFactory = require('../../src/services/storageFactory')

  beforeAll(async () => {
    try {
      // Create or get a degreeType for testing
      let degreeType = await prisma.degreeType.findFirst()
      if (!degreeType) {
        degreeType = await prisma.degreeType.create({
          data: {
            name: 'Test Degree for Avatar Tests'
          }
        })
      }

      // Create test student user
      const studentUser = await prisma.user.create({
        data: {
          name: 'Avatar',
          surname: 'Student',
          email: `avatar-student-${Date.now()}@test.com`,
          username: `avatarstu-${Date.now()}`,
          password: 'hashedpass',
          role: 'STUDENT',
          verified: true
        }
      })
      studentUserId = studentUser.id

      // Create student profile
      await prisma.student.create({
        data: {
          userId: studentUserId,
          degreeTypeId: degreeType.id,
          address: '123 Avatar St'
        }
      })

      // Create test HR user
      const hrUser = await prisma.user.create({
        data: {
          name: 'Avatar',
          surname: 'HR',
          email: `avatar-hr-${Date.now()}@test.com`,
          username: `avatarhr-${Date.now()}`,
          password: 'hashedpass',
          role: 'EMPLOYER',
          verified: true
        }
      })
      hrUserId = hrUser.id

      // Create HR profile
      await prisma.hR.create({
        data: {
          userId: hrUserId,
          companyName: 'Avatar Company',
          address: '456 Avatar Ave'
        }
      })

      // Create test admin user
      const adminUser = await prisma.user.create({
        data: {
          name: 'Avatar',
          surname: 'Admin',
          email: `avatar-admin-${Date.now()}@test.com`,
          username: `avataradmin-${Date.now()}`,
          password: 'hashedpass',
          role: 'ADMIN',
          verified: true
        }
      })
      adminUserId = adminUser.id

      await prisma.admin.create({
        data: { userId: adminUserId }
      })

      // Create test professor user
      const professorUser = await prisma.user.create({
        data: {
          name: 'Avatar',
          surname: 'Professor',
          email: `avatar-prof-${Date.now()}@test.com`,
          username: `avatarprof-${Date.now()}`,
          password: 'hashedpass',
          role: 'PROFESSOR',
          verified: true
        }
      })
      professorUserId = professorUser.id

      await prisma.professor.create({
        data: {
          userId: professorUserId,
          department: 'Computer Science'
        }
      })

      // Generate tokens
      const secret = process.env.ACCESS_TOKEN_SECRET || 'your-access-token-secret'
      studentToken = jwt.sign({ id: studentUserId, role: 'STUDENT' }, secret, { expiresIn: '1h' })
      hrToken = jwt.sign({ id: hrUserId, role: 'EMPLOYER' }, secret, { expiresIn: '1h' })
      adminToken = jwt.sign({ id: adminUserId, role: 'ADMIN' }, secret, { expiresIn: '1h' })
      professorToken = jwt.sign({ id: professorUserId, role: 'PROFESSOR' }, secret, { expiresIn: '1h' })
    } catch (error) {
      console.error('Setup error:', error)
      throw error
    }
  })

  afterAll(async () => {
    try {
      // Cleanup test data
      if (studentUserId) {
        await prisma.student.deleteMany({ where: { userId: studentUserId } })
      }
      if (hrUserId) {
        await prisma.hR.deleteMany({ where: { userId: hrUserId } })
      }
      if (adminUserId) {
        await prisma.admin.deleteMany({ where: { userId: adminUserId } })
      }
      if (professorUserId) {
        await prisma.professor.deleteMany({ where: { userId: professorUserId } })
      }

      const userIdsToDelete = [studentUserId, hrUserId, adminUserId, professorUserId].filter(id => id !== undefined)
      if (userIdsToDelete.length > 0) {
        await prisma.user.deleteMany({
          where: {
            id: { in: userIdsToDelete }
          }
        })
      }
    } catch (error) {
      console.error('Cleanup error:', error)
    } finally {
      await prisma.$disconnect()
    }
  })

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
  })

  describe('POST /api/profile/avatar', () => {
    test('should upload avatar for authenticated student', async () => {
      const imageBuffer = Buffer.from('fake-jpeg-data')

      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', imageBuffer, {
          filename: 'avatar.jpg',
          contentType: 'image/jpeg'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Avatar uploaded successfully')
      expect(response.body.data.fileKey).toBe('avatars/user-123/avatar-timestamp.jpg')
      expect(storageFactory.uploadFile).toHaveBeenCalledTimes(1)
    })

    test('should upload avatar for authenticated HR', async () => {
      const imageBuffer = Buffer.from('fake-png-data')

      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${hrToken}`)
        .attach('avatar', imageBuffer, {
          filename: 'avatar.png',
          contentType: 'image/png'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(storageFactory.uploadFile).toHaveBeenCalled()
    })

    test('should upload avatar for admin', async () => {
      const imageBuffer = Buffer.from('fake-gif-data')

      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('avatar', imageBuffer, {
          filename: 'avatar.gif',
          contentType: 'image/gif'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    test('should accept WebP format', async () => {
      const imageBuffer = Buffer.from('fake-webp-data')

      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', imageBuffer, {
          filename: 'avatar.webp',
          contentType: 'image/webp'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    test('should reject unauthenticated users', async () => {
      const imageBuffer = Buffer.from('fake-jpeg-data')

      const response = await request(app)
        .post('/api/profile/avatar')
        .attach('avatar', imageBuffer, {
          filename: 'avatar.jpg',
          contentType: 'image/jpeg'
        })

      expect(response.status).toBe(401)
      expect(storageFactory.uploadFile).not.toHaveBeenCalled()
    })

    test('should reject request without file', async () => {
      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('No file uploaded')
      expect(storageFactory.uploadFile).not.toHaveBeenCalled()
    })

    test('should reject non-image files', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf')

      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', pdfBuffer, {
          filename: 'document.pdf',
          contentType: 'application/pdf'
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('JPEG, PNG, GIF, or WebP')
      expect(storageFactory.uploadFile).not.toHaveBeenCalled()
    })

    test('should reject unsupported image formats', async () => {
      const bmpBuffer = Buffer.from('fake-bmp-data')

      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', bmpBuffer, {
          filename: 'avatar.bmp',
          contentType: 'image/bmp'
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toContain('JPEG, PNG, GIF, or WebP')
    })

    test('should delete old avatar when uploading new one', async () => {
      // Set existing avatar key
      await prisma.user.update({
        where: { id: studentUserId },
        data: { avatarKey: 'avatars/old-avatar.jpg' }
      })

      const imageBuffer = Buffer.from('fake-jpeg-data')

      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', imageBuffer, {
          filename: 'new-avatar.jpg',
          contentType: 'image/jpeg'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(storageFactory.deleteFile).toHaveBeenCalledWith('avatars/old-avatar.jpg')
      expect(storageFactory.uploadFile).toHaveBeenCalled()
    })

    test('should continue if old avatar deletion fails', async () => {
      // Set existing avatar key
      await prisma.user.update({
        where: { id: studentUserId },
        data: { avatarKey: 'avatars/non-existent.jpg' }
      })

      // Mock deletion to fail
      storageFactory.deleteFile.mockRejectedValueOnce(new Error('File not found'))

      const imageBuffer = Buffer.from('fake-jpeg-data')

      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', imageBuffer, {
          filename: 'new-avatar.jpg',
          contentType: 'image/jpeg'
        })

      // Should still succeed even if old file deletion fails
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(storageFactory.uploadFile).toHaveBeenCalled()
    })

    test('should update user avatarKey in database', async () => {
      const imageBuffer = Buffer.from('fake-jpeg-data')

      await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', imageBuffer, {
          filename: 'avatar.jpg',
          contentType: 'image/jpeg'
        })

      const updatedUser = await prisma.user.findUnique({
        where: { id: studentUserId },
        select: { avatarKey: true }
      })

      expect(updatedUser.avatarKey).toBe('avatars/user-123/avatar-timestamp.jpg')
    })

    test('should handle upload service errors gracefully', async () => {
      // Mock upload to fail
      storageFactory.uploadFile.mockRejectedValueOnce(new Error('Storage service unavailable'))

      const imageBuffer = Buffer.from('fake-jpeg-data')

      const response = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', imageBuffer, {
          filename: 'avatar.jpg',
          contentType: 'image/jpeg'
        })

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Failed to upload avatar')
    })
  })

  describe('GET /api/profile/avatar/:userId/download', () => {
    beforeEach(async () => {
      // Set avatar keys for test users
      await prisma.user.update({
        where: { id: studentUserId },
        data: { avatarKey: 'avatars/student-avatar.jpg' }
      })

      await prisma.user.update({
        where: { id: hrUserId },
        data: { avatarKey: 'avatars/hr-avatar.jpg' }
      })
    })

    test('should allow user to download their own avatar', async () => {
      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toBe('image/jpeg')
      expect(response.headers['content-disposition']).toContain('inline')
      expect(response.headers['cache-control']).toContain('public')
      expect(response.headers['cache-control']).toContain('max-age=3600')
      expect(storageFactory.getReadStream).toHaveBeenCalledWith('avatars/student-avatar.jpg')
    })

    test('should allow admin to download any avatar', async () => {
      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toBe('image/jpeg')
    })

    test('should allow HR to download any avatar', async () => {
      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)
        .set('Authorization', `Bearer ${hrToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toBe('image/jpeg')
    })

    test('should allow professor to download any avatar', async () => {
      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)
        .set('Authorization', `Bearer ${professorToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toBe('image/jpeg')
    })

    test('should allow any authenticated user to view avatars', async () => {
      // Student downloading HR avatar
      const response = await request(app)
        .get(`/api/profile/avatar/${hrUserId}/download`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toBe('image/jpeg')
    })

    test('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)

      expect(response.status).toBe(401)
      expect(storageFactory.getReadStream).not.toHaveBeenCalled()
    })

    test('should return 404 for non-existent user', async () => {
      const fakeUserId = 'non-existent-user-id'

      const response = await request(app)
        .get(`/api/profile/avatar/${fakeUserId}/download`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('User not found')
    })

    test('should return 404 when user has no avatar', async () => {
      // Clear avatar key
      await prisma.user.update({
        where: { id: studentUserId },
        data: { avatarKey: null }
      })

      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('No avatar found for this user')
      expect(storageFactory.getReadStream).not.toHaveBeenCalled()

      // Restore avatar key for other tests
      await prisma.user.update({
        where: { id: studentUserId },
        data: { avatarKey: 'avatars/student-avatar.jpg' }
      })
    })

    test('should handle signed URL redirect for S3 storage', async () => {
      // Mock S3 signed URL
      storageFactory.getSignedDownloadUrl.mockResolvedValueOnce('https://s3.amazonaws.com/signed-url')

      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(302) // Redirect
      expect(response.headers.location).toBe('https://s3.amazonaws.com/signed-url')
      expect(storageFactory.getSignedDownloadUrl).toHaveBeenCalledWith('avatars/student-avatar.jpg')
    })

    test('should stream file for local storage', async () => {
      // Ensure signed URL returns null (local storage)
      storageFactory.getSignedDownloadUrl.mockResolvedValueOnce(null)

      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toBe('image/jpeg')
      expect(storageFactory.getReadStream).toHaveBeenCalled()
    })

    test('should return 404 if file not found in storage', async () => {
      // Mock file not found error
      storageFactory.getReadStream.mockRejectedValueOnce(new Error('File not found in storage'))

      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Avatar file not found')
    })

    test('should handle storage service errors', async () => {
      // Mock generic storage error
      storageFactory.getReadStream.mockRejectedValueOnce(new Error('Storage service error'))

      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Failed to download avatar')
    })

    test('should include security headers', async () => {
      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['x-content-type-options']).toBe('nosniff')
      expect(response.headers['cache-control']).toContain('public')
    })
  })

  describe('Route ordering and conflicts', () => {
    test('should not confuse /avatar/:userId/download with /:userId', async () => {
      // Ensure avatar route is matched before generic profile route
      const response = await request(app)
        .get(`/api/profile/avatar/${studentUserId}/download`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(200)
      expect(response.headers['content-type']).toBe('image/jpeg')
      // Should use avatar controller, not profile controller
      expect(storageFactory.getReadStream).toHaveBeenCalled()
    })

    test('should correctly handle /avatar POST vs /:userId GET', async () => {
      const imageBuffer = Buffer.from('fake-jpeg-data')

      const uploadResponse = await request(app)
        .post('/api/profile/avatar')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('avatar', imageBuffer, {
          filename: 'avatar.jpg',
          contentType: 'image/jpeg'
        })

      expect(uploadResponse.status).toBe(200)
      expect(uploadResponse.body.message).toBe('Avatar uploaded successfully')

      // Should not conflict with GET /:userId
      const getResponse = await request(app)
        .get(`/api/profile/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(getResponse.status).toBe(200)
      expect(getResponse.body.data.id).toBe(studentUserId)
    })
  })
})
