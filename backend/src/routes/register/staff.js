const express = require('express')
const { registerStaff } = require('../../controllers/authController')
const { validateStaffRegistration } = require('../../validators/authValidator')

const router = express.Router()

/**
 * @route POST /register/staff
 * @desc Register university staff (professors) accounts
 * @access Public
 */
router.post('/', validateStaffRegistration, registerStaff)

module.exports = router