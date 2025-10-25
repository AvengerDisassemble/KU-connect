/**
 * Profile routes
 * @module routes/profile/index
 */

const express = require('express')
const multer = require('multer')
const router = express.Router()
const profileController = require('../../controllers/profileController')
const profileValidator = require('../../validators/profile.validator')
const auth = require('../../middlewares/authMiddleware')
const role = require('../../middlewares/roleMiddleware')

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2 MB for avatars
  },
  fileFilter: (req, file, cb) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed for avatars'))
    }
  }
})

// Require login for all profile endpoints
router.use(auth.authMiddleware)

// Admins can view all profiles
router.get('/', role.roleMiddleware(['ADMIN']), profileController.listProfiles)

// Avatar upload and download
router.post('/avatar', upload.single('avatar'), profileController.uploadAvatar)
router.get('/avatar/:userId/download', profileController.downloadAvatar)

// Admins or the profile owner can view a single profile
router.get('/:userId', profileController.getProfile)

// Authenticated users can update only their own profile
router.patch('/', profileValidator.validateUpdateProfile, profileController.updateProfile)

module.exports = router

