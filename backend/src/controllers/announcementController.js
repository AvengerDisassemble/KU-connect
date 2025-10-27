/**
 * @file src/controllers/announcementController.js
 * @description Controller for announcement operations
 */

const announcementService = require('../services/announcementService')
const { asyncErrorHandler } = require('../middlewares/errorHandler')

/**
 * Create a new announcement
 * POST /api/admin/announcements
 * @access Admin only
 */
const createAnnouncementHandler = asyncErrorHandler(async (req, res) => {
  const { title, content, audience, priority, expiresAt } = req.body

  const announcementData = {
    title,
    content,
    audience,
    priority: priority || 'MEDIUM',
    createdBy: req.user.id,
    expiresAt: expiresAt ? new Date(expiresAt) : null
  }

  const announcement = await announcementService.createAnnouncement(announcementData)

  res.status(201).json({
    success: true,
    message: 'Announcement created successfully',
    data: announcement
  })
})

/**
 * Get all announcements
 * GET /api/admin/announcements
 * @access Public (filtered by user role)
 */
const getAnnouncementsHandler = asyncErrorHandler(async (req, res) => {
  const { audience, isActive } = req.query

  const filters = {
    userRole: req.user ? req.user.role : null
  }

  if (audience) filters.audience = audience
  if (isActive !== undefined) filters.isActive = isActive === 'true'

  const announcements = await announcementService.getAllAnnouncements(filters)

  res.json({
    success: true,
    message: 'Announcements retrieved successfully',
    data: announcements
  })
})

/**
 * Get a single announcement by ID
 * GET /api/admin/announcements/:id
 * @access Public
 */
const getAnnouncementByIdHandler = asyncErrorHandler(async (req, res) => {
  const { id } = req.params

  const announcement = await announcementService.getAnnouncementById(id)

  res.json({
    success: true,
    message: 'Announcement retrieved successfully',
    data: announcement
  })
})

/**
 * Update an announcement
 * PATCH /api/admin/announcements/:id
 * @access Admin only
 */
const updateAnnouncementHandler = asyncErrorHandler(async (req, res) => {
  const { id } = req.params
  const { title, content, audience, priority, isActive, expiresAt } = req.body

  const updateData = {}
  if (title !== undefined) updateData.title = title
  if (content !== undefined) updateData.content = content
  if (audience !== undefined) updateData.audience = audience
  if (priority !== undefined) updateData.priority = priority
  if (isActive !== undefined) updateData.isActive = isActive
  if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null

  const announcement = await announcementService.updateAnnouncement(id, updateData)

  res.json({
    success: true,
    message: 'Announcement updated successfully',
    data: announcement
  })
})

/**
 * Delete an announcement (soft delete)
 * DELETE /api/admin/announcements/:id
 * @access Admin only
 */
const deleteAnnouncementHandler = asyncErrorHandler(async (req, res) => {
  const { id } = req.params

  await announcementService.deleteAnnouncement(id)

  res.json({
    success: true,
    message: 'Announcement deleted successfully',
    data: null
  })
})

/**
 * Get user notifications
 * GET /api/notifications
 * @access Authenticated users
 */
const getUserNotificationsHandler = asyncErrorHandler(async (req, res) => {
  const { unreadOnly } = req.query

  const notifications = await announcementService.getUserNotifications(
    req.user.id,
    unreadOnly === 'true'
  )

  res.json({
    success: true,
    message: 'Notifications retrieved successfully',
    data: notifications
  })
})

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 * @access Authenticated users
 */
const markNotificationReadHandler = asyncErrorHandler(async (req, res) => {
  const { id } = req.params

  const notification = await announcementService.markNotificationAsRead(id)

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  })
})

module.exports = {
  createAnnouncementHandler,
  getAnnouncementsHandler,
  getAnnouncementByIdHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
  getUserNotificationsHandler,
  markNotificationReadHandler
}

