module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  silent: false,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/generated/**',
    '!**/node_modules/**'
  ],
  // Suppress console logs during tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}
