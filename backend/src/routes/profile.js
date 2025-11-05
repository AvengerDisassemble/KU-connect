/**
 * Profile routes
 * @module routes/profile
 */

const express = require('express')
const router = express.Router()
const controller = require('../controllers/profileController')
const auth = require('../middlewares/authMiddleware')
const { dashboardLimiter } = require('../middlewares/rateLimitMiddleware')

// GET /api/profile/dashboard
router.get('/dashboard', dashboardLimiter, auth.authMiddleware, controller.getDashboardData)

module.exports = router
