/**
 * Jest setup file to suppress console logs during tests
 */

const prisma = require("../src/models/prisma");
const {
  cleanup: cleanupRateLimit,
} = require("../src/middlewares/downloadRateLimit");

// Store original console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Suppress console.log and console.warn during tests to reduce noise
console.log = (...args) => {
  // Only show logs if explicitly enabled
  if (process.env.SHOW_LOGS === "true") {
    originalConsoleLog(...args);
  }
};

console.warn = (...args) => {
  // Only show warnings if explicitly enabled
  if (process.env.SHOW_LOGS === "true") {
    originalConsoleWarn(...args);
  }
};

// Keep console.error for Prisma validation errors but filter minified code
console.error = (...args) => {
  if (process.env.SHOW_LOGS === "true") {
    originalConsoleError(...args);
    return;
  }

  const message = args.join(" ");

  // Check if this is minified Prisma library code
  const isMinifiedCode =
    message.match(/function \w+\([^)]*\)\{/) ||
    (message.includes("let t=") && message.includes("let r=")) ||
    message.length > 1000;

  // Skip minified code completely
  if (isMinifiedCode) {
    return;
  }

  // Show PrismaClientValidationError messages but not noisy controller errors
  const shouldShow =
    message.includes("PrismaClientValidationError") ||
    message.includes("Invalid ` prisma.") ||
    message.includes("Argument ");

  const shouldSuppress = [
    "List jobs error:",
    "Search jobs error:",
    "Get job by ID error:",
    "Apply to job error:",
    "Create job error:",
    "Error occurred:",
    "Validation error:",
  ].some((pattern) => message.includes(pattern));

  if (shouldShow && !shouldSuppress) {
    originalConsoleError(...args);
  }
};

// Restore console methods after all tests
afterAll(async () => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;

  // Clean up rate limiter interval
  cleanupRateLimit();

  // Disconnect Prisma to close database connections
  await prisma.$disconnect()
})