const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../../middlewares/authMiddleware");
const { roleMiddleware } = require("../../middlewares/roleMiddleware");
const { strictLimiter, writeLimiter } = require("../../middlewares/rateLimitMiddleware");
const {
  validateUserId,
  validateJobIdInBody,
  handleValidationResult,
} = require("../../validators/savedValidators");
const {
  getSaved,
  postSaved,
  deleteSaved,
} = require("../../controllers/savedController");

// Routes are mounted at /save-jobs by routes registrar
// Define the :user_id parameter here

/**
 * GET /save-jobs/:user_id/saved
 * @access Private - STUDENT only
 * Rate limited: strictLimiter - Read operations with database joins can be expensive
 */
router.get(
  "/:user_id/saved",
  [
    authMiddleware,
    roleMiddleware(['STUDENT']),
    strictLimiter,
    validateUserId,
    handleValidationResult
  ],
  getSaved,
);

/**
 * POST /save-jobs/:user_id/saved
 * @access Private - STUDENT only
 * Rate limited: writeLimiter - Write operation to prevent spam
 */
router.post(
  "/:user_id/saved",
  [
    authMiddleware,
    roleMiddleware(['STUDENT']),
    writeLimiter,
    validateUserId,
    validateJobIdInBody,
    handleValidationResult,
  ],
  postSaved,
);

/**
 * DELETE /save-jobs/:user_id/saved
 * @access Private - STUDENT only
 * Rate limited: writeLimiter - Write operation to prevent spam
 */
router.delete(
  "/:user_id/saved",
  [
    authMiddleware,
    roleMiddleware(['STUDENT']),
    writeLimiter,
    validateUserId,
    validateJobIdInBody,
    handleValidationResult,
  ],
  deleteSaved,
);

module.exports = router;
