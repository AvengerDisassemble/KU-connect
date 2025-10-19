const express = require('express')
const { login } = require('../controllers/authController')
const { validateLogin } = require('../validators/authValidator')

const router = express.Router()

/**
 * @route POST /login
 * @desc User login
 * @access Public
 */
router.post('/', validateLogin, login)

module.exports = router