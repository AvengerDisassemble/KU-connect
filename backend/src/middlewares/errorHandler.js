/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Log error safely without exposing sensitive information
  // Only log error type, message, and code in production
  if (process.env.NODE_ENV === "production") {
    console.error("Error occurred:", {
      name: err.name,
      message: err.message,
      code: err.code,
      status: err.status,
    });
  } else {
    // Full error details in development for debugging
    console.error("Error:", err.message, "\nStack:", err.stack);
  }

  // Default error
  let error = {
    success: false,
    message: "Internal server error",
    statusCode: 500,
  };

  // Prisma unique constraint error
  if (err.code === "P2002") {
    error.message = "A record with this information already exists";
    error.statusCode = 409;
  }

  // Prisma record not found error
  if (err.code === "P2025") {
    error.message = "Record not found";
    error.statusCode = 404;
  }

  // Custom application errors
  if (err.message) {
    if (err.message.includes("Invalid credentials")) {
      error.message = "Invalid credentials";
      error.statusCode = 401;
    } else if (
      err.message.includes("refresh token") ||
      err.message.includes("Refresh token")
    ) {
      error.message = err.message;
      error.statusCode = 401;
    } else if (
      err.message.includes("already registered") ||
      err.message.includes("already exists")
    ) {
      error.message = err.message;
      error.statusCode = 409;
    } else if (err.message.includes("not found")) {
      error.message = err.message;
      error.statusCode = 404;
    } else if (
      err.message.includes("Access denied") ||
      err.message.includes("Forbidden")
    ) {
      error.message = err.message;
      error.statusCode = 403;
    } else if (
      err.message.includes("required") ||
      err.message.includes("Invalid")
    ) {
      error.message = err.message;
      error.statusCode = 400;
    }
  }

  // Validation errors
  if (err.name === "ValidationError") {
    error.message = "Validation failed";
    error.statusCode = 400;
    error.details = err.details;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error.message = "Invalid token";
    error.statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    error.message = "Token expired";
    error.statusCode = 401;
  }

  // Multer errors
  if (err.name === "MulterError") {
    error.statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      error.message = "File size exceeds the 10 MB limit";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      error.message =
        "Unexpected field name. Please check the field name in your request.";
    } else {
      error.message = err.message || "File upload error";
    }
  }

  // Multer file filter errors
  if (
    err.message &&
    (err.message.includes("Only PDF files are allowed") ||
      err.message.includes("Only JPEG, PNG, or PDF files are allowed") ||
      err.message.includes(
        "Only JPEG, PNG, GIF, or WebP image files are allowed",
      ))
  ) {
    error.statusCode = 400;
    error.message = err.message;
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

/**
 * Async error wrapper to catch async errors and pass them to error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
function asyncErrorHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncErrorHandler,
};
