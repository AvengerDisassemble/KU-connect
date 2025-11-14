const express = require("express");
const { registerAdmin } = require("../../controllers/authController");
const { validateAdminRegistration } = require("../../validators/authValidator");
const { authLimiter } = require("../../middlewares/rateLimitMiddleware");

const router = express.Router();

/**
 * @route POST /register/admin
 * @desc Register admin accounts
 * @access Public
 * Rate limited to 5 requests per 15 minutes to prevent account spam
 */
router.post("/", authLimiter, validateAdminRegistration, registerAdmin);

module.exports = router;
