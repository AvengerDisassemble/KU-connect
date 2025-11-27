const { verifyAccessToken, decryptToken } = require("../utils/tokenUtils");
const { getUserById } = require("../services/authService");
const { serializeError, withContext } = require("../utils/logger");

/**
 * Middleware to authenticate requests using JWT tokens
 * Verifies the access token and attaches user info to req.user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function authMiddleware(req, res, next) {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies?.accessToken;
    
    // If token is from cookie, it's encrypted - decrypt it
    if (token) {
      token = decryptToken(token);
      if (!token) {
        return res.status(401).json({
          success: false,
          message: "Invalid access token",
        });
      }
    }

    // If no token from cookie, check Authorization header (Bearer token)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token required",
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
    }

    // Get user info and attach to request
    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Block SUSPENDED users from all access
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Account suspended. Please contact admin.',
        data: { status: 'SUSPENDED' }
      });
    }

    // PENDING, APPROVED, and REJECTED users can proceed
    // (REJECTED users have same access as PENDING - can browse but not interact)
    req.user = user;
    next();
  } catch (error) {
    const scopedLog =
      req?.log ||
      withContext({
        correlationId: req?.correlationId,
        path: req?.originalUrl,
      });
    scopedLog("error", "auth.middleware.error", {
      userId: req?.user?.id,
      ip: req.ip,
      error: serializeError(error),
    });
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * Optional middleware for routes that can work with or without authentication
 * Attaches user info to req.user if token is valid, but doesn't block if invalid
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function optionalAuthMiddleware(req, res, next) {
  try {
    // Get token from cookies or Authorization header
    let token = req.cookies?.accessToken;
    
    // If token is from cookie, it's encrypted - decrypt it
    if (token) {
      token = decryptToken(token);
    }

    // If no token from cookie, check Authorization header (Bearer token)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        const user = await getUserById(decoded.id);
        if (user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Log error but don't block request
    const scopedLog =
      req?.log ||
      withContext({
        correlationId: req?.correlationId,
        path: req?.originalUrl,
      });
    scopedLog("warn", "auth.optional_middleware.error", {
      ip: req.ip,
      error: serializeError(error),
    });
    next();
  }
}

/**
 * Middleware to ensure user account is verified (APPROVED status)
 * Must be used AFTER authMiddleware
 * Blocks PENDING, REJECTED, and SUSPENDED users from write operations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function verifiedUserMiddleware (req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.status !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      message: 'This action requires account verification.',
      data: {
        currentStatus: req.user.status,
        action: req.user.status === 'REJECTED'
          ? 'Please contact admin or resubmit verification'
          : 'Please wait for admin approval'
      }
    });
  }

  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  verifiedUserMiddleware
};
