/**
 * @file src/controllers/adminController.js
 * @description Controller for admin-specific operations (user management, dashboard)
 */

const userService = require('../services/userService')
const { asyncErrorHandler } = require('../middlewares/errorHandler')

/**
 * Get all pending users
 * GET /api/admin/users/pending
 * @access Admin only
 */
const getPendingUsersHandler = asyncErrorHandler(async (req, res) => {
  const users = await userService.listPendingUsers()

  res.json({
    success: true,
    message: 'Pending users retrieved successfully',
    data: users
  })
})

/**
 * Approve a user
 * POST /api/admin/users/:userId/approve
 * @access Admin only
 */
const approveUserHandler = asyncErrorHandler(async (req, res) => {
  const { userId } = req.params

  const user = await userService.updateUserStatus(userId, 'APPROVED')

  res.json({
    success: true,
    message: 'User approved successfully',
    data: user
  })
})

/**
 * Reject a user
 * POST /api/admin/users/:userId/reject
 * @access Admin only
 */
const rejectUserHandler = asyncErrorHandler(async (req, res) => {
  const { userId } = req.params

  const user = await userService.updateUserStatus(userId, 'REJECTED')

  res.json({
    success: true,
    message: 'User rejected',
    data: user
  })
})

/**
 * Suspend a user
 * POST /api/admin/users/:userId/suspend
 * @access Admin only
 */
const suspendUserHandler = asyncErrorHandler(async (req, res) => {
  const { userId } = req.params

  const user = await userService.suspendUser(userId)

  res.json({
    success: true,
    message: 'User suspended successfully',
    data: user
  })
})

/**
 * Activate (reapprove) a user
 * POST /api/admin/users/:userId/activate
 * @access Admin only
 */
const activateUserHandler = asyncErrorHandler(async (req, res) => {
  const { userId } = req.params

  const user = await userService.activateUser(userId)

  res.json({
    success: true,
    message: 'User activated successfully',
    data: user
  })
})

/**
 * List all users with filters
 * GET /api/admin/users
 * @access Admin only
 */
const listUsersHandler = asyncErrorHandler(async (req, res) => {
  const { status, role } = req.query

  const filters = {}
  if (status) filters.status = status
  if (role) filters.role = role

  const users = await userService.getAllUsers(filters)

  res.json({
    success: true,
    message: 'Users retrieved successfully',
    data: users
  })
})

/**
 * Get admin dashboard statistics
 * GET /api/admin/dashboard
 * @access Admin only
 */
const getDashboardHandler = asyncErrorHandler(async (req, res) => {
  const stats = await userService.getDashboardStats()

  res.json({
    success: true,
    message: 'Dashboard statistics retrieved successfully',
    data: stats
  })
})

module.exports = {
  getPendingUsersHandler,
  approveUserHandler,
  rejectUserHandler,
  suspendUserHandler,
  activateUserHandler,
  listUsersHandler,
  getDashboardHandler
}

