/**
 * Professor Analytics Routes
 * Provides endpoints for professor analytics and student monitoring
 * @module routes/professorRoutes
 */

const express = require('express')
const router = express.Router()
const professorController = require('../controllers/professorController')
const { authMiddleware } = require('../middlewares/authMiddleware')
const { roleMiddleware } = require('../middlewares/roleMiddleware')
const { strictLimiter, searchLimiter, generalLimiter } = require('../middlewares/rateLimitMiddleware')

// All routes require PROFESSOR or ADMIN role
const professorOrAdmin = [
  authMiddleware,
  roleMiddleware(['PROFESSOR', 'ADMIN'])
]

// Dashboard analytics endpoint
// Why strictLimiter: Performs expensive aggregations across multiple tables
router.get('/analytics/dashboard', strictLimiter, ...professorOrAdmin, professorController.getDashboard)

// Student list endpoint
// Why searchLimiter: Supports search and filter operations which can be expensive
router.get('/students', searchLimiter, ...professorOrAdmin, professorController.getStudents)

// Student detail endpoint
// Why generalLimiter: Simple lookup by ID, less expensive
router.get('/students/:studentId', generalLimiter, ...professorOrAdmin, professorController.getStudentById)

module.exports = router
