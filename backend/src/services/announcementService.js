/**
 * @file src/services/announcementService.js
 * @description Service for managing announcements and notifications
 */

const prisma = require('../models/prisma')
const notificationService = require('./notificationService')

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

  // Create notifications for targeted users using unified notification service
  await notificationService.createAnnouncementNotifications(announcement.id, {
    title: announcement.title,
    content: announcement.content,
    audience: announcement.audience,
    priority: announcement.priority
  })

  return announcement
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
 * Search announcements with comprehensive filters and pagination (Admin use)
 * @param {Object} filters - Search filters
 * @returns {Promise<Object>} Announcements with pagination metadata
 */
async function searchAnnouncements (filters = {}) {
  const {
    audience,
    isActive,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 20
  } = filters

  const where = {}

  // Filter by audience
  if (audience) {
    where.audience = audience
  }

  // Filter by active status
  if (typeof isActive === 'boolean') {
    where.isActive = isActive
  }

  // Search in title or content
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } }
    ]
  }

  // Filter by date range
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate)
  }

  const skip = (page - 1) * limit

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
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
      ],
      skip,
      take: limit
    }),
    prisma.announcement.count({ where })
  ])

  return {
    announcements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

/**
 * Get announcements visible to user based on their role (Public use)
 * @param {string|null} userRole - User's role (null if not logged in)
 * @returns {Promise<Array>} Filtered announcements
 */
async function getAnnouncementsForRole (userRole) {
  const where = { isActive: true }

  if (userRole) {
    // Logged in user: show ALL + role-specific
    where.OR = [
      { audience: 'ALL' },
      { audience: userRole + 'S' } // STUDENT -> STUDENTS, etc.
    ]
  } else {
    // Not logged in: show only ALL audience
    where.audience = 'ALL'
  }

  return prisma.announcement.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true,
      audience: true,
      priority: true,
      createdAt: true,
      expiresAt: true
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  })
}

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  searchAnnouncements,
  getAnnouncementsForRole
}

