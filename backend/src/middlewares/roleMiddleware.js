const prisma = require('../models/prisma');

/**
 * Middleware to enforce role-based access control
 * @param {string|string[]} allowedRoles - Role(s) that are allowed to access the route
 * @returns {Function} Express middleware function
 */
function roleMiddleware(allowedRoles) {
  // Normalize to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res, next) => {
    // Check if user is authenticated (should be set by authMiddleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check if user's role is allowed
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(", ")}`,
      });
    }

    // Check if admin user has MFA enabled (enforcement)
    if (req.user.role === 'ADMIN') {
      try {
        const user = await prisma.user.findUnique({
          where: { id: req.user.id },
          select: {
            mfaEnabled: true,
            mfaGracePeriodEnds: true,
            createdAt: true,
          },
        });

        if (!user) {
          return res.status(401).json({
            success: false,
            message: "User not found",
          });
        }

        // Check if MFA is not enabled
        if (!user.mfaEnabled) {
          const now = new Date();
          
          // Set grace period if not set (7 days from account creation)
          if (!user.mfaGracePeriodEnds) {
            const gracePeriodEnds = new Date(user.createdAt);
            gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 7);
            
            await prisma.user.update({
              where: { id: req.user.id },
              data: { mfaGracePeriodEnds: gracePeriodEnds },
            });

            // Check if grace period has passed
            if (now > gracePeriodEnds) {
              return res.status(403).json({
                success: false,
                message: "MFA is required for admin accounts. Please enable MFA to access admin features.",
                mfaRequired: true,
              });
            } else {
              // Add warning header for remaining grace period
              const daysRemaining = Math.ceil((gracePeriodEnds - now) / (1000 * 60 * 60 * 24));
              res.setHeader('X-MFA-Warning', `MFA required in ${daysRemaining} day(s)`);
            }
          } else if (now > user.mfaGracePeriodEnds) {
            // Grace period has expired
            return res.status(403).json({
              success: false,
              message: "MFA is required for admin accounts. Please enable MFA to access admin features.",
              mfaRequired: true,
            });
          } else {
            // Grace period still active
            const daysRemaining = Math.ceil((user.mfaGracePeriodEnds - now) / (1000 * 60 * 60 * 24));
            res.setHeader('X-MFA-Warning', `MFA required in ${daysRemaining} day(s)`);
          }
        }
      } catch (error) {
        console.error('Error checking MFA status:', error);
        // Continue without blocking on error
      }
    }

    next();
  };
}

/**
 * Middleware to ensure only verified users can access the route
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function verifiedUserMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.user.verified) {
    return res.status(403).json({
      success: false,
      message: "Account verification required",
    });
  }

  next();
}

/**
 * Middleware to ensure user owns the resource or is an admin
 * Use this for routes where users should only access their own data
 * @param {string} userIdParam - The parameter name containing the user ID (default: 'userId')
 * @returns {Function} Express middleware function
 */
function ownerOrAdminMiddleware(userIdParam = "userId") {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const resourceUserId = req.params[userIdParam];
    const isOwner = req.user.id === resourceUserId;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only access your own resources.",
      });
    }

    next();
  };
}

module.exports = {
  roleMiddleware,
  verifiedUserMiddleware,
  ownerOrAdminMiddleware,
};
