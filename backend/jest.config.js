module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  
  // Transform ES modules from node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],
  
  // Mock ES modules
  moduleNameMapper: {
    '^uuid$': '<rootDir>/tests/__mocks__/uuid.js'
  },

  // Setup file to suppress console logs
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Suppress verbose output during tests
  verbose: false,

  // Disable stack traces to reduce noise
  noStackTrace: true,

  // Use only custom reporter for clean output
  reporters: [
    '<rootDir>/tests/customReporter.js'
  ],

  // Silent mode - suppress console output during test run
  silent: false,

  // Run tests sequentially to avoid database conflicts
  maxWorkers: 1,
  
  // Increase timeout for slow database operations
  testTimeout: 60000,

  // Let Jest exit naturally; fix open handles instead of forcing exit
  forceExit: false,

  // Help detect any remaining async handles during local debug
  // Disabled in CI to prevent false failures
  detectOpenHandles: process.env.CI !== 'true'
}