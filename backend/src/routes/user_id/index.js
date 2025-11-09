const express = require("express");
// Enable merging params from parent router so :user_id is available
const router = express.Router({ mergeParams: true });

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

// Routes are mounted at /:user_id by routes registrar
// So these define /:user_id/saved

/**
 * GET /:user_id/saved
 */
router.get("/saved", [validateUserId, handleValidationResult], getSaved);

/**
 * POST /:user_id/saved
 */
router.post(
  "/saved",
  [validateUserId, validateJobIdInBody, handleValidationResult],
  postSaved,
);

/**
 * DELETE /:user_id/saved
 */
router.delete(
  "/saved",
  [validateUserId, validateJobIdInBody, handleValidationResult],
  deleteSaved,
);

module.exports = router;
