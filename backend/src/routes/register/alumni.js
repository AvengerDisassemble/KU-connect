const express = require('express')
const { registerAlumni } = require('../../controllers/authController')
const { validateAlumniRegistration } = require('../../validators/authValidator')
const { authLimiter } = require('../../middlewares/rateLimitMiddleware')

const router = express.Router()

/**
 * @route POST /register/alumni
 * @desc Register alumni (students) who have graduated
 * @access Public
 * Rate limited to 5 requests per 15 minutes to prevent account spam
 */
router.post('/', authLimiter, validateAlumniRegistration, registerAlumni)

module.exports = router