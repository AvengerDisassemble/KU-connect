/**
 * @module controllers/savedController
 * @description HTTP handlers for Saved Jobs endpoints
 */

const savedService = require("../services/savedService");

/**
 * Extracts user ID from request params
 * @param {Express.Request} req - Express request object
 * @returns {string|undefined} The user_id from route params
 * 
 * Note: Routes explicitly define :user_id parameter, so we directly access it.
 * No fallback logic needed - if this returns undefined, it indicates a routing
 * configuration error that should be fixed at the route level.
 */
function extractUserIdFromReq(req) {
  return req.params && req.params.user_id;
}

/**
 * GET /api/:user_id/saved
 * Returns paginated list of saved jobs for a user
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function getSaved(req, res) {
  try {
    const userId = extractUserIdFromReq(req);
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 20;
    const result = await savedService.listSavedJobs(userId, { page, pageSize });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    console.error(err && err.stack);
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err.message },
      });
  }
}

/**
 * POST /api/:user_id/saved
 * Creates a saved job record
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function postSaved(req, res) {
  try {
    console.log("postSaved called with params=", req.params, "body=", req.body);
    const userId = extractUserIdFromReq(req);
    const jobId = String(req.body.jobId);
    console.log("postSaved parsed userId, jobId=", userId, jobId);
    const saved = await savedService.addSavedJob(userId, jobId);
    return res.status(201).json({ success: true, data: saved });
  } catch (err) {
    if (err.code === "ALREADY_SAVED") {
      return res
        .status(409)
        .json({
          success: false,
          error: { code: "ALREADY_SAVED", message: "Job already saved" },
        });
    }
    if (err.code === "NOT_FOUND") {
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "NOT_FOUND", message: "Job or user not found" },
        });
    }
    console.error(err);
    console.error(err && err.stack);
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err.message },
      });
  }
}

/**
 * DELETE /api/:user_id/saved
 * Removes a saved job
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function deleteSaved(req, res) {
  try {
    const userId = extractUserIdFromReq(req);
    const jobId = String(req.body.jobId);
    await savedService.removeSavedJob(userId, jobId);
    return res.status(204).send();
  } catch (err) {
    if (err.code === "NOT_FOUND") {
      return res
        .status(404)
        .json({
          success: false,
          error: { code: "NOT_FOUND", message: "Saved job not found" },
        });
    }
    console.error(err);
    console.error(err && err.stack);
    return res
      .status(500)
      .json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: err.message },
      });
  }
}

module.exports = {
  getSaved,
  postSaved,
  deleteSaved,
};
