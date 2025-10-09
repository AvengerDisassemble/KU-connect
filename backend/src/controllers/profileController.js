/**
 * @module controllers/profileController
 * @description Controller for profile management endpoints with authentication and standardized responses
 */

const profileService = require('../services/profileService')

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

module.exports = {
  updateProfile,
  getProfile,
  listProfiles
}
