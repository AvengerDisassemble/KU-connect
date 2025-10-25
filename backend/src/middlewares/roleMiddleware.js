/**
 * Middleware to enforce role-based access control
 * @param {string|string[]} allowedRoles - Role(s) that are allowed to access the route
 * @returns {Function} Express middleware function
 */
function roleMiddleware (allowedRoles) {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  return (req, res, next) => {
    // Check if user is authenticated (should be set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    // Check if user's role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`
      })
    }

    next()
  }
}

/**
 * Middleware to ensure only verified users can access the route
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function verifiedUserMiddleware (req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    })
  }

  if (!req.user.verified) {
    return res.status(403).json({
      success: false,
      message: 'Account verification required'
    })
  }

  next()
}

/**
 * Middleware to ensure user owns the resource or is an admin
 * Use this for routes where users should only access their own data
 * @param {string} userIdParam - The parameter name containing the user ID (default: 'userId')
 * @returns {Function} Express middleware function
 */
function ownerOrAdminMiddleware (userIdParam = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    const resourceUserId = req.params[userIdParam]
    const isOwner = req.user.id === resourceUserId
    const isAdmin = req.user.role === 'ADMIN'

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      })
    }

    next()
  }
}

module.exports = {
  roleMiddleware,
  verifiedUserMiddleware,
  ownerOrAdminMiddleware
}