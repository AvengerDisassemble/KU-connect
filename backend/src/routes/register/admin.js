const express = require('express')
const { registerAdmin } = require('../../controllers/authController')
const { validateAdminRegistration } = require('../../validators/authValidator')

const router = express.Router()

/**
 * @route POST /register/admin
 * @desc Register admin accounts
 * @access Public
 */
router.post('/', validateAdminRegistration, registerAdmin)

module.exports = router