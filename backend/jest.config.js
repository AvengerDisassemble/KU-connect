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
  }
}
