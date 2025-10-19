const express = require('express')
const { registerAlumni } = require('../../controllers/authController')
const { validateAlumniRegistration } = require('../../validators/authValidator')

const router = express.Router()

/**
 * @route POST /register/alumni
 * @desc Register alumni (students) who have graduated
 * @access Public
 */
router.post('/', validateAlumniRegistration, registerAlumni)

module.exports = router