/**
 * @file src/validators/adminValidator.js
 * @description Validation middleware for admin endpoints
 */

/**
 * Validate announcement creation data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateAnnouncementCreate (req, res, next) {
  const { title, content, audience, priority, expiresAt } = req.body
  const errors = []

  // Validate title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string')
  } else if (title.length > 200) {
    errors.push('Title must not exceed 200 characters')
  }

  // Validate content
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    errors.push('Content is required and must be a non-empty string')
  } else if (content.length > 5000) {
    errors.push('Content must not exceed 5000 characters')
  }

  // Validate audience
  const validAudiences = ['ALL', 'STUDENTS', 'EMPLOYERS', 'PROFESSORS', 'ADMINS']
  if (!audience) {
    errors.push('Audience is required')
  } else if (!validAudiences.includes(audience)) {
    errors.push(`Audience must be one of: ${validAudiences.join(', ')}`)
  }

  // Validate priority (optional)
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH']
  if (priority && !validPriorities.includes(priority)) {
    errors.push(`Priority must be one of: ${validPriorities.join(', ')}`)
  }

  // Validate expiresAt (optional)
  if (expiresAt) {
    const expirationDate = new Date(expiresAt)
    if (isNaN(expirationDate.getTime())) {
      errors.push('expiresAt must be a valid date')
    } else if (expirationDate <= new Date()) {
      errors.push('expiresAt must be in the future')
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }

  next()
}

/**
 * Validate announcement update data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateAnnouncementUpdate (req, res, next) {
  const { title, content, audience, priority, isActive, expiresAt } = req.body
  const errors = []

  // At least one field must be provided
  if (title === undefined && content === undefined && audience === undefined &&
      priority === undefined && isActive === undefined && expiresAt === undefined) {
    return res.status(400).json({
      success: false,
      message: 'At least one field must be provided for update'
    })
  }

  // Validate title if provided
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('Title must be a non-empty string')
    } else if (title.length > 200) {
      errors.push('Title must not exceed 200 characters')
    }
  }

  // Validate content if provided
  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim().length === 0) {
      errors.push('Content must be a non-empty string')
    } else if (content.length > 5000) {
      errors.push('Content must not exceed 5000 characters')
    }
  }

  // Validate audience if provided
  const validAudiences = ['ALL', 'STUDENTS', 'EMPLOYERS', 'PROFESSORS', 'ADMINS']
  if (audience !== undefined && !validAudiences.includes(audience)) {
    errors.push(`Audience must be one of: ${validAudiences.join(', ')}`)
  }

  // Validate priority if provided
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH']
  if (priority !== undefined && !validPriorities.includes(priority)) {
    errors.push(`Priority must be one of: ${validPriorities.join(', ')}`)
  }

  // Validate isActive if provided
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push('isActive must be a boolean')
  }

  // Validate expiresAt if provided
  if (expiresAt !== undefined && expiresAt !== null) {
    const expirationDate = new Date(expiresAt)
    if (isNaN(expirationDate.getTime())) {
      errors.push('expiresAt must be a valid date or null')
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }

  next()
}

/**
 * Validate user list query parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateUserListQuery (req, res, next) {
  const { status, role, page, limit } = req.query
  const errors = []

  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']
  const validRoles = ['STUDENT', 'PROFESSOR', 'EMPLOYER', 'ADMIN']

  // Validate status if provided
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`)
  }

  // Validate role if provided
  if (role && !validRoles.includes(role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`)
  }

  // Validate page if provided
  if (page) {
    const pageNum = parseInt(page)
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer')
    }
  }

  // Validate limit if provided
  if (limit) {
    const limitNum = parseInt(limit)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be a positive integer between 1 and 100')
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }

  next()
}

/**
 * Validate userId parameter
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateUserId (req, res, next) {
  const { userId } = req.params

  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    })
  }

  next()
}

/**
 * Validate announcement search/filter data (POST body)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateAnnouncementSearch (req, res, next) {
  const { audience, isActive, search, startDate, endDate, page, limit } = req.body
  const errors = []

  const validAudiences = ['ALL', 'STUDENTS', 'EMPLOYERS', 'PROFESSORS', 'ADMINS']

  // Validate audience if provided
  if (audience && !validAudiences.includes(audience)) {
    errors.push(`Audience must be one of: ${validAudiences.join(', ')}`)
  }

  // Validate isActive if provided
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push('isActive must be a boolean')
  }

  // Validate search if provided
  if (search && typeof search !== 'string') {
    errors.push('Search must be a string')
  }

  // Validate startDate if provided
  if (startDate) {
    const start = new Date(startDate)
    if (isNaN(start.getTime())) {
      errors.push('startDate must be a valid date')
    }
  }

  // Validate endDate if provided
  if (endDate) {
    const end = new Date(endDate)
    if (isNaN(end.getTime())) {
      errors.push('endDate must be a valid date')
    }
  }

  // Validate date range
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start > end) {
      errors.push('startDate must be before endDate')
    }
  }

  // Validate page if provided
  if (page !== undefined) {
    const pageNum = parseInt(page)
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer')
    }
  }

  // Validate limit if provided
  if (limit !== undefined) {
    const limitNum = parseInt(limit)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be a positive integer between 1 and 100')
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }

  next()
}

/**
 * Validate user search/filter data (POST body)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateUserSearch (req, res, next) {
  const { role, status, search, startDate, endDate, page, limit } = req.body
  const errors = []

  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']
  const validRoles = ['STUDENT', 'PROFESSOR', 'EMPLOYER', 'ADMIN']

  // Validate role if provided
  if (role && !validRoles.includes(role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`)
  }

  // Validate status if provided
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`)
  }

  // Validate search if provided
  if (search && typeof search !== 'string') {
    errors.push('Search must be a string')
  }

  // Validate startDate if provided
  if (startDate) {
    const start = new Date(startDate)
    if (isNaN(start.getTime())) {
      errors.push('startDate must be a valid date')
    }
  }

  // Validate endDate if provided
  if (endDate) {
    const end = new Date(endDate)
    if (isNaN(end.getTime())) {
      errors.push('endDate must be a valid date')
    }
  }

  // Validate date range
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (start > end) {
      errors.push('startDate must be before endDate')
    }
  }

  // Validate page if provided
  if (page !== undefined) {
    const pageNum = parseInt(page)
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer')
    }
  }

  // Validate limit if provided
  if (limit !== undefined) {
    const limitNum = parseInt(limit)
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be a positive integer between 1 and 100')
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }

  next()
}

/**
 * Validate professor creation data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateProfessorCreate (req, res, next) {
  const {
    name,
    surname,
    email,
    department,
    password,
    phoneNumber,
    officeLocation,
    title,
    sendWelcomeEmail
  } = req.body

  const errors = []

  // Validate name (required)
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string')
  } else if (name.length < 2 || name.length > 100) {
    errors.push('Name must be between 2 and 100 characters')
  }

  // Validate surname (required)
  if (!surname || typeof surname !== 'string' || surname.trim().length === 0) {
    errors.push('Surname is required and must be a non-empty string')
  } else if (surname.length < 2 || surname.length > 100) {
    errors.push('Surname must be between 2 and 100 characters')
  }

  // Validate email (required)
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push('Email is required')
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push('Email must be a valid email address')
    }
  }

  // Validate department (required)
  if (!department || typeof department !== 'string' || department.trim().length === 0) {
    errors.push('Department is required and must be a non-empty string')
  } else if (department.length < 2 || department.length > 200) {
    errors.push('Department must be between 2 and 200 characters')
  }

  // Validate password (optional, but must meet requirements if provided)
  if (password !== undefined && password !== null && password !== '') {
    if (typeof password !== 'string') {
      errors.push('Password must be a string')
    } else if (password.length < 8 || password.length > 100) {
      errors.push('Password must be between 8 and 100 characters')
    } else {
      // Check password complexity
      const hasUppercase = /[A-Z]/.test(password)
      const hasLowercase = /[a-z]/.test(password)
      const hasNumber = /\d/.test(password)

      if (!hasUppercase || !hasLowercase || !hasNumber) {
        errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number')
      }
    }
  }

  // Validate phoneNumber (optional)
  if (phoneNumber !== undefined && phoneNumber !== null && phoneNumber !== '') {
    if (typeof phoneNumber !== 'string') {
      errors.push('Phone number must be a string')
    } else if (phoneNumber.length > 20) {
      errors.push('Phone number must not exceed 20 characters')
    }
  }

  // Validate officeLocation (optional)
  if (officeLocation !== undefined && officeLocation !== null && officeLocation !== '') {
    if (typeof officeLocation !== 'string') {
      errors.push('Office location must be a string')
    } else if (officeLocation.length > 200) {
      errors.push('Office location must not exceed 200 characters')
    }
  }

  // Validate title (optional)
  if (title !== undefined && title !== null && title !== '') {
    if (typeof title !== 'string') {
      errors.push('Title must be a string')
    } else if (title.length > 100) {
      errors.push('Title must not exceed 100 characters')
    }
  }

  // Validate sendWelcomeEmail (optional)
  if (sendWelcomeEmail !== undefined && typeof sendWelcomeEmail !== 'boolean') {
    errors.push('sendWelcomeEmail must be a boolean')
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }

  next()
}

module.exports = {
  validateAnnouncementCreate,
  validateAnnouncementUpdate,
  validateUserListQuery,
  validateUserId,
  validateAnnouncementSearch,
  validateUserSearch,
  validateProfessorCreate
}

