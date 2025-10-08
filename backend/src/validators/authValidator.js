/**
 * Validation schemas for authentication endpoints
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail (email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
function validatePassword (password) {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    }
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    }
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    }
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    }
  }

  return {
    isValid: true,
    message: 'Password is valid'
  }
}

/**
 * Validate login request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateLogin (req, res, next) {
  const { email, password } = req.body
  const errors = []

  if (!email) {
    errors.push('Email is required')
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format')
  }

  if (!password) {
    errors.push('Password is required')
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
 * Validate alumni registration request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateAlumniRegistration (req, res, next) {
  const { name, surname, email, password, degreeTypeId, address } = req.body
  const errors = []

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long')
  }

  if (!surname || surname.trim().length < 2) {
    errors.push('Surname must be at least 2 characters long')
  }

  if (!email) {
    errors.push('Email is required')
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format')
  }

  if (!password) {
    errors.push('Password is required')
  } else {
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      errors.push(passwordValidation.message)
    }
  }

  if (!degreeTypeId) {
    errors.push('Degree type is required')
  } else if (isNaN(parseInt(degreeTypeId))) {
    errors.push('Degree type must be a valid number')
  }

  if (!address || address.trim().length < 5) {
    errors.push('Address must be at least 5 characters long')
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
 * Validate enterprise registration request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateEnterpriseRegistration (req, res, next) {
  const { name, surname, email, password, companyName, address } = req.body
  const errors = []

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long')
  }

  if (!surname || surname.trim().length < 2) {
    errors.push('Surname must be at least 2 characters long')
  }

  if (!email) {
    errors.push('Email is required')
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format')
  }

  if (!password) {
    errors.push('Password is required')
  } else {
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      errors.push(passwordValidation.message)
    }
  }

  if (!companyName || companyName.trim().length < 2) {
    errors.push('Company name must be at least 2 characters long')
  }

  if (!address || address.trim().length < 5) {
    errors.push('Address must be at least 5 characters long')
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
 * Validate university staff registration request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateStaffRegistration (req, res, next) {
  const { name, surname, email, password, department } = req.body
  const errors = []

  // Check for missing required fields first
  if (!name || !surname || !email || !password || !department) {
    errors.push('All fields are required: name, surname, email, password, department')
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }

  if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long')
  }

  if (surname.trim().length < 2) {
    errors.push('Surname must be at least 2 characters long')
  }

  if (!isValidEmail(email)) {
    errors.push('Invalid email format')
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.message)
  }

  if (department.trim().length < 2) {
    errors.push('Department must be at least 2 characters long')
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
 * Validate admin registration request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateAdminRegistration (req, res, next) {
  const { name, surname, email, password } = req.body
  const errors = []

  // Check for missing required fields first
  if (!name || !surname || !email || !password) {
    errors.push('All fields are required: name, surname, email, password')
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    })
  }

  if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long')
  }

  if (surname.trim().length < 2) {
    errors.push('Surname must be at least 2 characters long')
  }

  if (!isValidEmail(email)) {
    errors.push('Invalid email format')
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.message)
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
  validateLogin,
  validateAlumniRegistration,
  validateEnterpriseRegistration,
  validateStaffRegistration,
  validateAdminRegistration,
  isValidEmail,
  validatePassword
}