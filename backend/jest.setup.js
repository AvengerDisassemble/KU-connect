// Suppress console logs during tests to keep output clean
const originalConsole = global.console;

global.console = {
  ...console,
  // Suppress noisy logs
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // Suppress errors and warnings from application code
  // but still show test failures
  error: jest.fn(),
  warn: jest.fn(),
}

// If you need to see console output for debugging, uncomment:
// global.console = originalConsole;

