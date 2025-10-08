const express = require('express')
const { registerEnterprise } = require('../../controllers/authController')
const { validateEnterpriseRegistration } = require('../../validators/authValidator')

const router = express.Router()

/**
 * @route POST /register/enterprise
 * @desc Register enterprise/company accounts
 * @access Public
 */
router.post('/', validateEnterpriseRegistration, registerEnterprise)

module.exports = router