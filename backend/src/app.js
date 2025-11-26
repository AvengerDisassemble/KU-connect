/**
 * @module app
 */
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const passport = require("./utils/passport");
const routes = require("./routes");
const { errorHandler } = require("./middlewares/errorHandler");
const { requestLogger } = require("./middlewares/loggingMiddleware");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
// Keep concise console logging in development; structured logging handled separately
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Initialize Passport (without sessions)
app.use(passport.initialize());

// Mount API routes
app.use("/api", routes);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
