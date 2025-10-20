/**
 * Jest setup file to suppress console logs during tests
 */

// Store original console methods
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

// Suppress console.log and console.warn during tests to reduce noise
console.log = (...args) => {
  // Only show logs if explicitly enabled
  if (process.env.SHOW_LOGS === 'true') {
    originalConsoleLog(...args)
  }
}

console.warn = (...args) => {
  // Only show warnings if explicitly enabled
  if (process.env.SHOW_LOGS === 'true') {
    originalConsoleWarn(...args)
  }
}

// Keep console.error visible but cleaner
console.error = (...args) => {
  // Filter out noisy error logs from Express/Router
  const message = args.join(' ')
  if (
    !message.includes('Error:') ||
    message.includes('FAIL') ||
    message.includes('Error executing')
  ) {
    originalConsoleError(...args)
  }
}

// Restore console methods after all tests
afterAll(() => {
  console.log = originalConsoleLog
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})
