/**
 * @module routes/profile/index
 * @description Profile management routes with authentication and validation
 */

const express = require('express')
const router = express.Router()
const profileController = require('../../controllers/profileController')
const { authMiddleware } = require('../../middlewares/authMiddleware')
const { roleMiddleware } = require('../../middlewares/roleMiddleware')
const { validateUpdateProfile } = require('../../validators/profileValidator')

// Require authentication for all profile endpoints
router.use(authMiddleware)

// ===================== ADMIN ACCESS =====================

// Admins can view all profiles
router.get('/', roleMiddleware(['ADMIN']), profileController.listProfiles)

// ===================== INDIVIDUAL PROFILE ACCESS =====================

// Admins or the profile owner can view a single profile
router.get('/:userId', profileController.getProfile)

// Authenticated users can update their own profile
router.patch('/', validateUpdateProfile, profileController.updateProfile)

module.exports = router

