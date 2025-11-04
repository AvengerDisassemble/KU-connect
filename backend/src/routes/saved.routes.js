const express = require("express");
const router = express.Router();

const {
  validateUserId,
  validateJobIdInBody,
  handleValidationResult,
} = require("../validators/savedValidators");
const {
  getSaved,
  postSaved,
  deleteSaved,
} = require("../controllers/savedController");

// Enforce that req.user.id === Number(req.params.user_id) (JWT auth) — Admin override later

// Authorization middleware to ensure user can only access their own saved jobs
function authorizeUserIdParam(req, res, next) {
  if (!req.user || req.user.id !== Number(req.params.user_id)) {
    return res
      .status(403)
      .json({
        error: "Forbidden: You are not authorized to access this resource.",
      });
  }
  next();
}

/**
 * GET /api/:user_id/saved
 */
router.get(
  "/:user_id/saved",
  [validateUserId, handleValidationResult, authorizeUserIdParam],
  getSaved,
);

/**
 * POST /api/:user_id/saved
 */
router.post(
  "/:user_id/saved",
  [
    validateUserId,
    validateJobIdInBody,
    handleValidationResult,
    authorizeUserIdParam,
  ],
  postSaved,
);

/**
 * DELETE /api/:user_id/saved
 */
router.delete(
  "/:user_id/saved",
  [
    validateUserId,
    validateJobIdInBody,
    handleValidationResult,
    authorizeUserIdParam,
  ],
  deleteSaved,
);

module.exports = router;
