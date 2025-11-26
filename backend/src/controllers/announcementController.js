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

  req.log?.('info', 'announcement.create', {
    userId: req.user?.id,
    audience,
    priority: announcement.priority,
    id: announcement.id,
    ip: req.ip
  })

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

  req.log?.('info', 'announcement.list', {
    userId: req.user?.id,
    audience: filters.audience,
    isActive: filters.isActive,
    count: announcements.length,
    ip: req.ip
  })

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

  req.log?.('info', 'announcement.detail', {
    userId: req.user?.id,
    id,
    ip: req.ip
  })

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

  req.log?.('info', 'announcement.update', {
    userId: req.user?.id,
    id,
    fields: Object.keys(updateData),
    ip: req.ip
  })

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

  req.log?.('info', 'announcement.delete', {
    userId: req.user?.id,
    id,
    ip: req.ip
  })

  res.json({
    success: true,
    message: 'Announcement deleted successfully',
    data: null
  })
})

/**
 * Search announcements with comprehensive filters (Admin use)
 * POST /api/admin/announcements/search
 * @access Admin only
 */
const searchAnnouncementsHandler = asyncErrorHandler(async (req, res) => {
  const result = await announcementService.searchAnnouncements(req.body)

  req.log?.('info', 'announcement.search', {
    userId: req.user?.id,
    filters: Object.keys(req.body || {}).length,
    count: result.length,
    ip: req.ip
  })

  res.json({
    success: true,
    message: 'Announcements retrieved successfully',
    data: result
  })
})

/**
 * Get announcements for current user (Public use)
 * GET /api/announcements
 * @access Public (works with/without auth)
 */
const getAnnouncementsForUserHandler = asyncErrorHandler(async (req, res) => {
  const userRole = req.user?.role || null

  const announcements = await announcementService.getAnnouncementsForRole(userRole)

  req.log?.('info', 'announcement.list.for_user', {
    userId: req.user?.id,
    role: userRole,
    count: announcements.length,
    ip: req.ip
  })

  res.json({
    success: true,
    message: 'Announcements retrieved successfully',
    data: announcements
  })
})

module.exports = {
  createAnnouncementHandler,
  getAnnouncementsHandler,
  getAnnouncementByIdHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
  searchAnnouncementsHandler,
  getAnnouncementsForUserHandler
}
