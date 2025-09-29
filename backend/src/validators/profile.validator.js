/**
 * @module validators/profile.validator
 * @description Validation schemas for profile operations
 */

const Joi = require('joi')

const industryValues = [
  'IT_HARDWARE_AND_DEVICES',
  'IT_SOFTWARE',
  'IT_SERVICES',
  'NETWORK_SERVICES',
  'EMERGING_TECH',
  'E_COMMERCE',
  'OTHER'
]

const companySizeValues = [
  'ONE_TO_TEN',
  'ELEVEN_TO_FIFTY',
  'FIFTY_ONE_TO_TWO_HUNDRED',
  'TWO_HUNDRED_PLUS'
]

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
})

/**
 * Validation schema for updating a user profile
 */
const baseUpdateSchema = {
  username: Joi.string().alphanum().min(3).max(30).optional(),
  name: Joi.string().max(100).optional(),
  surname: Joi.string().max(100).optional(),
  phoneNumber: Joi.string().pattern(/^[0-9+\-()\s]+$/).optional().allow(null, ''),
}

/**
 * Validation schema for updating a student profile
 */
const updateStudentSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  ...baseUpdateSchema,
  address: Joi.string().max(500).optional(),
  degreeTypeId: Joi.number().integer().positive().optional(),
  gpa: Joi.number().min(0).max(4).precision(2).optional(),
  expectedGraduationYear: Joi.number()
    .integer()
    .min(new Date().getFullYear())
    .max(new Date().getFullYear() + 20)
    .optional()
}).or(
  'username',
  'name',
  'surname',
  'phoneNumber',
  'address',
  'degreeTypeId',
  'gpa',
  'expectedGraduationYear'
)

/**
 * Validation schema for updating an employer profile
 */
const updateEmployerSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  ...baseUpdateSchema,
  companyName: Joi.string().max(255).optional(),
  address: Joi.string().max(255).optional(),
  industry: Joi.string().valid(...industryValues).optional(),
  companySize: Joi.string().valid(...companySizeValues).optional(),
  website: Joi.string().uri().optional().allow(null, '')
}).or(
  'username',
  'name',
  'surname',
  'phoneNumber',
  'companyName',
  'address',
  'industry',
  'companySize',
  'website'
)

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
 *
 * Behavior:
 *  - Validates base presence of userId.
 *  - If role is provided, validate against role-specific update schema.
 *  - If role is NOT provided, query DB to determine whether the user has a student or hr profile,
 *    then validate against the corresponding schema.
 */

const updateProfile = async (req, res, next) => {
  const incomingRole = req.body.role // may be undefined
  const baseSchema = Joi.object({
    role: Joi.string().valid('student', 'hr').optional(),
    userId: Joi.number().integer().positive().required()
  }).unknown(true) // allow other fields; we'll validate them specifically below

  const { error: baseError } = baseSchema.validate(req.body)

  if (baseError) {
    return res.status(400).json({
      error: baseError.details[0].message
    })
  }

  const userId = Number(req.body.userId)
  let role = incomingRole

  try {
    // If role is not provided, determine it from DB
    if (!role) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { student: true, hr: true }
      })

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      if (user.student) role = 'student'
      else if (user.hr) role = 'hr'
      else {
        return res.status(400).json({ error: 'User has no student or hr profile to update' })
      }
    }

    // Validate against the appropriate schema now that we have a role
    let schema
    if (role === 'student') schema = updateStudentSchema
    else if (role === 'hr') schema = updateEmployerSchema

    const { error, value } = schema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      })
    }

    // validated payload (value) will contain only allowed keys
    req.body = value
    next()
  } catch (err) {
    console.error('updateProfile validator error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = {
  createStudentSchema,
  createEmployerSchema,
  updateStudentSchema,
  updateEmployerSchema,
  createProfile,
  updateProfile
}
