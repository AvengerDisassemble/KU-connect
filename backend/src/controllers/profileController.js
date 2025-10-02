/**
 * @module controllers/profileController
 * @description Controller for profile management endpoints
 */

const profileService = require('../services/profileService')

/**
 * Creates a new profile (student or employer)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function createProfile (req, res) {
  try {
    const { role, ...profileData } = req.body

    let result
    if (role === 'student') {
      result = await profileService.createStudentUser(profileData)
    } else if (role === 'hr') {
      result = await profileService.createEmployerUser(profileData)
    } else {
      return res.status(400).json({
        error: 'Invalid role. Must be "student" or "hr"'
      })
    }

    res.status(201).json(result)
  } catch (error) {
    // Handle unique constraint violations (Prisma P2002)
    if (error.code === 'P2002') {
      // Prisma error.meta.target is an array of fields that caused the violation
      const fields = error.meta && error.meta.target ? error.meta.target : []
      const fieldList = fields.length > 0 ? fields.join(', ') : 'A unique field'
      return res.status(409).json({
        error: `${fieldList} already exists`
      })
    }

    // Handle foreign key constraints (Prisma P2003)
    if (error.code === 'P2003') {
      return res.status(400).json({
        error: 'Invalid reference ID provided'
      })
    }

    console.error('Profile creation error:', error)
    res.status(500).json({
      error: 'Failed to create profile'
    })
  }
}


/**
 * Updates an existing profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function updateProfile (req, res) {
  try {
    const { role, userId, ...updateData } = req.body
    
    // Determine user ID - from body or could be from auth context
    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      })
    }
    
    // First, check what role the user has
    const existingProfile = await profileService.getProfileById(userId)
    
    if (!existingProfile) {
      return res.status(404).json({
        error: 'User not found'
      })
    }
    
    let result
    const userRole = role || (existingProfile.student ? 'student' : existingProfile.hr ? 'hr' : null)
    
    if (userRole === 'student' && existingProfile.student) {
      result = await profileService.updateStudentProfile(userId, updateData)
    } else if (userRole === 'hr' && existingProfile.hr) {
      result = await profileService.updateEmployerProfile(userId, updateData)
    } else {
      return res.status(400).json({
        error: 'Unable to determine or update profile role'
      })
    }
    
    res.json(result)
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({
      error: 'Failed to update profile'
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
    const { userId } = req.params
    
    const profile = await profileService.getProfileById(userId)
    
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found'
      })
    }
    
    res.json(profile)
  } catch (error) {
    console.error('Profile retrieval error:', error)
    res.status(500).json({
      error: 'Failed to retrieve profile'
    })
  }
}

/**
 * Lists all profiles
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
async function listProfiles (req, res) {
  try {
    const profiles = await profileService.listProfiles()
    res.json(profiles)
  } catch (error) {
    console.error('Profile listing error:', error)
    res.status(500).json({
      error: 'Failed to list profiles'
    })
  }
}

module.exports = {
  createProfile,
  updateProfile,
  getProfile,
  listProfiles
}