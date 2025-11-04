const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Environment variables (should be set in .env)
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "your-refresh-token-secret";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";

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

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateJwtId,
  getRefreshTokenExpiry,
};
