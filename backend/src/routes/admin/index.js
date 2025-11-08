/**
 * @file src/routes/admin/index.js
 * @description Admin routes for user management, announcements, and dashboard
 */

const express = require('express')
const router = express.Router()

const { authMiddleware } = require('../../middlewares/authMiddleware')
const { roleMiddleware } = require('../../middlewares/roleMiddleware')
const {
  adminReadLimiter,
  adminWriteLimiter,
  adminCriticalLimiter,
  adminAnnouncementLimiter
} = require('../../middlewares/rateLimitMiddleware')
const {
  getPendingUsersHandler,
  approveUserHandler,
  rejectUserHandler,
  suspendUserHandler,
  activateUserHandler,
  listUsersHandler,
  getDashboardHandler,
  searchUsersHandler,
  createProfessorHandler
} = require('../../controllers/adminController')
const {
  createAnnouncementHandler,
  getAnnouncementsHandler,
  getAnnouncementByIdHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
  searchAnnouncementsHandler
} = require('../../controllers/announcementController')
const {
  validateAnnouncementCreate,
  validateAnnouncementUpdate,
  validateUserListQuery,
  validateUserId,
  validateAnnouncementSearch,
  validateUserSearch,
  validateProfessorCreate
} = require('../../validators/adminValidator')

// All routes require authentication and admin role
router.use(authMiddleware)
router.use(roleMiddleware('ADMIN'))

// ==================== USER MANAGEMENT ROUTES ====================

/**
 * GET /api/admin/users/pending
 * Get all pending users
 */
router.get('/users/pending', adminReadLimiter, getPendingUsersHandler)

/**
 * GET /api/admin/users
 * Get all users with optional filtering
 */
router.get('/users', adminReadLimiter, validateUserListQuery, listUsersHandler)

/**
 * POST /api/admin/users/search
 * Search users with comprehensive filters and pagination
 */
router.post('/users/search', adminReadLimiter, validateUserSearch, searchUsersHandler)

/**
 * POST /api/admin/users/professor
 * Create a professor account (auto-approved)
 */
router.post('/users/professor', adminCriticalLimiter, validateProfessorCreate, createProfessorHandler)

/**
 * POST /api/admin/users/:userId/approve
 * Approve a user
 */
router.post('/users/:userId/approve', adminCriticalLimiter, validateUserId, approveUserHandler)

/**
 * POST /api/admin/users/:userId/reject
 * Reject a user
 */
router.post('/users/:userId/reject', adminCriticalLimiter, validateUserId, rejectUserHandler)

/**
 * POST /api/admin/users/:userId/suspend
 * Suspend a user
 */
router.post('/users/:userId/suspend', adminCriticalLimiter, validateUserId, suspendUserHandler)

/**
 * POST /api/admin/users/:userId/activate
 * Activate/reapprove a user
 */
router.post('/users/:userId/activate', adminCriticalLimiter, validateUserId, activateUserHandler)

// ==================== ANNOUNCEMENT ROUTES ====================

/**
 * POST /api/admin/announcements
 * Create a new announcement
 */
router.post('/announcements', adminAnnouncementLimiter, validateAnnouncementCreate, createAnnouncementHandler)

/**
 * GET /api/admin/announcements
 * Get all announcements
 */
router.get('/announcements', adminReadLimiter, getAnnouncementsHandler)

/**
 * POST /api/admin/announcements/search
 * Search announcements with comprehensive filters and pagination
 */
router.post('/announcements/search', adminReadLimiter, validateAnnouncementSearch, searchAnnouncementsHandler)

/**
 * GET /api/admin/announcements/:id
 * Get a single announcement by ID
 */
router.get('/announcements/:id', adminReadLimiter, getAnnouncementByIdHandler)

/**
 * PATCH /api/admin/announcements/:id
 * Update an announcement
 */
router.patch('/announcements/:id', adminWriteLimiter, validateAnnouncementUpdate, updateAnnouncementHandler)

/**
 * DELETE /api/admin/announcements/:id
 * Delete an announcement (soft delete)
 */
router.delete('/announcements/:id', adminWriteLimiter, deleteAnnouncementHandler)

// ==================== DASHBOARD ROUTES ====================

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', adminReadLimiter, getDashboardHandler)

module.exports = router
