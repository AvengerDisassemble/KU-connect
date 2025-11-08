/**
 * @module services/notificationService
 * @description Service layer for user-to-user notifications
 */

const prisma = require('../models/prisma')
const { sendEmail } = require('../utils/emailUtils')

/**
 * Create a user notification record in the database
 * @private
 * @param {Object} data - Notification data
 * @param {string} data.recipientId - User ID of recipient
 * @param {string} [data.senderId] - User ID of sender (optional)
 * @param {string} data.type - Notification type (e.g., 'EMPLOYER_APPLICATION')
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} [data.jobId] - Related job ID (optional)
 * @param {string} [data.applicationId] - Related application ID (optional)
 * @returns {Promise<Object>} Created notification
 */
async function createUserNotification(data) {
  return await prisma.userNotification.create({
    data: {
      recipientId: data.recipientId,
      senderId: data.senderId || null,
      type: data.type,
      title: data.title,
      message: data.message,
      jobId: data.jobId || null,
      applicationId: data.applicationId || null
    },
    include: {
      recipient: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true
        }
      },
      sender: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true
        }
      }
    }
  })
}

/**
 * Send email notification to a user
 * @private
 * @param {string} toUserId - User ID to send email to
 * @param {string} subject - Email subject
 * @param {string} text - Email body text
 * @returns {Promise<boolean>} True if email sent successfully
 */
async function sendEmailNotification(toUserId, subject, text) {
  try {
    // Resolve user email
    const user = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { email: true }
    })

    if (!user) {
      console.warn(`User ${toUserId} not found for email notification`)
      return false
    }

    // Send email (don't throw on failure)
    const result = await sendEmail({
      to: user.email,
      subject,
      text
    })

    return result
  } catch (error) {
    console.error('Email notification error:', error.message)
    // Don't throw - email failure shouldn't fail the notification
    return false
  }
}

/**
 * Notify employer when a student applies to their job
 * @param {Object} params
 * @param {string} params.studentUserId - User ID of the applying student
 * @param {string} params.jobId - Job ID being applied to
 * @returns {Promise<Object>} Created notification
 * @throws {Error} If job or employer not found
 */
async function notifyEmployerOfApplication({ studentUserId, jobId }) {
  // Resolve job and employer details
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      hr: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              surname: true,
              email: true
            }
          }
        }
      }
    }
  })

  if (!job) {
    const error = new Error('Job not found')
    error.status = 404
    throw error
  }

  if (!job.hr || !job.hr.user) {
    const error = new Error('Employer not found for this job')
    error.status = 404
    throw error
  }

  // Resolve student details
  const student = await prisma.user.findUnique({
    where: { id: studentUserId },
    select: {
      id: true,
      name: true,
      surname: true
    }
  })

  if (!student) {
    const error = new Error('Student not found')
    error.status = 404
    throw error
  }

  const employerUserId = job.hr.user.id

  // Build notification content
  const title = 'New Job Application'
  const message = `${student.name} ${student.surname} has applied for your job post "${job.title}".`

  // Create notification in DB
  const notification = await createUserNotification({
    recipientId: employerUserId,
    senderId: studentUserId,
    type: 'EMPLOYER_APPLICATION',
    title,
    message,
    jobId,
    applicationId: null // Will be set if needed
  })

  // Send email notification (don't fail if email fails)
  await sendEmailNotification(employerUserId, title, message)

  return notification
}

/**
 * Notify student when employer updates their application status
 * @param {Object} params
 * @param {string} params.employerUserId - User ID of the employer
 * @param {string} params.studentUserId - User ID of the student
 * @param {string} params.jobId - Job ID
 * @param {string} params.status - Application status (QUALIFIED or REJECTED)
 * @param {string} [params.applicationId] - Application ID (optional)
 * @returns {Promise<Object>} Created notification
 * @throws {Error} If job or student not found
 */
async function notifyStudentOfApproval({ employerUserId, studentUserId, jobId, status, applicationId }) {
  // Resolve job details
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      title: true
    }
  })

  if (!job) {
    const error = new Error('Job not found')
    error.status = 404
    throw error
  }

  // Resolve student
  const student = await prisma.user.findUnique({
    where: { id: studentUserId },
    select: {
      id: true,
      email: true
    }
  })

  if (!student) {
    const error = new Error('Student not found')
    error.status = 404
    throw error
  }

  // Build notification content based on status
  const statusText = status === 'QUALIFIED' ? 'qualified' : 'rejected'
  const title = 'Application Update'
  const message = `Your job application for "${job.title}" has been ${statusText}.`

  // Create notification in DB
  const notification = await createUserNotification({
    recipientId: studentUserId,
    senderId: employerUserId,
    type: 'APPLICATION_STATUS',
    title,
    message,
    jobId,
    applicationId: applicationId || null
  })

  // Send email notification
  await sendEmailNotification(studentUserId, title, message)

  return notification
}

/**
 * Get notifications for a user with pagination
 * @param {string} userId - User ID
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Results per page
 * @returns {Promise<Object>} Paginated notifications
 */
async function getNotificationsForUser(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit

  const [notifications, total] = await Promise.all([
    prisma.userNotification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            surname: true,
            role: true
          }
        }
      }
    }),
    prisma.userNotification.count({
      where: { recipientId: userId }
    })
  ])

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

/**
 * Mark a notification as read
 * @param {Object} params
 * @param {string} params.id - Notification ID
 * @param {string} params.userId - User ID (must be recipient)
 * @returns {Promise<Object|null>} Updated notification or null if not found/unauthorized
 */
async function markAsRead({ id, userId }) {
  // Find and verify recipient
  const notification = await prisma.userNotification.findUnique({
    where: { id }
  })

  if (!notification || notification.recipientId !== userId) {
    return null
  }

  // Update read status
  return await prisma.userNotification.update({
    where: { id },
    data: { read: true }
  })
}

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of unread notifications
 */
async function getUnreadCount(userId) {
  return await prisma.userNotification.count({
    where: {
      recipientId: userId,
      read: false
    }
  })
}

module.exports = {
  notifyEmployerOfApplication,
  notifyStudentOfApproval,
  getNotificationsForUser,
  markAsRead,
  getUnreadCount,
  // Expose for testing
  createUserNotification,
  sendEmailNotification
}
