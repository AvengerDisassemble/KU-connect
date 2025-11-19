/**
 * @module services/notificationService
 * @description Unified service for all notification types (announcements, applications, system messages)
 */

const prisma = require('../models/prisma')

/**
 * Create a notification in the database
 * @param {Object} data - Notification data
 * @param {string} data.userId - Recipient user ID
 * @param {string} data.type - Notification type (ANNOUNCEMENT, APPLICATION_STATUS, EMPLOYER_APPLICATION)
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} [data.priority] - Priority level (LOW, MEDIUM, HIGH)
 * @param {string} [data.senderId] - Sender user ID (for user-to-user notifications)
 * @param {string} [data.announcementId] - Related announcement ID
 * @param {string} [data.jobId] - Related job ID
 * @param {string} [data.applicationId] - Related application ID
 * @returns {Promise<Object>} Created notification
 */
async function createNotification(data) {
  return await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      priority: data.priority || 'MEDIUM',
      senderId: data.senderId || null,
      announcementId: data.announcementId || null,
      jobId: data.jobId || null,
      applicationId: data.applicationId || null
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true,
          role: true
        }
      },
      announcement: {
        select: {
          id: true,
          title: true,
          content: true,
          priority: true,
          audience: true
        }
      }
    }
  })
}

/**
 * Create announcement notifications for all users in target audience
 * @param {string} announcementId - Announcement ID
 * @param {Object} announcement - Announcement data
 * @param {string} announcement.title - Announcement title
 * @param {string} announcement.content - Announcement content
 * @param {string} announcement.audience - Target audience (ALL, STUDENTS, EMPLOYERS, PROFESSORS, ADMINS)
 * @param {string} announcement.priority - Priority level
 * @returns {Promise<number>} Number of notifications created
 */
async function createAnnouncementNotifications(announcementId, announcement) {
  let targetUsers = []

  if (announcement.audience === 'ALL') {
    // Get all approved users
    targetUsers = await prisma.user.findMany({
      where: { status: 'APPROVED' },
      select: { id: true }
    })
  } else {
    // Map audience to role
    const roleMapping = {
      STUDENTS: 'STUDENT',
      EMPLOYERS: 'EMPLOYER',
      PROFESSORS: 'PROFESSOR',
      ADMINS: 'ADMIN'
    }

    const targetRole = roleMapping[announcement.audience]
    if (targetRole) {
      targetUsers = await prisma.user.findMany({
        where: {
          role: targetRole,
          status: 'APPROVED'
        },
        select: { id: true }
      })
    }
  }

  // Create notifications in bulk
  if (targetUsers.length > 0) {
    await prisma.notification.createMany({
      data: targetUsers.map(user => ({
        userId: user.id,
        type: 'ANNOUNCEMENT',
        title: announcement.title,
        message: announcement.content,
        priority: announcement.priority || 'MEDIUM',
        announcementId
      }))
    })
  }

  return targetUsers.length
}

/**
 * Notify employer when a student applies to their job
 * @param {Object} params
 * @param {string} params.studentUserId - User ID of the applying student
 * @param {string} params.jobId - Job ID being applied to
 * @param {string} [params.applicationId] - Application ID
 * @returns {Promise<Object>} Created notification
 * @throws {Error} If job or employer not found
 */
async function notifyEmployerOfApplication({ studentUserId, jobId, applicationId }) {
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

  // Create notification
  return await createNotification({
    userId: employerUserId,
    senderId: studentUserId,
    type: 'EMPLOYER_APPLICATION',
    title: 'New Job Application',
    message: `${student.name} ${student.surname} has applied for your job post "${job.title}".`,
    priority: 'HIGH',
    jobId,
    applicationId: applicationId || null
  })
}

/**
 * Notify student when employer updates their application status
 * @param {Object} params
 * @param {string} params.employerUserId - User ID of the employer
 * @param {string} params.studentUserId - User ID of the student
 * @param {string} params.jobId - Job ID
 * @param {string} params.status - Application status (QUALIFIED or REJECTED)
 * @param {string} [params.applicationId] - Application ID
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
  const priority = status === 'QUALIFIED' ? 'HIGH' : 'MEDIUM'

  return await createNotification({
    userId: studentUserId,
    senderId: employerUserId,
    type: 'APPLICATION_STATUS',
    title: 'Application Update',
    message: `Your job application for "${job.title}" has been ${statusText}.`,
    priority,
    jobId,
    applicationId: applicationId || null
  })
}

/**
 * Get notifications for a user with filtering and pagination
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {string} [options.type] - Filter by notification type
 * @param {boolean} [options.unreadOnly] - Get only unread notifications
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Results per page
 * @returns {Promise<Object>} Paginated notifications with metadata
 */
async function getNotifications(userId, { type, unreadOnly, page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit

  const where = { userId }

  if (type) {
    where.type = type
  }

  if (unreadOnly) {
    where.isRead = false
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
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
        },
        announcement: {
          select: {
            id: true,
            title: true,
            content: true,
            priority: true,
            audience: true
          }
        }
      }
    }),
    prisma.notification.count({ where })
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
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (must be recipient)
 * @returns {Promise<Object|null>} Updated notification or null if not found/unauthorized
 */
async function markAsRead(notificationId, userId) {
  // Find and verify recipient
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  })

  if (!notification || notification.userId !== userId) {
    return null
  }

  // Update read status
  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  })
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @param {string} [type] - Optional: only mark specific type as read
 * @returns {Promise<number>} Count of updated notifications
 */
async function markAllAsRead(userId, type) {
  const where = { userId, isRead: false }
  
  if (type) {
    where.type = type
  }

  const result = await prisma.notification.updateMany({
    where,
    data: { isRead: true }
  })

  return result.count
}

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @param {string} [type] - Optional: count only specific type
 * @returns {Promise<number>} Count of unread notifications
 */
async function getUnreadCount(userId, type) {
  const where = {
    userId,
    isRead: false
  }

  if (type) {
    where.type = type
  }

  return await prisma.notification.count({ where })
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (must be recipient)
 * @returns {Promise<Object|null>} Deleted notification or null if not found/unauthorized
 */
async function deleteNotification(notificationId, userId) {
  // Verify ownership
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId }
  })

  if (!notification || notification.userId !== userId) {
    return null
  }

  return await prisma.notification.delete({
    where: { id: notificationId }
  })
}

/**
 * Get notification statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Notification statistics by type
 */
async function getNotificationStats(userId) {
  const [total, unreadTotal, byType] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.groupBy({
      by: ['type'],
      where: { userId },
      _count: { type: true }
    })
  ])

  const unreadByType = await prisma.notification.groupBy({
    by: ['type'],
    where: { userId, isRead: false },
    _count: { type: true }
  })

  return {
    total,
    unread: unreadTotal,
    byType: byType.map(item => ({
      type: item.type,
      count: item._count.type,
      unread: unreadByType.find(u => u.type === item.type)?._count.type || 0
    }))
  }
}

module.exports = {
  createNotification,
  createAnnouncementNotifications,
  notifyEmployerOfApplication,
  notifyStudentOfApproval,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  getNotificationStats
}
