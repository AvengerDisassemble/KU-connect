const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const prisma = require('../models/prisma');

/**
 * Generate MFA secret for user
 * @param {Object} user - User object with id, name, email
 * @returns {Promise<Object>} Contains secret and QR code data URL
 */
async function generateMfaSecret(user) {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `KU Connect (${user.email})`,
    issuer: 'KU Connect',
    length: 32
  });

  // Generate QR code as data URL
  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32, // Store this encrypted in database
    qrCode: qrCodeDataUrl,
    otpauthUrl: secret.otpauth_url
  };
}

/**
 * Verify MFA token
 * @param {string} secret - Base32 encoded secret
 * @param {string} token - 6-digit code from authenticator app
 * @param {number} window - Time window for validation (default: 1 = ±30 seconds)
 * @returns {boolean} True if token is valid
 */
function verifyMfaToken(secret, token, window = 1) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: window // Allow 1 step before/after (±30 seconds)
  });
}

/**
 * Generate recovery codes for MFA backup
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of 10 recovery codes
 */
async function generateRecoveryCodes(userId) {
  const codes = [];
  const recoveryCodeRecords = [];

  // Generate 10 recovery codes
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);

    recoveryCodeRecords.push({
      userId,
      code: await hashRecoveryCode(code), // Store hashed version
      used: false
    });
  }

  // Store recovery codes in database
  await prisma.recoveryCode.createMany({
    data: recoveryCodeRecords
  });

  return codes; // Return plaintext codes to show user ONCE
}

/**
 * Hash recovery code for secure storage
 * @param {string} code - Plain text recovery code
 * @returns {Promise<string>} Hashed recovery code
 */
async function hashRecoveryCode(code) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify recovery code and mark as used
 * @param {string} userId - User ID
 * @param {string} code - Plain text recovery code
 * @returns {Promise<boolean>} True if code is valid and not used
 */
async function verifyRecoveryCode(userId, code) {
  const hashedCode = await hashRecoveryCode(code);

  // Find unused recovery code
  const recoveryCode = await prisma.recoveryCode.findFirst({
    where: {
      userId,
      code: hashedCode,
      used: false
    }
  });

  if (!recoveryCode) {
    return false;
  }

  // Mark code as used
  await prisma.recoveryCode.update({
    where: { id: recoveryCode.id },
    data: {
      used: true,
      usedAt: new Date()
    }
  });

  return true;
}

/**
 * Enable MFA for user
 * @param {string} userId - User ID
 * @param {string} secret - Base32 encoded TOTP secret
 * @returns {Promise<Object>} Updated user and recovery codes
 */
async function enableMfa(userId, secret) {
  // Generate recovery codes
  const recoveryCodes = await generateRecoveryCodes(userId);

  // Update user to enable MFA
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaSecret: secret, // TODO: Encrypt this in production
      mfaEnrolledAt: new Date()
    },
    select: {
      id: true,
      email: true,
      mfaEnabled: true,
      mfaEnrolledAt: true
    }
  });

  return {
    user,
    recoveryCodes // Show these ONCE to the user
  };
}

/**
 * Disable MFA for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated user
 */
async function disableMfa(userId) {
  // Delete all recovery codes
  await prisma.recoveryCode.deleteMany({
    where: { userId }
  });

  // Update user to disable MFA
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
      mfaEnrolledAt: null
    },
    select: {
      id: true,
      email: true,
      mfaEnabled: true
    }
  });

  return user;
}

/**
 * Check if user has MFA enabled
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if MFA is enabled
 */
async function isMfaEnabled(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mfaEnabled: true }
  });

  return user?.mfaEnabled || false;
}

/**
 * Get count of remaining recovery codes
 * @param {string} userId - User ID
 * @returns {Promise<number>} Number of unused recovery codes
 */
async function getRemainingRecoveryCodesCount(userId) {
  return await prisma.recoveryCode.count({
    where: {
      userId,
      used: false
    }
  });
}

module.exports = {
  generateMfaSecret,
  verifyMfaToken,
  generateRecoveryCodes,
  verifyRecoveryCode,
  enableMfa,
  disableMfa,
  isMfaEnabled,
  getRemainingRecoveryCodesCount
};
