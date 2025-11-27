/**
 * Degree controller
 * Why: provide degree type data to frontend
 * @module controllers/degreeController
 */
const degreeService = require("../services/degreeService");

/**
 * Get all degree types
 * @route GET /api/degree
 * @access Public - No authentication required (needed for registration forms)
 */
async function getAllDegreeTypes(req, res, next) {
  try {
    const types = await degreeService.listDegreeTypes();
    req.log?.("info", "degree.list", {
      userId: req.user?.id,
      count: types.length,
      ip: req.ip,
    });
    res.json({
      success: true,
      message: "Degree types retrieved successfully",
      data: types,
    });
  } catch (err) {
    req.log?.("error", "degree.list.error", {
      userId: req.user?.id,
      ip: req.ip,
      error: err.message,
    });
    res.status(500).json({
      success: false,
      message: "Failed to retrieve degree types",
    });
  }
}

module.exports = { getAllDegreeTypes };
