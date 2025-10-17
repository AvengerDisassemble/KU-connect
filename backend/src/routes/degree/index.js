/**
 * Degree routes
 * Why: provide degree type data for registration forms
 * @module routes/degree/index
 */
const express = require('express')
const router = express.Router()
const { authMiddleware } = require('../../middlewares/authMiddleware')
const controller = require('../../controllers/degreeController')

// GET /api/degree-types - All authenticated users can access
router.get('/', authMiddleware, controller.getAllDegreeTypes)

module.exports = router
