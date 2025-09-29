/**
 * @module validators/profile.validator
 * @description Validation schemas for profile operations
 */

const Joi = require('joi')

const industryValues = ['TECHNOLOGY', 'FINANCE', 'EDUCATION', 'HEALTHCARE', 'OTHER'];
const companySizeValues = ['ONE_TO_TEN', 'ELEVEN_TO_FIFTY', 'FIFTY_ONE_TO_TWO_HUNDRED', 'TWO_HUNDRED_PLUS'];

/**
 * Validation schema for creating a user profile
 */
const baseUserSchema = {
  role: Joi.string().valid('student', 'hr').required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().max(100).required(),
  surname: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().pattern(/^[0-9+\-()\s]+$/).optional().allow(null, ''),
}

/**
 * Validation schema for creating a student profile
 */
const createStudentSchema = Joi.object({
  ...baseUserSchema,
  role: Joi.string().valid('student').required(),
  degreeTypeId: Joi.number().integer().required(),
  address: Joi.string().max(255).required(),
  gpa: Joi.number().min(0).max(4).precision(2).optional(),
  expectedGraduationYear: Joi.number().integer().min(new Date().getFullYear()).max(new Date().getFullYear() + 20).optional()
});

/**
 * Validation schema for creating an employer profile
 */
const createEmployerSchema = Joi.object({
  ...baseUserSchema,
  role: Joi.string().valid('hr').required(),
  companyName: Joi.string().max(255).required(),
  address: Joi.string().max(255).required(),
  industry: Joi.string().valid(...industryValues).required(),
  companySize: Joi.string().valid(...companySizeValues).required(),
  website: Joi.string().uri().optional().allow(null, '')
});

/**
 * Validation schema for updating a student profile
 */
const updateStudentSchema = Joi.object({
  role: Joi.string().valid('student').optional(),
  userId: Joi.number().integer().positive().required(),
  address: Joi.string().min(1).max(500).optional(),
  degreeTypeId: Joi.number().integer().positive().optional()
}).or('address', 'degreeTypeId') // At least one field must be provided

/**
 * Validation schema for updating an employer profile
 */
const updateEmployerSchema = Joi.object({
  role: Joi.string().valid('hr').optional(),
  userId: Joi.number().integer().positive().required(),
  companyName: Joi.string().min(1).max(200).optional(),
  address: Joi.string().min(1).max(500).optional()
}).or('companyName', 'address') // At least one field must be provided

/**
 * Combined validation for create profile endpoint
 */
const createProfile = (req, res, next) => {
  const { role } = req.body
  
  let schema
  if (role === 'student') {
    schema = createStudentSchema
  } else if (role === 'hr') {
    schema = createEmployerSchema
  } else {
    return res.status(400).json({
      error: 'Invalid or missing role. Must be "student" or "hr"'
    })
  }
  
  const { error, value } = schema.validate(req.body)
  
  if (error) {
    return res.status(400).json({
      error: error.details[0].message
    })
  }
  
  req.body = value
  next()
}

/**
 * Combined validation for update profile endpoint
 */
const updateProfile = (req, res, next) => {
  const { role } = req.body
  
  // If role is not specified, we'll determine it from the existing profile
  // For now, validate common fields
  const baseSchema = Joi.object({
    role: Joi.string().valid('student', 'hr').optional(),
    userId: Joi.number().integer().positive().required()
  }).unknown(true) // Allow additional fields
  
  const { error: baseError } = baseSchema.validate(req.body)
  
  if (baseError) {
    return res.status(400).json({
      error: baseError.details[0].message
    })
  }
  
  // Validate role-specific fields if role is provided
  if (role) {
    let schema
    if (role === 'student') {
      schema = updateStudentSchema
    } else if (role === 'hr') {
      schema = updateEmployerSchema
    }
    
    const { error, value } = schema.validate(req.body)
    
    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      })
    }
    
    req.body = value
  }
  
  next()
}

module.exports = {
  createStudentSchema,
  createEmployerSchema,
  updateStudentSchema,
  updateEmployerSchema,
  createProfile,
  updateProfile
}