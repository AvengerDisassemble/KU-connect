/**
 * @module routes/profile/index
 * @description Profile management routes with authentication and validation
 */

const express = require('express')
const router = express.Router()
const profileController = require('../../controllers/profileController')
const { authMiddleware, verifiedUserMiddleware } = require('../../middlewares/authMiddleware')
const { roleMiddleware } = require('../../middlewares/roleMiddleware')
const { validateUpdateProfile } = require('../../validators/profileValidator')
const { strictLimiter, writeLimiter } = require('../../middlewares/rateLimitMiddleware')

// Require authentication for all profile endpoints
router.use(authMiddleware)

// ===================== ADMIN ACCESS =====================

// Admins can view all profiles
// Rate limited: Expensive query returning many profiles
router.get('/', strictLimiter, roleMiddleware(['ADMIN']), profileController.listProfiles)

// ===================== INDIVIDUAL PROFILE ACCESS =====================

// Admins or the profile owner can view a single profile
// Rate limited: Multiple database joins for role-specific data
router.get('/:userId', strictLimiter, profileController.getProfile)

// Authenticated users can update their own profile
// Rate limited: Write operation
// REQUIRES: APPROVED status (verifiedUserMiddleware)
router.patch('/', writeLimiter, verifiedUserMiddleware, validateUpdateProfile, profileController.updateProfile)

module.exports = router

