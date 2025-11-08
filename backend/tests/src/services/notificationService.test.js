/**
 * @fileoverview Unit tests for notification service
 * @module tests/services/notificationService.test
 */

// Set environment variable before requiring modules
process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'testsecret'

const prisma = require('../../../src/models/prisma')
const notificationService = require('../../../src/services/notificationService')
const emailUtils = require('../../../src/utils/emailUtils')
const { TEST_DEGREE_TYPES, cleanupDatabase } = require('../utils/testHelpers')

// Mock email sending
jest.mock('../../../src/utils/emailUtils', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}))

jest.setTimeout(30000)

describe('NotificationService', () => {
  let employer, student, job, hrProfile, degreeType

  beforeAll(async () => {
    await cleanupDatabase(prisma, { logSuccess: false })

    // Create degree type
    degreeType = await prisma.degreeType.create({
      data: { name: TEST_DEGREE_TYPES.BACHELOR }
    })

    // Create employer with HR profile
    employer = await prisma.user.create({
      data: {
        name: 'Employer',
        surname: 'Service',
        email: 'employer-service@test.com',
        password: 'Pass',
        role: 'EMPLOYER',
        status: 'APPROVED',
        hr: {
          create: {
            companyName: 'ServiceTestCorp',
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

    // Create student
    student = await prisma.user.create({
      data: {
        name: 'Student',
        surname: 'Service',
        email: 'student-service@test.com',
        password: 'Pass',
        role: 'STUDENT',
        status: 'APPROVED',
        student: {
          create: {
            degreeTypeId: degreeType.id,
            address: 'Bangkok'
          }
        }
      }
    })

    // Create job
    job = await prisma.job.create({
      data: {
        hrId: hrProfile.id,
        title: 'Backend Developer',
        companyName: 'ServiceTestCorp',
        description: 'Test job for service tests',
        location: 'Bangkok',
        jobType: 'full-time',
        workArrangement: 'remote',
        duration: '1-year',
        minSalary: 40000,
        maxSalary: 60000,
        application_deadline: new Date('2030-12-31'),
        phone_number: '02-111-2222'
      }
    })
  })

  afterAll(async () => {
    await cleanupDatabase(prisma, { logSuccess: false })
    await prisma.$disconnect()
  })

  beforeEach(() => {
    emailUtils.sendEmail.mockClear()
  })

  describe('notifyEmployerOfApplication', () => {
    it('should create notification and send email to employer', async () => {
      const result = await notificationService.notifyEmployerOfApplication({
        studentUserId: student.id,
        jobId: job.id
      })

      expect(result).toBeDefined()
      expect(result.recipientId).toBe(employer.id)
      expect(result.senderId).toBe(student.id)
      expect(result.type).toBe('EMPLOYER_APPLICATION')
      expect(result.title).toBe('New Job Application')
      expect(result.message).toContain('Student Service')
      expect(result.message).toContain('Backend Developer')

      // Verify email was sent
      expect(emailUtils.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: employer.email,
          subject: 'New Job Application'
        })
      )

      // Verify in database
      const notification = await prisma.userNotification.findUnique({
        where: { id: result.id }
      })
      expect(notification).toBeDefined()
      expect(notification.read).toBe(false)
    })

    it('should throw error for non-existent job', async () => {
      await expect(
        notificationService.notifyEmployerOfApplication({
          studentUserId: student.id,
          jobId: 'non-existent-job-id'
        })
      ).rejects.toThrow('Job not found')
    })

    it('should throw error for non-existent student', async () => {
      await expect(
        notificationService.notifyEmployerOfApplication({
          studentUserId: 'non-existent-user-id',
          jobId: job.id
        })
      ).rejects.toThrow('Student not found')
    })
  })

  describe('notifyStudentOfApproval', () => {
    it('should create notification for QUALIFIED status', async () => {
      const result = await notificationService.notifyStudentOfApproval({
        employerUserId: employer.id,
        studentUserId: student.id,
        jobId: job.id,
        status: 'QUALIFIED'
      })

      expect(result).toBeDefined()
      expect(result.recipientId).toBe(student.id)
      expect(result.senderId).toBe(employer.id)
      expect(result.type).toBe('APPLICATION_STATUS')
      expect(result.title).toBe('Application Update')
      expect(result.message).toContain('qualified')
      expect(result.message).toContain('Backend Developer')

      // Verify email was sent
      expect(emailUtils.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: student.email,
          subject: 'Application Update'
        })
      )
    })

    it('should create notification for REJECTED status', async () => {
      const result = await notificationService.notifyStudentOfApproval({
        employerUserId: employer.id,
        studentUserId: student.id,
        jobId: job.id,
        status: 'REJECTED'
      })

      expect(result.message).toContain('rejected')
    })

    it('should include applicationId if provided', async () => {
      const result = await notificationService.notifyStudentOfApproval({
        employerUserId: employer.id,
        studentUserId: student.id,
        jobId: job.id,
        status: 'QUALIFIED',
        applicationId: 'test-app-id'
      })

      expect(result.applicationId).toBe('test-app-id')
    })

    it('should throw error for non-existent job', async () => {
      await expect(
        notificationService.notifyStudentOfApproval({
          employerUserId: employer.id,
          studentUserId: student.id,
          jobId: 'non-existent-job-id',
          status: 'QUALIFIED'
        })
      ).rejects.toThrow('Job not found')
    })

    it('should throw error for non-existent student', async () => {
      await expect(
        notificationService.notifyStudentOfApproval({
          employerUserId: employer.id,
          studentUserId: 'non-existent-user-id',
          jobId: job.id,
          status: 'QUALIFIED'
        })
      ).rejects.toThrow('Student not found')
    })
  })

  describe('getNotificationsForUser', () => {
    beforeAll(async () => {
      // Create some notifications
      await prisma.userNotification.createMany({
        data: [
          {
            recipientId: student.id,
            senderId: employer.id,
            type: 'APPLICATION_STATUS',
            title: 'Test 1',
            message: 'Message 1'
          },
          {
            recipientId: student.id,
            senderId: employer.id,
            type: 'APPLICATION_STATUS',
            title: 'Test 2',
            message: 'Message 2'
          },
          {
            recipientId: student.id,
            senderId: employer.id,
            type: 'APPLICATION_STATUS',
            title: 'Test 3',
            message: 'Message 3'
          }
        ]
      })
    })

    it('should return paginated notifications', async () => {
      const result = await notificationService.getNotificationsForUser(student.id, {
        page: 1,
        limit: 2
      })

      expect(result.notifications).toBeInstanceOf(Array)
      expect(result.notifications.length).toBe(2)
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(2)
      expect(result.pagination.total).toBeGreaterThanOrEqual(3)
    })

    it('should order by createdAt desc', async () => {
      const result = await notificationService.getNotificationsForUser(student.id)

      const dates = result.notifications.map(n => new Date(n.createdAt).getTime())
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1])
      }
    })

    it('should include sender information', async () => {
      const result = await notificationService.getNotificationsForUser(student.id)

      expect(result.notifications[0].sender).toBeDefined()
      expect(result.notifications[0].sender.name).toBe('Employer')
    })
  })

  describe('markAsRead', () => {
    let testNotification

    beforeEach(async () => {
      testNotification = await prisma.userNotification.create({
        data: {
          recipientId: student.id,
          senderId: employer.id,
          type: 'APPLICATION_STATUS',
          title: 'Test Mark Read',
          message: 'Test message',
          read: false
        }
      })
    })

    it('should mark notification as read', async () => {
      const result = await notificationService.markAsRead({
        id: testNotification.id,
        userId: student.id
      })

      expect(result).toBeDefined()
      expect(result.read).toBe(true)

      // Verify in database
      const updated = await prisma.userNotification.findUnique({
        where: { id: testNotification.id }
      })
      expect(updated.read).toBe(true)
    })

    it('should return null if user is not recipient', async () => {
      const result = await notificationService.markAsRead({
        id: testNotification.id,
        userId: employer.id
      })

      expect(result).toBeNull()

      // Verify not updated in database
      const unchanged = await prisma.userNotification.findUnique({
        where: { id: testNotification.id }
      })
      expect(unchanged.read).toBe(false)
    })

    it('should return null for non-existent notification', async () => {
      const result = await notificationService.markAsRead({
        id: 'non-existent-id',
        userId: student.id
      })

      expect(result).toBeNull()
    })
  })

  describe('getUnreadCount', () => {
    beforeAll(async () => {
      // Create mix of read and unread notifications
      await prisma.userNotification.createMany({
        data: [
          {
            recipientId: employer.id,
            senderId: student.id,
            type: 'EMPLOYER_APPLICATION',
            title: 'Unread 1',
            message: 'Message 1',
            read: false
          },
          {
            recipientId: employer.id,
            senderId: student.id,
            type: 'EMPLOYER_APPLICATION',
            title: 'Unread 2',
            message: 'Message 2',
            read: false
          },
          {
            recipientId: employer.id,
            senderId: student.id,
            type: 'EMPLOYER_APPLICATION',
            title: 'Read',
            message: 'Message 3',
            read: true
          }
        ]
      })
    })

    it('should return correct unread count', async () => {
      const count = await notificationService.getUnreadCount(employer.id)
      expect(count).toBe(2)
    })

    it('should return 0 for user with no unread notifications', async () => {
      const count = await notificationService.getUnreadCount('non-existent-user')
      expect(count).toBe(0)
    })
  })

  describe('Email handling', () => {
    it('should continue if email fails', async () => {
      // Mock email failure
      emailUtils.sendEmail.mockRejectedValueOnce(new Error('Email service down'))

      const result = await notificationService.notifyEmployerOfApplication({
        studentUserId: student.id,
        jobId: job.id
      })

      // Notification should still be created
      expect(result).toBeDefined()
      expect(result.recipientId).toBe(employer.id)
    })
  })
})
