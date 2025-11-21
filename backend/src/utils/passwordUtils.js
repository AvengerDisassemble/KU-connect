const bcrypt = require('bcrypt')
const crypto = require('crypto')
const https = require('https')

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

/**
 * Check if password has been breached using HaveIBeenPwned API (k-anonymity model)
 * Uses SHA-1 hash prefix to search without sending the actual password
 * 
 * @param {string} password - The plain text password to check
 * @returns {Promise<boolean>} True if password has been breached, false if safe
 * 
 * @example
 * const isBreached = await isPasswordBreached('password123')
 * if (isBreached) {
 *   console.log('This password has been found in data breaches')
 * }
 */
async function isPasswordBreached(password) {
  try {
    // Hash the password with SHA-1
    const sha1Hash = crypto
      .createHash('sha1')
      .update(password)
      .digest('hex')
      .toUpperCase();
    
    // Split hash into prefix (first 5 chars) and suffix (rest)
    const hashPrefix = sha1Hash.substring(0, 5);
    const hashSuffix = sha1Hash.substring(5);
    
    // Query HaveIBeenPwned API with k-anonymity (only send first 5 chars)
    const apiUrl = `https://api.pwnedpasswords.com/range/${hashPrefix}`;
    
    return new Promise((resolve, reject) => {
      https.get(apiUrl, {
        headers: {
          'User-Agent': 'KU-Connect-App',
          'Add-Padding': 'true' // Request HIBP to add padding for extra privacy
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            // Parse response: each line is "SUFFIX:COUNT"
            const hashes = data.split('\r\n');
            
            // Check if our hash suffix appears in the list
            const found = hashes.some(line => {
              const [suffix] = line.split(':');
              return suffix === hashSuffix;
            });
            
            resolve(found);
          } else if (res.statusCode === 404) {
            // No matches found (password not breached)
            resolve(false);
          } else {
            // API error - fail open (allow password) rather than blocking legitimate users
            console.warn(`HaveIBeenPwned API returned status ${res.statusCode}. Allowing password.`);
            resolve(false);
          }
        });
      }).on('error', (err) => {
        // Network error - fail open to avoid blocking users during outages
        console.error('HaveIBeenPwned API error:', err.message);
        resolve(false);
      });
    });
  } catch (error) {
    // Any other error - fail open
    console.error('Password breach check error:', error.message);
    return false;
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  generateSecurePassword,
  isPasswordBreached
}
