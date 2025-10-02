/**
 * @module controllers/profileController
 * @description Controller for profile management endpoints
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
    const { role, userId, ...updateData } = req.body
    if (!profile) return res.status(404).json({ error: 'User not found' })

    // Resolve role
    let resolvedRole = role
    if (!resolvedRole) {
      if (profile.student && !profile.hr) resolvedRole = 'student'
      else if (profile.hr && !profile.student) resolvedRole = 'hr'
      else return res.status(400).json({ error: 'User role not determined' })
    }

    let result
    if (resolvedRole === 'student' && profile.student) {
      result = await profileService.updateStudentProfile(userId, updateData)
    } else if (resolvedRole === 'hr' && profile.hr) {
      result = await profileService.updateEmployerProfile(userId, updateData)
    } else {
      return res.status(403).json({ error: 'Role mismatch – cannot update profile' })
    }

    res.json(result)
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
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
  updateProfile,
  getProfile,
  listProfiles
}