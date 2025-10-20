/**
 * @module tests/controllers/documentsController.test
 * @description Test documents controller with role-based access and file validation
 */

const request = require('supertest')
const app = require('../../src/app')
const prisma = require('../../src/models/prisma')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs-extra')

// Mock storage provider to avoid actual file operations
jest.mock('../../src/services/storageFactory', () => ({
  uploadFile: jest.fn().mockResolvedValue('mock-file-key-12345'),
  getFileUrl: jest.fn().mockResolvedValue('https://mock-url.com/file'),
  deleteFile: jest.fn().mockResolvedValue(undefined)
}))

describe('Documents Controller', () => {
  let studentToken, hrToken, adminToken
  let studentUserId, hrUserId, adminUserId

  beforeAll(async () => {
    // Create test users
    const studentUser = await prisma.user.create({
      data: {
        name: 'Test',
        surname: 'Student',
        email: 'student@test.com',
        username: 'teststudent',
        password: 'hashedpass',
        role: 'STUDENT',
        verified: true
      }
    })
    studentUserId = studentUser.id

    // Create student profile
    const degreeType = await prisma.degreeType.findFirst()
    if (degreeType) {
      await prisma.student.create({
        data: {
          userId: studentUserId,
          degreeTypeId: degreeType.id,
          address: '123 Test St'
        }
      })
    }

    const hrUser = await prisma.user.create({
      data: {
        name: 'Test',
        surname: 'HR',
        email: 'hr@test.com',
        username: 'testhr',
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
        companyName: 'Test Company',
        address: '456 Business Ave'
      }
    })

    const adminUser = await prisma.user.create({
      data: {
        name: 'Test',
        surname: 'Admin',
        email: 'admin@test.com',
        username: 'testadmin',
        password: 'hashedpass',
        role: 'ADMIN',
        verified: true
      }
    })
    adminUserId = adminUser.id

    await prisma.admin.create({
      data: { userId: adminUserId }
    })

    // Generate tokens
    studentToken = jwt.sign({ id: studentUserId, role: 'STUDENT' }, process.env.JWT_SECRET || 'test-secret')
    hrToken = jwt.sign({ id: hrUserId, role: 'EMPLOYER' }, process.env.JWT_SECRET || 'test-secret')
    adminToken = jwt.sign({ id: adminUserId, role: 'ADMIN' }, process.env.JWT_SECRET || 'test-secret')
  })

  afterAll(async () => {
    // Cleanup test data
    await prisma.student.deleteMany({ where: { userId: studentUserId } })
    await prisma.hR.deleteMany({ where: { userId: hrUserId } })
    await prisma.admin.deleteMany({ where: { userId: adminUserId } })
    await prisma.user.deleteMany({
      where: {
        id: { in: [studentUserId, hrUserId, adminUserId] }
      }
    })
    await prisma.$disconnect()
  })

  describe('POST /api/documents/resume', () => {
    test('should upload resume for student', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content')

      const response = await request(app)
        .post('/api/documents/resume')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('resume', pdfBuffer, 'resume.pdf')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.fileKey).toBe('mock-file-key-12345')
    })

    test('should reject non-student users', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content')

      const response = await request(app)
        .post('/api/documents/resume')
        .set('Authorization', `Bearer ${hrToken}`)
        .attach('resume', pdfBuffer, 'resume.pdf')

      expect(response.status).toBe(403)
    })

    test('should reject non-PDF files', async () => {
      const txtBuffer = Buffer.from('plain text')

      const response = await request(app)
        .post('/api/documents/resume')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('resume', txtBuffer, 'resume.txt')

      expect(response.status).toBe(500) // Multer error
    })
  })

  describe('GET /api/documents/resume/:userId', () => {
    beforeAll(async () => {
      // Set a resume key for student
      await prisma.student.update({
        where: { userId: studentUserId },
        data: { resumeKey: 'resumes/test-resume.pdf' }
      })
    })

    test('should allow student to get own resume URL', async () => {
      const response = await request(app)
        .get(`/api/documents/resume/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.url).toBe('https://mock-url.com/file')
    })

    test('should allow admin to get any student resume URL', async () => {
      const response = await request(app)
        .get(`/api/documents/resume/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    test('should deny access to other users', async () => {
      const response = await request(app)
        .get(`/api/documents/resume/${studentUserId}`)
        .set('Authorization', `Bearer ${hrToken}`)

      expect(response.status).toBe(403)
    })
  })

  describe('POST /api/documents/transcript', () => {
    test('should upload transcript for student', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake transcript')

      const response = await request(app)
        .post('/api/documents/transcript')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('transcript', pdfBuffer, 'transcript.pdf')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })
  })

  describe('POST /api/documents/employer-verification', () => {
    test('should upload verification doc for HR', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake verification doc')

      const response = await request(app)
        .post('/api/documents/employer-verification')
        .set('Authorization', `Bearer ${hrToken}`)
        .attach('verification', pdfBuffer, 'verification.pdf')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
    })

    test('should reject non-HR users', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake doc')

      const response = await request(app)
        .post('/api/documents/employer-verification')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('verification', pdfBuffer, 'verification.pdf')

      expect(response.status).toBe(403)
    })

    test('should accept JPEG files', async () => {
      const jpegBuffer = Buffer.from('fake jpeg data')

      const response = await request(app)
        .post('/api/documents/employer-verification')
        .set('Authorization', `Bearer ${hrToken}`)
        .attach('verification', jpegBuffer, {
          filename: 'verification.jpg',
          contentType: 'image/jpeg'
        })

      expect(response.status).toBe(200)
    })
  })
})

