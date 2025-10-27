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

module.exports = {
  validateAnnouncementCreate,
  validateAnnouncementUpdate,
  validateUserListQuery,
  validateUserId
}

