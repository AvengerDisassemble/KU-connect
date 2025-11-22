const express = require("express");
const {
  refreshToken,
  logout,
  getProfile,
  verifyMfa,
} = require("../controllers/authController");
const {
  enrollMfa,
  verifyAndEnableMfa,
  disableMfa,
  getMfaStatus,
  regenerateRecoveryCodes,
} = require("../controllers/mfaController");
const {
  getUserSessions,
  revokeSession,
  revokeAllSessions,
  checkSessionStatus,
  updateActivity,
} = require("../controllers/sessionController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { authLimiter } = require("../middlewares/rateLimitMiddleware");
const passport = require("../utils/passport");
const {
  generateAccessToken,
  generateRefreshToken,
  generateJwtId,
  getRefreshTokenExpiry,
  encryptToken,
} = require("../utils/tokenUtils");
const prisma = require("../models/prisma");

const DEFAULT_FRONTEND_URL =
  process.env.DEFAULT_FRONTEND_URL || "http://localhost:5173";

function normalizeFrontendConfig(candidate) {
  if (typeof candidate !== "string" || candidate.trim().length === 0) {
    return null;
  }

  try {
    const parsed = new URL(candidate.trim());
    const origin = `${parsed.protocol}//${parsed.host}`;
    const pathname = parsed.pathname.replace(/\/$/, "");
    return {
      origin,
      url: `${origin}${pathname}`,
      pathname: pathname.length > 0 ? pathname : "/",
    };
  } catch (error) {
    console.warn(
      "Invalid frontend URL provided:",
      candidate,
      error instanceof Error ? `(${error.message})` : "",
    );
    return null;
  }
}

function combinePaths(basePath, appendPath) {
  const sanitizedBase = basePath === "/" ? "" : basePath.replace(/\/$/, "");
  const sanitizedAppend = appendPath.startsWith("/")
    ? appendPath
    : `/${appendPath}`;
  const combined = `${sanitizedBase}${sanitizedAppend}`;
  return combined.length > 0 ? combined : "/";
}

function decodeState(value) {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch (error) {
    console.warn(
      "Failed to decode Google OAuth state payload",
      error instanceof Error ? error.message : error,
    );
  }

  return null;
}

const defaultFrontendConfig = normalizeFrontendConfig(DEFAULT_FRONTEND_URL);
let envFrontendConfig = normalizeFrontendConfig(process.env.FRONTEND_URL);

if (!envFrontendConfig && defaultFrontendConfig) {
  console.warn(
    "Falling back to default frontend URL",
    DEFAULT_FRONTEND_URL,
    "because FRONTEND_URL is missing or invalid",
  );
  envFrontendConfig = defaultFrontendConfig;
}

const frontendConfig = envFrontendConfig || defaultFrontendConfig;

const router = express.Router();

/**
 * @route GET /auth/google
 * @desc Initiate Google OAuth flow
 * @access Public
 */
router.get("/google", (req, res, next) => {
  const statePayload = {};

  if (typeof req.query.origin === "string" && req.query.origin.length > 0) {
    statePayload.origin = req.query.origin;
  }

  if (typeof req.query.redirect === "string" && req.query.redirect.length > 0) {
    statePayload.redirect = req.query.redirect;
  }

  const options = {
    session: false,
    state:
      Object.keys(statePayload).length > 0
        ? Buffer.from(JSON.stringify(statePayload)).toString("base64url")
        : undefined,
  };

  return passport.authenticate("google", options)(req, res, next);
});

/**
 * @route GET /auth/google/callback
 * @desc Google OAuth callback - issues JWT tokens
 * @access Public
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  async (req, res, next) => {
    try {
      const user = req.user;

      // Generate JWT tokens
      const jwtId = generateJwtId();
      const accessToken = generateAccessToken({
        id: user.id,
        role: user.role,
      });
      const refreshToken = generateRefreshToken({
        id: user.id,
        jti: jwtId,
      });
      // Store refresh token in database
      await prisma.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: getRefreshTokenExpiry(),
        },
      });

      try {
        const encryptedAccessToken = encryptToken(accessToken);
        const encryptedRefreshToken = encryptToken(refreshToken);

        res.cookie("accessToken", encryptedAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 15 * 60 * 1000,
        });

        res.cookie("refreshToken", encryptedRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
      } catch (cookieError) {
        console.error("Failed to set OAuth cookies:", cookieError);
      }

      const payload = Buffer.from(
        JSON.stringify({
          user,
          accessToken,
          refreshToken,
        }),
      ).toString("base64");

      const stateData = decodeState(req.query.state);

      let runtimeFrontendConfig = frontendConfig;
      if (stateData?.origin) {
        const resolvedConfig = normalizeFrontendConfig(stateData.origin);
        if (resolvedConfig) {
          runtimeFrontendConfig = resolvedConfig;
        } else {
          console.warn(
            "Ignoring invalid origin received from OAuth state:",
            stateData.origin,
          );
        }
      }

      if (!runtimeFrontendConfig) {
        throw new Error("No valid frontend configuration is available");
      }

      const fallbackPath = combinePaths(
        new URL(runtimeFrontendConfig.url).pathname,
        typeof stateData?.redirect === "string" &&
          stateData.redirect.startsWith("/")
          ? stateData.redirect
          : "/oauth/callback",
      );

      const fallbackUrl = new URL(runtimeFrontendConfig.url);
      fallbackUrl.pathname = fallbackPath;
      fallbackUrl.searchParams.set("payload", payload);
      const fallbackRedirect = fallbackUrl.toString();

      res.send(`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>Signing you in…</title>
    </head>
    <body>
      <script>
        ;(function () {
          var payload = '${payload}'
          var targetOrigin = '${runtimeFrontendConfig.origin}'
          var delivered = false

          function sendMessage(target) {
            if (!target) return
            try {
              var data = JSON.parse(atob(payload))
              var message = { type: 'oauth', payload: data }
              target.postMessage(message, targetOrigin)
              delivered = true
            } catch (err) {
              console.error('Failed to deliver OAuth payload', err)
            }
          }

          if (window.opener && !window.opener.closed) {
            sendMessage(window.opener)
          }

          if (!delivered && window.parent && window.parent !== window) {
            sendMessage(window.parent)
          }

          if (delivered) {
            setTimeout(function () {
              window.close()
            }, 150)
          } else {
            window.location.replace('${fallbackRedirect}')
          }
        })()
      </script>
    </body>
  </html>`);
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route POST /auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post("/refresh", authLimiter, refreshToken);

/**
 * @route POST /auth/logout
 * @desc Logout user and invalidate refresh token
 * @access Public
 */
router.post("/logout", authLimiter, logout);

/**
 * @route GET /auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get("/me", authLimiter, authMiddleware, getProfile);

/**
 * MFA Routes
 */

/**
 * @route POST /auth/mfa/verify-login
 * @desc Verify MFA code and complete login
 * @access Public
 */
router.post("/mfa/verify-login", authLimiter, verifyMfa);

/**
 * @route POST /auth/mfa/enroll
 * @desc Generate MFA secret and QR code for enrollment
 * @access Private (authenticated users)
 */
router.post("/mfa/enroll", authLimiter, authMiddleware, enrollMfa);

/**
 * @route POST /auth/mfa/verify
 * @desc Verify TOTP code and enable MFA
 * @access Private (authenticated users)
 */
router.post("/mfa/verify", authLimiter, authMiddleware, verifyAndEnableMfa);

/**
 * @route POST /auth/mfa/disable
 * @desc Disable MFA (requires password and current TOTP)
 * @access Private (authenticated users)
 */
router.post("/mfa/disable", authLimiter, authMiddleware, disableMfa);

/**
 * @route GET /auth/mfa/status
 * @desc Get MFA status for current user
 * @access Private (authenticated users)
 */
router.get("/mfa/status", authLimiter, authMiddleware, getMfaStatus);

/**
 * @route POST /auth/mfa/regenerate-codes
 * @desc Regenerate recovery codes (requires current TOTP)
 * @access Private (authenticated users)
 */
router.post("/mfa/regenerate-codes", authLimiter, authMiddleware, regenerateRecoveryCodes);

/**
 * Session Management Routes
 */

/**
 * @route GET /auth/sessions
 * @desc Get all active sessions for current user
 * @access Private (authenticated users)
 */
router.get("/sessions", authLimiter, authMiddleware, getUserSessions);

/**
 * @route DELETE /auth/sessions/all
 * @desc Revoke all sessions for current user
 * @access Private (authenticated users)
 */
router.delete("/sessions/all", authLimiter, authMiddleware, revokeAllSessions);

/**
 * @route DELETE /auth/sessions/:sessionId
 * @desc Revoke a specific session
 * @access Private (authenticated users)
 */
router.delete("/sessions/:sessionId", authLimiter, authMiddleware, revokeSession);

/**
 * @route GET /auth/session/status
 * @desc Check if current session is still valid
 * @access Private (authenticated users)
 */
router.get("/session/status", authLimiter, authMiddleware, checkSessionStatus);

/**
 * @route POST /auth/session/activity
 * @desc Update session activity timestamp
 * @access Private (authenticated users)
 */
router.post("/session/activity", authMiddleware, updateActivity);

module.exports = router;
