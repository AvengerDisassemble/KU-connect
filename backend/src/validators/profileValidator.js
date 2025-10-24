/**
 * @module validators/profileValidator
 * @description Joi validation schemas for profile operations
 */

const Joi = require('joi')

// Utility constants
const currentYear = new Date().getFullYear()

/**
 * Validation schema for updating a profile (student or HR)
 * Automatically used in controller or middleware before hitting DB
 */
const updateProfileSchema = Joi.object({
  // Common fields for all users
  name: Joi.string().max(100).optional(),
  surname: Joi.string().max(100).optional(),
  email: Joi.any().forbidden().messages({
  'any.forbidden': 'Email cannot be changed. Please contact support.'
  }),
  
  // Optional role to specify which type of update
  role: Joi.string().valid('student', 'hr').optional(),
  
  // phoneNumber is required for HR, optional for others
  phoneNumber: Joi.when('role', {
    is: 'hr',
    then: Joi.string()
      .pattern(/^[0-9+\-()\s]+$/)
      .required()
      .messages({
        'any.required': 'Phone number is required for HR profiles',
        'string.pattern.base': 'Phone number must contain only numbers, +, -, (), and spaces'
      }),
    otherwise: Joi.string()
      .pattern(/^[0-9+\-()\s]+$/)
      .optional()
      .allow(null, '')
  }),

  // Student-specific fields
  address: Joi.string().max(255).optional(),
  degreeTypeId: Joi.string().optional(), // Changed from number to string (cuid)

  gpa: Joi.number()
    .precision(2)
    .min(0)
    .max(4)
    .optional()
    .messages({
      'number.base': 'GPA must be a valid number',
      'number.min': 'GPA cannot be less than 0',
      'number.max': 'GPA cannot exceed 4.00'
    }),

  expectedGraduationYear: Joi.number()
    .integer()
    .min(currentYear)
    .max(currentYear + 10)
    .optional()
    .messages({
      'number.base': 'Expected graduation year must be a valid integer',
      'number.max': `Expected graduation year cannot be more than 10 years from now`
    }),

  // HR-specific fields
  companyName: Joi.string().max(255).optional(),
  description: Joi.string().max(1000).optional().allow(null, ''),
  industry: Joi.string().optional(),
  companySize: Joi.string().optional(),
  website: Joi.string().uri().optional().allow(null, ''),
  address: Joi.string().max(255).optional()
})
  .min(1) // At least one field must be updated
  .messages({
    'object.min': 'At least one field is required for update'
  })

/**
 * Middleware wrapper for validation
 */
function validateUpdateProfile(req, res, next) {
  const { error, value } = updateProfileSchema.validate(req.body, {
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
  updateProfileSchema,
  validateUpdateProfile
}
