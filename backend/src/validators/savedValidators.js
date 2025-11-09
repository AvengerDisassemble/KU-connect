/**
 * Validators for saved jobs endpoints
 */
const { param, body, validationResult } = require('express-validator')

const userIdParam = param('user_id').isString().notEmpty()
const jobIdBody = body('jobId').isString().notEmpty()

function handleValidationResult (req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        details: errors.array()
      }
    })
  }
  next()
}

module.exports = {
  userIdParam,
  jobIdBody,
  handleValidationResult
}
