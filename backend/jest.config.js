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

  // Use custom reporter to show failures at the end
  reporters: [
    'default',
    '<rootDir>/tests/customReporter.js'
  ],

  // Run tests sequentially to avoid database conflicts
  maxWorkers: 1,
  
  // Increase timeout for slow database operations
  testTimeout: 10000
}
