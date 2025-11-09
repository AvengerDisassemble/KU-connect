<<<<<<< HEAD
const bcrypt = require("bcrypt");
=======
const bcrypt = require('bcrypt')
const crypto = require('crypto')
>>>>>>> dev

/**
 * Hash a password using bcrypt
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} The hashed password
 */
async function hashPassword(password) {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Generate a secure random password
 * Password contains: uppercase, lowercase, numbers, and special characters
 * 
 * @param {number} length - Length of password (default: 12)
 * @returns {string} Secure random password
 * 
 * @example
 * const password = generateSecurePassword()
 * console.log(password) // "aB3$xY9!mN2p"
 */
function generateSecurePassword (length = 12) {
  // Character sets for password
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  // Combine all character sets
  const allChars = uppercase + lowercase + numbers + special
  
  // Ensure at least one character from each set
  let password = ''
  password += uppercase[crypto.randomInt(0, uppercase.length)]
  password += lowercase[crypto.randomInt(0, lowercase.length)]
  password += numbers[crypto.randomInt(0, numbers.length)]
  password += special[crypto.randomInt(0, special.length)]
  
  // Fill remaining length with random characters from all sets
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(0, allChars.length)]
  }
  
  // Shuffle the password to randomize position of required characters using Fisher-Yates algorithm
  const passwordArray = password.split('');
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }
  return passwordArray.join('');
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - The plain text password
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePassword,
<<<<<<< HEAD
};
=======
  generateSecurePassword
}
>>>>>>> dev
