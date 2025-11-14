const express = require("express");
const { login } = require("../controllers/authController");
const { validateLogin } = require("../validators/authValidator");
const { authLimiter } = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

/**
 * @route POST /login
 * @desc User login
 * @access Public
 * Rate limited to 5 requests per 15 minutes to prevent brute force attacks
 */
router.post("/", authLimiter, validateLogin, login);

module.exports = router;
