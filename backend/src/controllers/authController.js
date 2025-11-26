const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} = require("../services/authService");
const { encryptToken, decryptToken } = require("../utils/tokenUtils");
const { asyncErrorHandler } = require("../middlewares/errorHandler");

/**
 * Login controller
 * POST /login
 */
const login = asyncErrorHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    req.log?.("warn", "auth.login.validation_failed", {
      ip: req.ip,
      userAgent: req.get("user-agent"),
      email,
    });
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  // Authenticate user
  let result;
  try {
    result = await loginUser(email, password);
  } catch (err) {
    req.log?.("security", "auth.login.failure", {
      email,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      reason: err.message,
    });
    throw err;
  }

  // Encrypt tokens before storing in cookies for security
  const encryptedAccessToken = encryptToken(result.accessToken);
  const encryptedRefreshToken = encryptToken(result.refreshToken);

  // Set encrypted tokens in HTTP-only cookies
  res.cookie("accessToken", encryptedAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", encryptedRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
    },
  });

  req.log?.("security", "auth.login.success", {
    userId: result.user.id,
    email,
    role: result.user.role,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
});

/**
 * Register alumni controller
 * POST /register/alumni
 */
const registerAlumni = asyncErrorHandler(async (req, res) => {
  const { name, surname, email, password, degreeTypeId, address } = req.body;

  // Validate input
  if (!name || !surname || !email || !password || !degreeTypeId || !address) {
    return res.status(400).json({
      success: false,
      message:
        "All fields are required: name, surname, email, password, degreeTypeId, address",
    });
  }

  // Register alumni as STUDENT
  const user = await registerUser(
    {
      name,
      surname,
      email,
      password,
      role: "STUDENT",
    },
    {
      degreeTypeId, // Keep as string (cuid)
      address,
    },
  );

  res.status(201).json({
    success: true,
    message: "Alumni registration successful",
    data: {
      user,
    },
  });

  req.log?.("security", "auth.register.alumni", {
    userId: user.id,
    email,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
});

/**
 * Register enterprise/company controller
 * POST /register/enterprise
 */
const registerEnterprise = asyncErrorHandler(async (req, res) => {
  const { name, surname, email, password, companyName, address, phoneNumber } =
    req.body;

  // Validate input
  if (
    !name ||
    !surname ||
    !email ||
    !password ||
    !companyName ||
    !address ||
    !phoneNumber
  ) {
    return res.status(400).json({
      success: false,
      message:
        "All fields are required: name, surname, email, password, companyName, address, phoneNumber",
    });
  }

  // Register enterprise as EMPLOYER
  const user = await registerUser(
    {
      name,
      surname,
      email,
      password,
      role: "EMPLOYER",
    },
    {
      companyName,
      address,
      phoneNumber,
    },
  );

  res.status(201).json({
    success: true,
    message: "Enterprise registration successful",
    data: {
      user,
    },
  });

  req.log?.("security", "auth.register.enterprise", {
    userId: user.id,
    email,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
});

/**
 * Register university staff controller
 * POST /register/staff
 */
const registerStaff = asyncErrorHandler(async (req, res) => {
  const { name, surname, email, password, department } = req.body;

  // Register staff as PROFESSOR
  const user = await registerUser(
    {
      name,
      surname,
      email,
      password,
      role: "PROFESSOR",
    },
    {
      department,
    },
  );

  res.status(201).json({
    success: true,
    message: "University staff registration successful",
    data: {
      user,
    },
  });

  req.log?.("security", "auth.register.staff", {
    userId: user.id,
    email,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
});

/**
 * Register admin controller
 * POST /register/admin
 */
const registerAdmin = asyncErrorHandler(async (req, res) => {
  const { name, surname, email, password } = req.body;

  // Register admin as ADMIN
  const user = await registerUser({
    name,
    surname,
    email,
    password,
    role: "ADMIN",
  });

  res.status(201).json({
    success: true,
    message: "Admin registration successful",
    data: {
      user,
    },
  });

  req.log?.("security", "auth.register.admin", {
    userId: user.id,
    email,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
});

/**
 * Refresh token controller
 * POST /auth/refresh
 */
const refreshToken = asyncErrorHandler(async (req, res) => {
  // Accept refresh token from either cookies or request body
  let refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  // If token is from cookie, it's encrypted - decrypt it
  if (req.cookies?.refreshToken) {
    refreshToken = decryptToken(req.cookies.refreshToken);
    if (!refreshToken) {
      req.log?.("security", "auth.refresh.invalid_cookie_token", {
        ip: req.ip,
        userAgent: req.get("user-agent"),
      });
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
  }

  if (!refreshToken) {
    req.log?.("security", "auth.refresh.missing_token", {
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    return res.status(401).json({
      success: false,
      message: "Refresh token required",
    });
  }

  const result = await refreshAccessToken(refreshToken);

  // Encrypt new access token before storing in cookie
  const encryptedAccessToken = encryptToken(result.accessToken);

  // Set new access token in cookie
  res.cookie("accessToken", encryptedAccessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      user: result.user,
      // Note: Access token is set in HTTP-only cookie for security
      // Clients that can't use cookies should use the login endpoint with Authorization header
    },
  });

  req.log?.("security", "auth.refresh.success", {
    userId: result.user.id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
});

/**
 * Logout controller
 * POST /auth/logout
 */
const logout = asyncErrorHandler(async (req, res) => {
  // Accept refresh token from either cookies or request body
  let refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  // If token is from cookie, it's encrypted - decrypt it
  if (req.cookies?.refreshToken) {
    refreshToken = decryptToken(req.cookies.refreshToken);
  }

  if (refreshToken) {
    await logoutUser(refreshToken);
  }

  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.json({
    success: true,
    message: "Logout successful",
  });

  req.log?.("security", "auth.logout", {
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
});

/**
 * Get current user profile
 * GET /auth/me
 */
const getProfile = asyncErrorHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

module.exports = {
  login,
  registerAlumni,
  registerEnterprise,
  registerStaff,
  registerAdmin,
  refreshToken,
  logout,
  getProfile,
};
