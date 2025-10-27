/**
 * @file src/services/announcementService.js
 * @description Service for managing announcements and notifications
 */

const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient()

/**
 * Create a new announcement
 * @param {Object} announcementData - Announcement data
 * @param {string} announcementData.title - Announcement title
 * @param {string} announcementData.content - Announcement content
 * @param {string} announcementData.audience - Target audience (ALL, STUDENTS, EMPLOYERS, PROFESSORS, ADMINS)
 * @param {string} announcementData.priority - Priority level (LOW, MEDIUM, HIGH)
 * @param {string} announcementData.createdBy - User ID of the creator
 * @param {Date} [announcementData.expiresAt] - Optional expiration date
 * @returns {Promise<Object>} Created announcement
 */
async function createAnnouncement (announcementData) {
  const announcement = await prisma.announcement.create({
    data: {
      title: announcementData.title,
      content: announcementData.content,
      audience: announcementData.audience,
      priority: announcementData.priority || 'MEDIUM',
      createdBy: announcementData.createdBy,
      expiresAt: announcementData.expiresAt || null
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true
        }
      }
    }
  })

  // Create notifications for targeted users based on audience
  await createNotificationsForAudience(announcement.id, announcement.audience)

  return announcement
}

/**
 * Create notifications for users based on announcement audience
 * @param {string} announcementId - Announcement ID
 * @param {string} audience - Target audience
 * @private
 */
async function createNotificationsForAudience (announcementId, audience) {
  let targetUsers = []

  if (audience === 'ALL') {
    // Get all users
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

    const targetRole = roleMapping[audience]
    targetUsers = await prisma.user.findMany({
      where: {
        role: targetRole,
        status: 'APPROVED'
      },
      select: { id: true }
    })
  }

  // Create notifications in bulk
  if (targetUsers.length > 0) {
    await prisma.notification.createMany({
      data: targetUsers.map(user => ({
        announcementId,
        userId: user.id
      }))
    })
  }
}

/**
 * Get all announcements with optional filtering
 * @param {Object} filters - Optional filters
 * @param {string} [filters.audience] - Filter by audience
 * @param {boolean} [filters.isActive] - Filter by active status
 * @param {string} [filters.userRole] - Filter announcements relevant to user role
 * @returns {Promise<Array>} List of announcements
 */
async function getAllAnnouncements (filters = {}) {
  const where = {}

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  // Filter by audience or user role
  if (filters.audience) {
    where.audience = filters.audience
  } else if (filters.userRole) {
    // Show announcements for ALL or specific role
    const audienceMapping = {
      STUDENT: 'STUDENTS',
      EMPLOYER: 'EMPLOYERS',
      PROFESSOR: 'PROFESSORS',
      ADMIN: 'ADMINS'
    }
    const userAudience = audienceMapping[filters.userRole]
    where.OR = [
      { audience: 'ALL' },
      { audience: userAudience }
    ]
  }

  // Filter out expired announcements
  const now = new Date()
  where.AND = [
    where.OR ? { OR: where.OR } : {},
    {
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } }
      ]
    }
  ]
  delete where.OR

  const announcements = await prisma.announcement.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          surname: true
        }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  return announcements
}

/**
 * Get announcement by ID
 * @param {string} announcementId - Announcement ID
 * @returns {Promise<Object>} Announcement details
 */
async function getAnnouncementById (announcementId) {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          surname: true,
          email: true
        }
      },
      notifications: {
        select: {
          id: true,
          userId: true,
          isRead: true
        }
      }
    }
  })

  if (!announcement) {
    throw new Error('Announcement not found')
  }

  return announcement
}

/**
 * Update an announcement
 * @param {string} announcementId - Announcement ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated announcement
 */
async function updateAnnouncement (announcementId, updateData) {
  const announcement = await prisma.announcement.update({
    where: { id: announcementId },
    data: updateData,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          surname: true
        }
      }
    }
  })

  return announcement
}

/**
 * Delete an announcement (soft delete by setting isActive to false)
 * @param {string} announcementId - Announcement ID
 * @returns {Promise<Object>} Deleted announcement
 */
async function deleteAnnouncement (announcementId) {
  const announcement = await prisma.announcement.delete({
    where: { id: announcementId }
  })

  return announcement
}

/**
 * Get user notifications
 * @param {string} userId - User ID
 * @param {boolean} unreadOnly - Get only unread notifications
 * @returns {Promise<Array>} List of notifications
 */
async function getUserNotifications (userId, unreadOnly = false) {
  const where = { userId }

  if (unreadOnly) {
    where.isRead = false
  }

  const notifications = await prisma.notification.findMany({
    where,
    include: {
      announcement: {
        select: {
          id: true,
          title: true,
          content: true,
          priority: true,
          createdAt: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return notifications
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Updated notification
 */
async function markNotificationAsRead (notificationId) {
  const notification = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  })

  return notification
}

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  getUserNotifications,
  markNotificationAsRead
}

