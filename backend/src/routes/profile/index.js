/**
 * @module routes/profile
 * @description Profile management routes
 */

const express = require('express')
const router = express.Router()
const profileController = require('../../controllers/profileController')
const validate = require('../../middlewares/validate')
const profileValidators = require('../../validators/profile.validator')

// Get all profiles
router.get('/', profileController.listProfiles)

// Get profile by ID
router.get('/:userId', profileController.getProfile)

// Update profile
router.patch(
  '/',
  validate(profileValidators.updateProfile),
  profileController.updateProfile
)

module.exports = router