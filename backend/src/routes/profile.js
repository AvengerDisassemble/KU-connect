/**
 * @module routes/profile
 * @description Profile management routes
 */

const express = require('express')
const router = express.Router()
const profileController = require('../controllers/profileController')
const validate = require('../middlewares/validate')
const profileValidators = require('../validators/profile.validator')

// Get all profiles
router.get('/profiles', profileController.listProfiles)

// Get profile by ID
router.get('/profile/:userId', profileController.getProfile)

// Create new profile
router.post(
  '/profile',
  validate(profileValidators.createProfile),
  profileController.createProfile
)

// Update profile
router.patch(
  '/profile',
  validate(profileValidators.updateProfile),
  profileController.updateProfile
)

module.exports = router