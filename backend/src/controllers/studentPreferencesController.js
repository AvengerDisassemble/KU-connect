/**
 * @module controllers/studentPreferencesController
 * @description Controller for Student Preferences management
 */

const { asyncErrorHandler } = require('../middlewares/errorHandler')
const studentPreferenceService = require('../services/studentPreferenceService')

/**
 * Get student preferences
 * @route GET /api/students/preferences
 */
const getPreferences = asyncErrorHandler(async (req, res) => {
  const userId = req.user.id

  const preference = await studentPreferenceService.getPreferenceByUserId(userId)

  res.status(200).json({
    success: true,
    data: preference
  })
})

/**
 * Create or update student preferences
 * @route PATCH /api/students/preferences
 */
const upsertPreferences = asyncErrorHandler(async (req, res) => {
  const userId = req.user.id
  const { desiredLocation, minSalary, industry, jobType, remoteWork } = req.body

  const preference = await studentPreferenceService.upsertPreferenceByUserId(userId, {
    desiredLocation,
    minSalary,
    industry,
    jobType,
    remoteWork
  })

  res.status(200).json({
    success: true,
    message: 'Preferences saved',
    data: preference
  })
})

module.exports = {
  getPreferences,
  upsertPreferences
}
