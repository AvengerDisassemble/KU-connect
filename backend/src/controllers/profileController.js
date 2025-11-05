/**
 * @module controllers/profileController
 * @description Controller for profile management endpoints with authentication and standardized responses
 */

const profileService = require('../services/profileService')
const storageProvider = require('../services/storageFactory')
const prisma = require('../models/prisma')

/**
 * Updates an existing profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function updateProfile (req, res) {
  try {
    const { role, ...updateData } = req.body
    const userId = req.user.id

    // Prevent email change at controller level - fail fast before database operations
    if (updateData.email) {
      return res.status(400).json({
        success: false,
        message: 'Email cannot be changed. Please contact support.'
      })
    }

    const profile = await profileService.getProfileById(userId)
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Resolve role automatically if not provided
    let resolvedRole = role
    if (!resolvedRole) {
      if (profile.student && !profile.hr) resolvedRole = 'student'
      else if (profile.hr && !profile.student) resolvedRole = 'hr'
      else {
        return res.status(400).json({
          success: false,
          message: 'User role not determined'
        })
      }
    }

    let result
    if (resolvedRole === 'student' && profile.student) {
      result = await profileService.updateStudentProfile(userId, updateData)
    } else if (resolvedRole === 'hr' && profile.hr) {
      result = await profileService.updateEmployerProfile(userId, updateData)
    } else {
      return res.status(403).json({
        success: false,
        message: 'Role mismatch – cannot update profile'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    })
  }
}

/**
 * Gets a single profile by user ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function getProfile (req, res) {
  try {
    const { role: userRole, id: userId } = req.user
    const requestedUserId = req.params.userId || userId

    // Roles allowed to view any profile
    const privilegedRoles = ['ADMIN', 'HR', 'PROFESSOR']

    // Non-privileged users can only access their own profile
    if (requestedUserId !== userId && !privilegedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: you are not authorized to view this profile'
      })
    }

    const profile = await profileService.getProfileById(requestedUserId)

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: profile
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    })
  }
}


/**
 * Lists all profiles (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function listProfiles (req, res) {
  try {
    const profiles = await profileService.listProfiles()

    res.status(200).json({
      success: true,
      message: 'Profiles listed successfully',
      data: profiles
    })
  } catch (error) {
    console.error('List profiles error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to list profiles'
    })
  }
}

/**
 * Upload user avatar
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function uploadAvatar(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      })
    }

    const userId = req.user.id

    // Fetch current user to check for existing avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarKey: true }
    })

    // Best-effort delete old avatar if exists
    if (user && user.avatarKey) {
      try {
        await storageProvider.deleteFile(user.avatarKey)
      } catch (error) {
        console.error('Failed to delete old avatar:', error.message)
        // Don't fail the request if old file deletion fails
      }
    }

    // Upload new avatar
    const fileKey = await storageProvider.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      { prefix: 'avatars' }
    )

    // Update user record
    await prisma.user.update({
      where: { id: userId },
      data: { avatarKey: fileKey }
    })

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { fileKey }
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload avatar'
    })
  }
}

/**
 * Download avatar file (protected)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function downloadAvatar(req, res) {
  try {
    const requestedUserId = req.params.userId

    const user = await prisma.user.findUnique({
      where: { id: requestedUserId },
      select: { avatarKey: true }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (!user.avatarKey) {
      return res.status(404).json({
        success: false,
        message: 'No avatar found for this user'
      })
    }

    // Try signed URL first (S3), fallback to streaming (local)
    const signedUrl = await storageProvider.getSignedDownloadUrl(user.avatarKey)
    
    if (signedUrl) {
      return res.redirect(signedUrl)
    }

    // Stream the file
    const { stream, mimeType, filename } = await storageProvider.getReadStream(user.avatarKey)
    
    res.setHeader('Content-Type', mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache avatars for 1 hour
    res.setHeader('X-Content-Type-Options', 'nosniff')
    
    stream.pipe(res)
  } catch (error) {
    console.error('Download avatar error:', error)
    
    if (error.message && error.message.includes('File not found')) {
      return res.status(404).json({
        success: false,
        message: 'Avatar file not found'
      })
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to download avatar'
    })
  }
}

module.exports = {
  updateProfile,
  getProfile,
  listProfiles,
  uploadAvatar,
  downloadAvatar
}

