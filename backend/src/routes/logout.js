const express = require('express')
const { logout } = require('../controllers/authController')
const { authMiddleware } = require('../middlewares/authMiddleware')

const router = express.Router()

/**
 * @route POST /logout
 * @desc Logout user
 * @access Public (but recommended to use with auth)
 */
router.post('/', logout)

module.exports = router