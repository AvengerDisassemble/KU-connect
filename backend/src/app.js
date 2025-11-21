/**
 * @module app
 */
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const passport = require("./utils/passport");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();

// Security Headers - Apply Helmet.js
app.use(
  helmet({
    // Content Security Policy - Prevents XSS, injection attacks
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for React
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // HTTP Strict Transport Security - Forces HTTPS
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    // X-Frame-Options - Prevents clickjacking
    frameguard: {
      action: "deny",
    },
    // X-Content-Type-Options - Prevents MIME sniffing
    noSniff: true,
    // X-XSS-Protection - Legacy XSS protection (for older browsers)
    xssFilter: true,
    // Referrer-Policy - Controls referrer information
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
  }),
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

// Initialize Passport (without sessions)
app.use(passport.initialize());

// Mount API routes
app.use("/api", routes);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
