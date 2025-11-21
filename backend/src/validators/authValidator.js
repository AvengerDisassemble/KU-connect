/**
 * Validation schemas for authentication endpoints
 */
const { isPasswordBreached } = require('../utils/passwordUtils');

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
  // Use a more efficient regex pattern that avoids ReDoS vulnerability
  // This pattern is simpler and doesn't have nested quantifiers that can cause catastrophic backtracking
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
function validatePassword(password) {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/(?=.*\d)/.test(password)) {
    return {
      isValid: false,
      message: "Password must contain at least one number",
    };
  }

  return {
    isValid: true,
    message: "Password is valid",
  };
}

/**
 * Validate password strength and check if it's been breached (async version)
 * @param {string} password - Password to validate
 * @returns {Promise<Object>} Validation result with isValid and message
 */
async function validatePasswordWithBreachCheck(password) {
  // First check password strength
  const strengthCheck = validatePassword(password);
  if (!strengthCheck.isValid) {
    return strengthCheck;
  }

  // Then check if password has been breached
  const breached = await isPasswordBreached(password);
  if (breached) {
    return {
      isValid: false,
      message: "This password has been found in data breaches and cannot be used. Please choose a different password.",
    };
  }

  return {
    isValid: true,
    message: "Password is valid",
  };
}

/**
 * Validate login request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push("Email is required");
  } else if (!isValidEmail(email)) {
    errors.push("Invalid email format");
  }

  if (!password) {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
}

/**
 * Validate alumni registration request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function validateAlumniRegistration(req, res, next) {
  const { name, surname, email, password, degreeTypeId, address } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (!surname || surname.trim().length < 2) {
    errors.push("Surname must be at least 2 characters long");
  }

  if (!email) {
    errors.push("Email is required");
  } else if (!isValidEmail(email)) {
    errors.push("Invalid email format");
  }

  if (!password) {
    errors.push("Password is required");
  } else {
    const passwordValidation = await validatePasswordWithBreachCheck(password);
    if (!passwordValidation.isValid) {
      errors.push(passwordValidation.message);
    }
  }

  if (
    !degreeTypeId ||
    typeof degreeTypeId !== "string" ||
    degreeTypeId.trim().length === 0
  ) {
    errors.push("Degree type is required and must be a valid ID");
  }

  if (!address || address.trim().length < 5) {
    errors.push("Address must be at least 5 characters long");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
}

/**
 * Validate enterprise registration request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function validateEnterpriseRegistration(req, res, next) {
  const { name, surname, email, password, companyName, address, phoneNumber } =
    req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (!surname || surname.trim().length < 2) {
    errors.push("Surname must be at least 2 characters long");
  }

  if (!email) {
    errors.push("Email is required");
  } else if (!isValidEmail(email)) {
    errors.push("Invalid email format");
  }

  if (!password) {
    errors.push("Password is required");
  } else {
    const passwordValidation = await validatePasswordWithBreachCheck(password);
    if (!passwordValidation.isValid) {
      errors.push(passwordValidation.message);
    }
  }

  if (!companyName || companyName.trim().length < 2) {
    errors.push("Company name must be at least 2 characters long");
  }

  if (!address || address.trim().length < 5) {
    errors.push("Address must be at least 5 characters long");
  }

  if (!phoneNumber) {
    errors.push("Phone number is required");
  } else if (!/^[0-9+\-()\s]{8,15}$/.test(phoneNumber)) {
    errors.push(
      "Phone number must be 8-15 characters and contain only numbers, +, -, (), and spaces",
    );
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
}

/**
 * Validate university staff registration request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function validateStaffRegistration(req, res, next) {
  const { name, surname, email, password, department } = req.body;
  const errors = [];

  // Check for missing required fields first
  if (!name || !surname || !email || !password || !department) {
    errors.push(
      "All fields are required: name, surname, email, password, department",
    );
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  if (name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (surname.trim().length < 2) {
    errors.push("Surname must be at least 2 characters long");
  }

  if (!isValidEmail(email)) {
    errors.push("Invalid email format");
  }

  const passwordValidation = await validatePasswordWithBreachCheck(password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.message);
  }

  if (department.trim().length < 2) {
    errors.push("Department must be at least 2 characters long");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
}

/**
 * Validate admin registration request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function validateAdminRegistration(req, res, next) {
  const { name, surname, email, password } = req.body;
  const errors = [];

  // Check for missing required fields first
  if (!name || !surname || !email || !password) {
    errors.push("All fields are required: name, surname, email, password");
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  if (name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  if (surname.trim().length < 2) {
    errors.push("Surname must be at least 2 characters long");
  }

  if (!isValidEmail(email)) {
    errors.push("Invalid email format");
  }

  const passwordValidation = await validatePasswordWithBreachCheck(password);
  if (!passwordValidation.isValid) {
    errors.push(passwordValidation.message);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  next();
}

module.exports = {
  validateLogin,
  validateAlumniRegistration,
  validateEnterpriseRegistration,
  validateStaffRegistration,
  validateAdminRegistration,
  isValidEmail,
  validatePassword,
  validatePasswordWithBreachCheck,
};
