/**
 * @module controllers/notificationController
 * @description Controller for unified notification system
 */

const notificationService = require('../services/notificationService')

/**
 * Get current user's notifications
 * @route GET /api/notifications
 * @query {string} [type] - Filter by type (ANNOUNCEMENT, APPLICATION_STATUS, EMPLOYER_APPLICATION)
 * @query {boolean} [unreadOnly] - Get only unread notifications
 * @query {number} [page=1] - Page number
 * @query {number} [limit=20] - Results per page
 * @access Authenticated users
 */
async function getUserNotifications(req, res) {
  try {
    const userId = req.user.id
    const { type, unreadOnly, page, limit } = req.query

    const result = await notificationService.getNotifications(userId, {
      type,
      unreadOnly: unreadOnly === 'true',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20
    })

    req.log?.('info', 'notification.list', {
      userId,
      ip: req.ip,
      type,
      unreadOnly: unreadOnly === 'true',
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      count: result?.items?.length || result?.length
    })

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: result
    })
  } catch (error) {
    req.log?.('error', 'notification.list.error', {
      userId: req.user?.id,
      ip: req.ip,
      error: error.message
    })
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

    const notification = await notificationService.markAsRead(notificationId, userId)

    if (!notification) {
      req.log?.('warn', 'notification.read.not_found', {
        userId,
        notificationId,
        ip: req.ip
      })
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized'
      })
    }

    req.log?.('info', 'notification.read', {
      userId,
      notificationId,
      ip: req.ip
    })
    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    })
  } catch (error) {
    req.log?.('error', 'notification.read.error', {
      userId: req.user?.id,
      notificationId: req.params?.id,
      ip: req.ip,
      error: error.message
    })
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    })
  }
}

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 * @query {string} [type] - Optional: only mark specific type as read
 * @access Authenticated users
 */
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id
    const { type } = req.query

    const count = await notificationService.markAllAsRead(userId, type)

    req.log?.('info', 'notification.read_all', {
      userId,
      ip: req.ip,
      type,
      count
    })
    res.status(200).json({
      success: true,
      message: `Marked ${count} notification(s) as read`,
      data: { count }
    })
  } catch (error) {
    req.log?.('error', 'notification.read_all.error', {
      userId: req.user?.id,
      ip: req.ip,
      error: error.message
    })
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    })
  }
}

/**
 * Get unread notification count
 * @route GET /api/notifications/unread/count
 * @query {string} [type] - Optional: count only specific type
 * @access Authenticated users
 */
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id
    const { type } = req.query

    const count = await notificationService.getUnreadCount(userId, type)

    req.log?.('info', 'notification.unread.count', {
      userId,
      ip: req.ip,
      type,
      count
    })
    res.status(200).json({
      success: true,
      message: 'Unread count retrieved successfully',
      data: { count }
    })
  } catch (error) {
    req.log?.('error', 'notification.unread.count.error', {
      userId: req.user?.id,
      ip: req.ip,
      error: error.message
    })
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve unread count'
    })
  }
}

/**
 * Delete a notification
 * @route DELETE /api/notifications/:id
 * @access Authenticated users (recipient only)
 */
async function deleteNotification(req, res) {
  try {
    const userId = req.user.id
    const notificationId = req.params.id

    const notification = await notificationService.deleteNotification(notificationId, userId)

    if (!notification) {
      req.log?.('warn', 'notification.delete.not_found', {
        userId,
        notificationId,
        ip: req.ip
      })
      return res.status(404).json({
        success: false,
        message: 'Notification not found or unauthorized'
      })
    }

    req.log?.('info', 'notification.delete', {
      userId,
      notificationId,
      ip: req.ip
    })
    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: notification
    })
  } catch (error) {
    req.log?.('error', 'notification.delete.error', {
      userId: req.user?.id,
      notificationId: req.params?.id,
      ip: req.ip,
      error: error.message
    })
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    })
  }
}

/**
 * Get notification statistics
 * @route GET /api/notifications/stats
 * @access Authenticated users
 */
async function getNotificationStats(req, res) {
  try {
    const userId = req.user.id

    const stats = await notificationService.getNotificationStats(userId)

    req.log?.('info', 'notification.stats', {
      userId,
      ip: req.ip
    })
    res.status(200).json({
      success: true,
      message: 'Notification statistics retrieved successfully',
      data: stats
    })
  } catch (error) {
    req.log?.('error', 'notification.stats.error', {
      userId: req.user?.id,
      ip: req.ip,
      error: error.message
    })
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification statistics'
    })
  }
}

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  getNotificationStats
}
