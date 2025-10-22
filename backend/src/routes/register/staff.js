const express = require('express')
const { registerStaff } = require('../../controllers/authController')
const { validateStaffRegistration } = require('../../validators/authValidator')
const { authLimiter } = require('../../middlewares/rateLimitMiddleware')

const router = express.Router()

/**
 * @route POST /register/staff
 * @desc Register university staff (professors) accounts
 * @access Public
 * Rate limited to 5 requests per 15 minutes to prevent account spam
 */
router.post('/', authLimiter, validateStaffRegistration, registerStaff)

module.exports = router