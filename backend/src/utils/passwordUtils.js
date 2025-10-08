const bcrypt = require('bcrypt')

/**
 * Hash a password using bcrypt
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} The hashed password
 */
async function hashPassword (password) {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - The plain text password
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
async function comparePassword (password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

module.exports = {
  hashPassword,
  comparePassword
}