/**
 * @fileoverview Integration tests for Notification routes
 * @module tests/routes/notifications/index.test
 */

// Set environment variable before requiring modules
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'testsecret'

const request = require('supertest')
const prisma = require('../../../../src/models/prisma')
const app = require('../../../../src/app')
const { createTestToken, TEST_DEGREE_TYPES, cleanupDatabase } = require('../../utils/testHelpers')
const emailUtils = require('../../../../src/utils/emailUtils')

// Mock email sending to avoid network calls
jest.mock('../../../../src/utils/emailUtils', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}))

jest.setTimeout(30000)

describe('Notification Routes (Integration)', () => {
  let admin, employer, student1, student2
  let adminToken, employerToken, student1Token, student2Token
  let degreeType, hrProfile, job
  let notification1, notification2

  beforeAll(async () => {
    // Clean up test data
    await cleanupDatabase(prisma, { logSuccess: false })

    // Create degree type
    degreeType = await prisma.degreeType.create({
      data: { name: TEST_DEGREE_TYPES.BACHELOR }
    })

    // Create admin user
    admin = await prisma.user.create({
      data: {
        name: 'Admin',
        surname: 'User',
        email: 'admin-notif@test.com',
        password: 'Pass',
        role: 'ADMIN',
        status: 'APPROVED',
        verified: true,
        admin: {
          create: {}
        }
      }
    })

    // Create employer user with HR profile
    employer = await prisma.user.create({
      data: {
        name: 'Employer',
        surname: 'User',
        email: 'employer-notif@test.com',
        password: 'Pass',
        role: 'EMPLOYER',
        status: 'APPROVED',
        verified: true,
        hr: {
          create: {
            companyName: 'TestCorp',
            address: 'Bangkok',
            industry: 'IT_SOFTWARE',
            companySize: 'ELEVEN_TO_FIFTY',
            phoneNumber: '02-111-2222'
          }
        }
      },
      include: { hr: true }
    })

    hrProfile = employer.hr

    // Create student users
    student1 = await prisma.user.create({
      data: {
        name: 'Student1',
        surname: 'User',
        email: 'student1-notif@test.com',
        password: 'Pass',
        role: 'STUDENT',
        status: 'APPROVED',
        verified: true,
        student: {
          create: {
            degreeTypeId: degreeType.id,
            address: 'Bangkok'
          }
        }
      },
      include: { student: true }
    })

    student2 = await prisma.user.create({
      data: {
        name: 'Student2',
        surname: 'User',
        email: 'student2-notif@test.com',
        password: 'Pass',
        role: 'STUDENT',
        status: 'APPROVED',
        verified: true,
        student: {
          create: {
            degreeTypeId: degreeType.id,
            address: 'Bangkok'
          }
        }
      },
      include: { student: true }
    })

    // Create tokens
    adminToken = createTestToken({ id: admin.id, role: 'ADMIN' })
    employerToken = createTestToken({ id: employer.id, role: 'EMPLOYER' })
    student1Token = createTestToken({ id: student1.id, role: 'STUDENT' })
    student2Token = createTestToken({ id: student2.id, role: 'STUDENT' })

    // Create a job for testing
    job = await prisma.job.create({
      data: {
        hrId: hrProfile.id,
        title: 'Software Engineer',
        companyName: 'TestCorp',
        description: 'Test job description',
        location: 'Bangkok',
        jobType: 'full-time',
        workArrangement: 'hybrid',
        duration: '1-year',
        minSalary: 30000,
        maxSalary: 50000,
        application_deadline: new Date('2030-12-31'),
        phone_number: '02-111-2222'
      }
    })

    // Create some notifications for student1
    notification1 = await prisma.userNotification.create({
      data: {
        recipientId: student1.id,
        senderId: employer.id,
        type: 'APPLICATION_STATUS',
        title: 'Application Update',
        message: 'Your application has been qualified.',
        jobId: job.id,
        read: false
      }
    })

    notification2 = await prisma.userNotification.create({
      data: {
        recipientId: student1.id,
        senderId: employer.id,
        type: 'APPLICATION_STATUS',
        title: 'Another Update',
        message: 'Another message.',
        jobId: job.id,
        read: true
      }
    })
  })

  afterAll(async () => {
    await cleanupDatabase(prisma, { logSuccess: false })
    await prisma.$disconnect()
  })

  beforeEach(() => {
    // Clear mock calls before each test
    emailUtils.sendEmail.mockClear()
  })

  describe('GET /api/notifications', () => {
    it('should return notifications for authenticated user', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', student1Token)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.notifications).toBeInstanceOf(Array)
      expect(res.body.data.notifications.length).toBe(2)
      expect(res.body.data.pagination).toBeDefined()
      expect(res.body.data.pagination.total).toBe(2)
    })

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/notifications?page=1&limit=1')
        .set('Authorization', student1Token)
        .expect(200)

      expect(res.body.data.notifications.length).toBe(1)
      expect(res.body.data.pagination.limit).toBe(1)
      expect(res.body.data.pagination.totalPages).toBe(2)
    })

    it('should return empty array for user with no notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', student2Token)
        .expect(200)

      expect(res.body.data.notifications).toEqual([])
      expect(res.body.data.pagination.total).toBe(0)
    })

    it('should require authentication', async () => {
      await request(app)
        .get('/api/notifications')
        .expect(401)
    })

    it('should require verified user', async () => {
      // Create unverified user
      const unverifiedUser = await prisma.user.create({
        data: {
          name: 'Unverified',
          surname: 'User',
          email: 'unverified-notif@test.com',
          password: 'Pass',
          role: 'STUDENT',
          status: 'APPROVED',
          verified: false,
          student: {
            create: {
              degreeTypeId: degreeType.id,
              address: 'Bangkok'
            }
          }
        }
      })

      const unverifiedToken = createTestToken({ id: unverifiedUser.id, role: 'STUDENT' })

      await request(app)
        .get('/api/notifications')
        .set('Authorization', unverifiedToken)
        .expect(403)
    })
  })

  describe('GET /api/notifications/unread/count', () => {
    it('should return unread count for authenticated user', async () => {
      const res = await request(app)
        .get('/api/notifications/unread/count')
        .set('Authorization', student1Token)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.count).toBe(1) // Only notification1 is unread
    })

    it('should return 0 for user with no unread notifications', async () => {
      const res = await request(app)
        .get('/api/notifications/unread/count')
        .set('Authorization', student2Token)
        .expect(200)

      expect(res.body.data.count).toBe(0)
    })
  })

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notification1.id}/read`)
        .set('Authorization', student1Token)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.read).toBe(true)

      // Verify in database
      const updated = await prisma.userNotification.findUnique({
        where: { id: notification1.id }
      })
      expect(updated.read).toBe(true)
    })

    it('should not allow marking others notifications as read', async () => {
      await request(app)
        .patch(`/api/notifications/${notification1.id}/read`)
        .set('Authorization', student2Token)
        .expect(404)
    })

    it('should return 404 for non-existent notification', async () => {
      await request(app)
        .patch('/api/notifications/non-existent-id/read')
        .set('Authorization', student1Token)
        .expect(404)
    })
  })

  describe('POST /api/notifications/employer/application', () => {
    it('should create employer notification (admin only)', async () => {
      const res = await request(app)
        .post('/api/notifications/employer/application')
        .set('Authorization', adminToken)
        .send({
          studentUserId: student1.id,
          jobId: job.id
        })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.recipientId).toBe(employer.id)
      expect(res.body.data.type).toBe('EMPLOYER_APPLICATION')
      expect(res.body.message).toContain('created successfully')

      // Verify email was sent
      expect(emailUtils.sendEmail).toHaveBeenCalled()
      expect(emailUtils.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: employer.email
        })
      )
    })

    it('should reject non-admin users', async () => {
      await request(app)
        .post('/api/notifications/employer/application')
        .set('Authorization', employerToken)
        .send({
          studentUserId: student1.id,
          jobId: job.id
        })
        .expect(403)
    })

    it('should validate required fields', async () => {
      await request(app)
        .post('/api/notifications/employer/application')
        .set('Authorization', adminToken)
        .send({
          studentUserId: student1.id
          // Missing jobId
        })
        .expect(400)
    })

    it('should return 404 for non-existent job', async () => {
      await request(app)
        .post('/api/notifications/employer/application')
        .set('Authorization', adminToken)
        .send({
          studentUserId: student1.id,
          jobId: 'non-existent-job-id'
        })
        .expect(404)
    })
  })

  describe('POST /api/notifications/student/approval', () => {
    it('should create student notification (admin only)', async () => {
      const res = await request(app)
        .post('/api/notifications/student/approval')
        .set('Authorization', adminToken)
        .send({
          employerUserId: employer.id,
          studentUserId: student1.id,
          jobId: job.id,
          status: 'QUALIFIED'
        })
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.recipientId).toBe(student1.id)
      expect(res.body.data.type).toBe('APPLICATION_STATUS')
      expect(res.body.data.message).toContain('qualified')

      // Verify email was sent
      expect(emailUtils.sendEmail).toHaveBeenCalled()
      expect(emailUtils.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: student1.email
        })
      )
    })

    it('should handle REJECTED status', async () => {
      const res = await request(app)
        .post('/api/notifications/student/approval')
        .set('Authorization', adminToken)
        .send({
          employerUserId: employer.id,
          studentUserId: student1.id,
          jobId: job.id,
          status: 'REJECTED'
        })
        .expect(201)

      expect(res.body.data.message).toContain('rejected')
    })

    it('should reject invalid status', async () => {
      await request(app)
        .post('/api/notifications/student/approval')
        .set('Authorization', adminToken)
        .send({
          employerUserId: employer.id,
          studentUserId: student1.id,
          jobId: job.id,
          status: 'INVALID_STATUS'
        })
        .expect(400)
    })

    it('should reject non-admin users', async () => {
      await request(app)
        .post('/api/notifications/student/approval')
        .set('Authorization', studentToken)
        .send({
          employerUserId: employer.id,
          studentUserId: student1.id,
          jobId: job.id,
          status: 'QUALIFIED'
        })
        .expect(403)
    })
  })
})
