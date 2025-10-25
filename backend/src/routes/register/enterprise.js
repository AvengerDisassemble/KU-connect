const express = require('express')
const { registerEnterprise } = require('../../controllers/authController')
const { validateEnterpriseRegistration } = require('../../validators/authValidator')
const { authLimiter } = require('../../middlewares/rateLimitMiddleware')

const router = express.Router()

/**
 * @route POST /register/enterprise
 * @desc Register enterprise/company accounts
 * @access Public
 * Rate limited to 5 requests per 15 minutes to prevent account spam
 */
router.post('/', authLimiter, validateEnterpriseRegistration, registerEnterprise)

module.exports = router