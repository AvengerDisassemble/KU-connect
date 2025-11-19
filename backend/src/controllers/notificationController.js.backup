/**
 * @module controllers/notificationController
 * @description Controller for user-to-user notifications
 */

const notificationService = require('../services/notificationService')

/**
 * Internal trigger: Notify employer of new application
 * @route POST /api/notifications/employer/application
 * @access Internal/Admin only (protected by route middleware)
 */
async function notifyEmployerOfApplication(req, res, next) {
  try {
    const { studentUserId, jobId } = req.body

    if (!studentUserId || !jobId) {
      return res.status(400).json({
        success: false,
        message: 'Student user ID and job ID are required'
      })
    }

    const notification = await notificationService.notifyEmployerOfApplication({
      studentUserId,
      jobId
    })

    res.status(201).json({
      success: true,
      message: 'Employer notification created successfully',
      data: notification
    })
  } catch (error) {
    console.error('Notify employer error:', error.message)
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to notify employer'
    })
  }
}

/**
 * Internal trigger: Notify student of application status update
 * @route POST /api/notifications/student/approval
 * @access Internal/Admin only (protected by route middleware)
 */
async function notifyStudentOfApproval(req, res, next) {
  try {
    const { employerUserId, studentUserId, jobId, status, applicationId } = req.body

    if (!employerUserId || !studentUserId || !jobId || !status) {
      return res.status(400).json({
        success: false,
        message: 'Employer user ID, student user ID, job ID, and status are required'
      })
    }

    if (!['QUALIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either QUALIFIED or REJECTED'
      })
    }

    const notification = await notificationService.notifyStudentOfApproval({
      employerUserId,
      studentUserId,
      jobId,
      status,
      applicationId
    })

    res.status(201).json({
      success: true,
      message: 'Student notification created successfully',
      data: notification
    })
  } catch (error) {
    console.error('Notify student error:', error.message)
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to notify student'
    })
  }
}

/**
 * Get current user's notifications
 * @route GET /api/notifications
 * @access Authenticated users
 */
async function getUserNotifications(req, res) {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20

    const result = await notificationService.getNotificationsForUser(userId, {
      page,
      limit
    })

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: result
    })
  } catch (error) {
    console.error('Get notifications error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications'
    })
  }
}

/**
 * Mark notification as read
 * @route PATCH /api/notifications/:id/read
 * @access Authenticated users (recipient only)
 */
async function markAsRead(req, res) {
  try {
    const userId = req.user.id
    const notificationId = req.params.id

    const notification = await notificationService.markAsRead({
      id: notificationId,
      userId
    })

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    })
  } catch (error) {
    console.error('Mark as read error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    })
  }
}

/**
 * Get unread notification count
 * @route GET /api/notifications/unread/count
 * @access Authenticated users
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id
    const count = await notificationService.getUnreadCount(userId)

    res.status(200).json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: { count }
    })
  } catch (error) {
    console.error('Get unread count error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve unread count'
    })
  }
}

module.exports = {
  notifyEmployerOfApplication,
  notifyStudentOfApproval,
  getUserNotifications,
  markAsRead,
  getUnreadCount
}
