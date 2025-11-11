/**
 * Degree routes
 * Why: provide degree type data for registration forms
 * @module routes/degree/index
 */
const express = require("express");
const router = express.Router();
const controller = require("../../controllers/degreeController");

// GET /api/degree-types - Public endpoint (no authentication required)
// Why: Needed for registration forms before user has an account
router.get("/", controller.getAllDegreeTypes);

module.exports = router;
