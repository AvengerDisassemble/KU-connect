const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Environment variables (should be set in .env)
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

// Cookie encryption key - MUST be 32 bytes for AES-256
// In production, this MUST be set in environment variables
const COOKIE_ENCRYPTION_KEY = process.env.COOKIE_ENCRYPTION_KEY 
  ? Buffer.from(process.env.COOKIE_ENCRYPTION_KEY, 'hex')
  : crypto.randomBytes(32); // Fallback for development only

// Warn if using fallback key
if (!process.env.COOKIE_ENCRYPTION_KEY) {
  console.warn('⚠️  WARNING: COOKIE_ENCRYPTION_KEY not set in environment. Using random key (will break on server restart).');
  console.warn('⚠️  Generate a key with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"');
}

/**
 * Generate an access token
 * @param {Object} payload - The payload to include in the token
 * @param {string} payload.id - User ID
 * @param {string} payload.role - User role
 * @returns {string} The access token
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generate a refresh token
 * @param {Object} payload - The payload to include in the token
 * @param {string} payload.id - User ID
 * @param {string} payload.jti - JWT ID for token identification
 * @returns {string} The refresh token
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Verify an access token
 * @param {string} token - The token to verify
 * @returns {Object|null} The decoded payload if valid, null otherwise
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Verify a refresh token
 * @param {string} token - The token to verify
 * @returns {Object|null} The decoded payload if valid, null otherwise
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Generate a unique JWT ID
 * @returns {string} A unique identifier
 */
function generateJwtId() {
  return crypto.randomUUID();
}

/**
 * Calculate expiration date for refresh token
 * @returns {Date} Expiration date (7 days from now)
 */
function getRefreshTokenExpiry() {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  return expiryDate;
}

/**
 * Encrypt a token for secure cookie storage using AES-256-GCM
 * @param {string} token - The plain JWT token to encrypt
 * @returns {string} Encrypted token in format: iv:authTag:encryptedData (all hex-encoded)
 * @throws {Error} If encryption fails
 */
function encryptToken(token) {
  try {
    // Generate a random initialization vector (IV) for each encryption
    const iv = crypto.randomBytes(16);
    
    // Create cipher using AES-256-GCM (authenticated encryption)
    const cipher = crypto.createCipheriv('aes-256-gcm', COOKIE_ENCRYPTION_KEY, iv);
    
    // Encrypt the token
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag (ensures data integrity)
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Return IV:authTag:encryptedData format
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (error) {
    console.error('Token encryption failed:', error.message);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt a token from secure cookie storage
 * @param {string} encryptedToken - The encrypted token in format: iv:authTag:encryptedData
 * @returns {string|null} The decrypted JWT token, or null if decryption fails
 */
function decryptToken(encryptedToken) {
  try {
    // Validate input
    if (!encryptedToken || typeof encryptedToken !== 'string') {
      return null;
    }
    
    // Split the encrypted token into its components
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
      console.error('Invalid encrypted token format');
      return null;
    }
    
    const [ivHex, authTagHex, encryptedData] = parts;
    
    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', COOKIE_ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the token
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error.message);
    return null;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateJwtId,
  getRefreshTokenExpiry,
  encryptToken,
  decryptToken,
};
