const sessionService = require('../services/sessionService');
const { asyncErrorHandler } = require('../middlewares/errorHandler');

/**
 * Get all active sessions for current user
 * @route GET /api/auth/sessions
 * @access Private (authenticated users)
 */
const getUserSessions = asyncErrorHandler(async (req, res) => {
  const userId = req.user.id;

  const sessions = await sessionService.getUserSessions(userId);

  // Add current session indicator
  const currentDeviceId = sessionService.generateDeviceFingerprint(req);
  const sessionsWithCurrent = sessions.map(session => ({
    ...session,
    isCurrent: session.deviceId === currentDeviceId,
  }));

  res.json({
    success: true,
    data: {
      sessions: sessionsWithCurrent,
      totalSessions: sessions.length,
    },
  });
});

/**
 * Revoke a specific session
 * @route DELETE /api/auth/sessions/:sessionId
 * @access Private (authenticated users)
 */
const revokeSession = asyncErrorHandler(async (req, res) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      message: 'Session ID is required',
    });
  }

  // Verify session belongs to user
  const session = await sessionService.verifySession(sessionId, userId);
  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found or does not belong to you',
    });
  }

  // Delete session
  await sessionService.deleteSession(sessionId);

  res.json({
    success: true,
    message: 'Session revoked successfully',
  });
});

/**
 * Revoke all sessions for current user
 * @route DELETE /api/auth/sessions/all
 * @access Private (authenticated users)
 */
const revokeAllSessions = asyncErrorHandler(async (req, res) => {
  const userId = req.user.id;

  await sessionService.deleteAllUserSessions(userId);

  res.json({
    success: true,
    message: 'All sessions revoked successfully. Please log in again.',
  });
});

/**
 * Check if current session is still valid
 * @route GET /api/auth/session/status
 * @access Private (authenticated users)
 */
const checkSessionStatus = asyncErrorHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Get device fingerprint from request
  const deviceId = sessionService.generateDeviceFingerprint(req);
  
  // Find session by userId and deviceId
  const sessions = await sessionService.getUserSessions(userId);
  const currentSession = sessions.find(s => s.deviceId === deviceId);

  if (!currentSession) {
    return res.status(401).json({
      success: false,
      valid: false,
      message: 'Session has been revoked',
    });
  }

  res.json({
    success: true,
    valid: true,
    data: {
      sessionId: currentSession.id,
      lastActiveAt: currentSession.lastActiveAt,
    },
  });
});

/**
 * Update session activity (called by middleware on API requests)
 * @route POST /api/auth/session/activity
 * @access Private (authenticated users)
 */
const updateActivity = asyncErrorHandler(async (req, res) => {
  const userId = req.user.id;
  const deviceId = sessionService.generateDeviceFingerprint(req);
  
  // Find session by userId and deviceId
  const sessions = await sessionService.getUserSessions(userId);
  const currentSession = sessions.find(s => s.deviceId === deviceId);

  if (currentSession) {
    await sessionService.updateSessionActivity(currentSession.id);
  }

  res.json({
    success: true,
    message: 'Activity updated',
  });
});

module.exports = {
  getUserSessions,
  revokeSession,
  revokeAllSessions,
  checkSessionStatus,
  updateActivity,
};
