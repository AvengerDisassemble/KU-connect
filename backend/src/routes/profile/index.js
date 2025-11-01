/**
 * @module routes/profile/index
 * @description Profile management routes with authentication and validation
 */

const express = require('express')
const multer = require('multer')
const router = express.Router()
const profileController = require('../../controllers/profileController')
const { authMiddleware, verifiedUserMiddleware } = require('../../middlewares/authMiddleware')
const { roleMiddleware } = require('../../middlewares/roleMiddleware')
const { validateUpdateProfile } = require('../../validators/profileValidator')
const { strictLimiter, writeLimiter } = require('../../middlewares/rateLimitMiddleware')

// Configure multer for avatar uploads (support common image formats, 5 MB limit)
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, GIF, or WebP image files are allowed'))
    }
  }
})

// Require authentication for all profile endpoints
router.use(authMiddleware)

// ===================== ADMIN ACCESS =====================

// Admins can view all profiles
// Rate limited: Expensive query returning many profiles
router.get('/', strictLimiter, roleMiddleware(['ADMIN']), profileController.listProfiles)

// ===================== AVATAR MANAGEMENT =====================
// Note: Avatar routes must come before /:userId to avoid route conflicts

// Upload avatar (authenticated users can upload their own avatar)
// Rate limited: Write operation with file upload
router.post('/avatar', writeLimiter, avatarUpload.single('avatar'), profileController.uploadAvatar)

// Download avatar (any authenticated user can view avatars)
// Rate limited: Read operation
router.get('/avatar/:userId/download', strictLimiter, profileController.downloadAvatar)

// ===================== INDIVIDUAL PROFILE ACCESS =====================

// Admins or the profile owner can view a single profile
// Rate limited: Multiple database joins for role-specific data
router.get('/:userId', strictLimiter, profileController.getProfile)

// Authenticated users can update their own profile
// Rate limited: Write operation
// REQUIRES: APPROVED status (verifiedUserMiddleware)
router.patch('/', writeLimiter, verifiedUserMiddleware, validateUpdateProfile, profileController.updateProfile)

module.exports = router

