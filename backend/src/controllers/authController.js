const {
  registerUser,
  loginUser,
  verifyMfaLogin,
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
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  // Authenticate user (may return MFA requirement)
  const result = await loginUser(email, password, req);

  // Check if MFA is required
  if (result.mfaRequired) {
    // Return temporary token for MFA verification
    return res.json({
      success: true,
      mfaRequired: true,
      tempToken: result.tempToken,
      userId: result.userId,
      message: result.message || "MFA verification required",
    });
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
      sessionId: result.sessionId,
    },
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
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
  }

  if (!refreshToken) {
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

/**
 * Verify MFA code and complete login
 * POST /auth/mfa/verify-login
 */
const verifyMfa = asyncErrorHandler(async (req, res) => {
  const { tempToken, mfaCode } = req.body;

  // Validate input
  if (!tempToken || !mfaCode) {
    return res.status(400).json({
      success: false,
      message: "Temporary token and MFA code are required",
    });
  }

  // Verify MFA and complete login
  const result = await verifyMfaLogin(tempToken, mfaCode, req);

  // Encrypt tokens before storing in cookies
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

  // Prepare response
  const response = {
    success: true,
    message: "MFA verification successful",
    data: {
      user: result.user,
      sessionId: result.sessionId,
    },
  };

  // Add warnings if recovery code was used
  if (result.usedRecoveryCode) {
    response.warning = `Recovery code used. You have ${result.remainingRecoveryCodes} recovery code(s) remaining.`;
    
    if (result.remainingRecoveryCodes === 0) {
      response.warning += " Please generate new recovery codes immediately.";
    } else if (result.remainingRecoveryCodes <= 2) {
      response.warning += " Consider generating new recovery codes soon.";
    }
  }

  // Add new device notification
  if (result.isNewDevice) {
    response.info = "Login from new device detected.";
  }

  res.json(response);
});

module.exports = {
  login,
  verifyMfa,
  registerAlumni,
  registerEnterprise,
  registerStaff,
  registerAdmin,
  refreshToken,
  logout,
  getProfile,
};
