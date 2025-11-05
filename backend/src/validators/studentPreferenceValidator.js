/**
 * @module validators/studentPreferenceValidator
 * @description Joi validation schemas for student preference operations
 */

const Joi = require('joi')

/**
 * Validation schema for updating student preferences
 * Supports partial updates (PATCH method)
 * Prevents modification of studentId or any database fields
 */
const updateStudentPreferenceSchema = Joi.object({
  // Forbidden fields - cannot be changed
  studentId: Joi.forbidden().messages({
    'any.forbidden': 'Student ID cannot be modified'
  }),
  id: Joi.forbidden().messages({
    'any.forbidden': 'Preference ID cannot be modified'
  }),
  userId: Joi.forbidden().messages({
    'any.forbidden': 'User ID cannot be modified'
  }),
  createdAt: Joi.forbidden().messages({
    'any.forbidden': 'Created date cannot be modified'
  }),
  updatedAt: Joi.forbidden().messages({
    'any.forbidden': 'Updated date cannot be modified'
  }),

  // Allowed optional fields
  desiredLocation: Joi.string()
    .trim()
    .max(255)
    .optional()
    .allow(null, '')
    .messages({
      'string.max': 'Desired location cannot exceed 255 characters'
    }),

  minSalary: Joi.number()
    .integer()
    .min(0)
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Minimum salary must be a valid number',
      'number.min': 'Minimum salary cannot be negative'
    }),

  industry: Joi.string()
    .trim()
    .uppercase()
    .valid('IT_HARDWARE_AND_DEVICES', 'IT_SOFTWARE', 'IT_SERVICES', 'NETWORK_SERVICES', 'EMERGING_TECH', 'E_COMMERCE', 'OTHER')
    .optional()
    .allow(null, '')
    .messages({
      'any.only': 'Industry must be one of: IT_HARDWARE_AND_DEVICES, IT_SOFTWARE, IT_SERVICES, NETWORK_SERVICES, EMERGING_TECH, E_COMMERCE, OTHER'
    }),

  jobType: Joi.string()
    .trim()
    .lowercase()
    .valid('internship', 'part-time', 'full-time', 'contract')
    .optional()
    .allow(null, '')
    .messages({
      'any.only': 'Job type must be one of: internship, part-time, full-time, contract'
    }),

  remoteWork: Joi.string()
    .trim()
    .lowercase()
    .valid('on-site', 'remote', 'hybrid')
    .optional()
    .allow(null, '')
    .messages({
      'any.only': 'Remote work preference must be one of: on-site, remote, hybrid'
    })
})
  .min(1) // At least one field must be updated (excluding forbidden fields)
  .messages({
    'object.min': 'At least one preference field is required for update'
  })

/**
 * Middleware wrapper for validation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateStudentPreferenceUpdate(req, res, next) {
  const { error, value } = updateStudentPreferenceSchema.validate(req.body, {
    abortEarly: true, // Stop at first error
    allowUnknown: false, // No unexpected keys
    stripUnknown: true // Remove invalid keys silently
  })

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    })
  }

  req.body = value
  next()
}

module.exports = {
  updateStudentPreferenceSchema,
  validateStudentPreferenceUpdate
}
