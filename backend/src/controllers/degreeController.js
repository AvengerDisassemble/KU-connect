/**
 * Degree controller
 * Why: provide degree type data to frontend
 * @module controllers/degreeController
 */
const degreeService = require('../services/degreeService')

/**
 * Get all degree types
 * @route GET /api/degree-types
 */
async function getAllDegreeTypes (req, res, next) {
  try {
    const types = await degreeService.listDegreeTypes()
    res.json({ 
      success: true, 
      message: 'Degree types retrieved successfully', 
      data: types 
    })
  } catch (err) {
    console.error('Get degree types error:', err)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve degree types'
    })
  }
}

module.exports = { getAllDegreeTypes }
