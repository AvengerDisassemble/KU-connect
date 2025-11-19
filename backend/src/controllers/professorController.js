/**
 * Professor Analytics Controller
 * Handles HTTP requests for professor analytics and student monitoring
 * @module controllers/professorController
 */

const professorService = require('../services/professorService')

/**
 * Get dashboard analytics with optional filters
 * @route GET /api/professor/analytics/dashboard
 * @access PROFESSOR, ADMIN
 */
const getDashboard = async (req, res, next) => {
  try {
    const filters = {
      degreeTypeId: req.query.degreeTypeId,
      timePeriod: req.query.timePeriod,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    }
    
    const data = await professorService.getDashboardAnalytics(filters)
    
    res.json({
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get paginated list of students with filters and sorting
 * @route GET /api/professor/students
 * @access PROFESSOR, ADMIN
 */
const getStudents = async (req, res, next) => {
  try {
    const params = {
      degreeTypeId: req.query.degreeTypeId,
      year: req.query.year,
      status: req.query.status,
      hasApplications: req.query.hasApplications,
      search: req.query.search,
      sortBy: req.query.sortBy,
      order: req.query.order,
      page: req.query.page,
      limit: req.query.limit
    }
    
    const data = await professorService.getStudentList(params)
    
    res.json({
      success: true,
      message: 'Student list retrieved successfully',
      data
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Get detailed information for a specific student
 * @route GET /api/professor/students/:studentId
 * @access PROFESSOR, ADMIN
 */
const getStudentById = async (req, res, next) => {
  try {
    const { studentId } = req.params
    
    const data = await professorService.getStudentDetail(studentId)
    
    res.json({
      success: true,
      message: 'Student detail retrieved successfully',
      data
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getDashboard,
  getStudents,
  getStudentById
}
