/**
 * Main API router
 * @module routes/index
 */
const express = require('express')

const router = express.Router()

// Why: Register example route for demonstration and testing
router.use(require('./example'))

module.exports = router
