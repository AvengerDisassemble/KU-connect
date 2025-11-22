const prisma = require('../models/prisma');
const crypto = require('crypto');

const MAX_CONCURRENT_SESSIONS = 3;

/**
 * Generate device fingerprint from request
 * @param {Object} req - Express request object
 * @returns {string} Device fingerprint hash
 */
function generateDeviceFingerprint(req) {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Create fingerprint from headers
  const fingerprintString = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  
  return crypto.createHash('sha256').update(fingerprintString).digest('hex');
}

/**
 * Create new session for user
 * @param {string} userId - User ID
 * @param {Object} req - Express request object
 * @returns {Promise<Object>} Created session
 */
async function createSession(userId, req) {
  const deviceId = generateDeviceFingerprint(req);
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Check existing sessions count
  const activeSessions = await prisma.session.count({
    where: { userId }
  });

  // If max sessions reached, delete oldest session
  if (activeSessions >= MAX_CONCURRENT_SESSIONS) {
    const oldestSession = await prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    if (oldestSession) {
      await prisma.session.delete({
        where: { id: oldestSession.id }
      });
    }
  }

  // Create new session
  const session = await prisma.session.create({
    data: {
      userId,
      deviceId,
      ipAddress,
      userAgent,
      lastActiveAt: new Date()
    }
  });

  return session;
}

/**
 * Update session last active time
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Updated session
 */
async function updateSessionActivity(sessionId) {
  return await prisma.session.update({
    where: { id: sessionId },
    data: {
      lastActiveAt: new Date()
    }
  });
}

/**
 * Delete session (logout)
 * @param {string} sessionId - Session ID
 * @returns {Promise<void>}
 */
async function deleteSession(sessionId) {
  await prisma.session.delete({
    where: { id: sessionId }
  });
}

/**
 * Delete all sessions for user (logout all devices)
 * @param {string} userId - User ID
 * @returns {Promise<number>} Count of deleted sessions
 */
async function deleteAllUserSessions(userId) {
  const result = await prisma.session.deleteMany({
    where: { userId }
  });

  return result.count;
}

/**
 * Get all active sessions for user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of sessions
 */
async function getUserSessions(userId) {
  return await prisma.session.findMany({
    where: { userId },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      id: true,
      deviceId: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      lastActiveAt: true
    }
  });
}

/**
 * Verify session exists and is valid
 * @param {string} sessionId - Session ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if session is valid
 */
async function verifySession(sessionId, userId) {
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      userId
    }
  });

  return !!session;
}

/**
 * Clean up inactive sessions (older than 30 days)
 * @returns {Promise<number>} Count of deleted sessions
 */
async function cleanupInactiveSessions() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await prisma.session.deleteMany({
    where: {
      lastActiveAt: {
        lt: thirtyDaysAgo
      }
    }
  });

  return result.count;
}

/**
 * Check if device is new for user
 * @param {string} userId - User ID
 * @param {string} deviceId - Device fingerprint
 * @returns {Promise<boolean>} True if device is new
 */
async function isNewDevice(userId, deviceId) {
  const existingSession = await prisma.session.findFirst({
    where: {
      userId,
      deviceId
    }
  });

  return !existingSession;
}

module.exports = {
  generateDeviceFingerprint,
  createSession,
  updateSessionActivity,
  deleteSession,
  deleteAllUserSessions,
  getUserSessions,
  verifySession,
  cleanupInactiveSessions,
  isNewDevice,
  MAX_CONCURRENT_SESSIONS
};
