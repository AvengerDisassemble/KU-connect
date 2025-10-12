/**
 * Profile routes
 * @module routes/profile/index
 */

const express = require('express')
const router = express.Router()
const profileController = require('../../controllers/profileController')
const profileValidator = require('../../validators/profile.validator')
const auth = require('../../middlewares/authMiddleware')
const role = require('../../middlewares/roleMiddleware')

// Require login for all profile endpoints
router.use(auth.authMiddleware)

// Admins can view all profiles
router.get('/', role.roleMiddleware(['ADMIN']), profileController.listProfiles)

// Admins or the profile owner can view a single profile
router.get('/:userId', profileController.getProfile)

// Authenticated users can update only their own profile
router.patch('/', profileValidator.validateUpdateProfile,profileController.updateProfile)

module.exports = router
