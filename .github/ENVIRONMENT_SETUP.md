# Backend Testing Environment Setup

This document outlines the setup for automated backend testing with GitHub Actions.

## GitHub Actions Environment

The testing pipeline automatically provides:

### Test Database
- **Database**: PostgreSQL 15
- **URL**: `postgresql://test_user:test_password@localhost:5432/test_db`
- **Credentials**:
  - User: `test_user`
  - Password: `test_password`
  - Database: `test_db`

### Environment Variables
```
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_db
NODE_ENV=test
```

## Optional GitHub Secrets

For enhanced features, you can add these secrets in Repository Settings → Secrets:

### Test Coverage Reporting
- `CODECOV_TOKEN` - Token for Codecov.io coverage reporting (optional)

## Local Development Environment

Create a `.env` file in the backend directory for local testing:
```
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/ku_connect_dev
JWT_SECRET=your-local-jwt-secret-for-testing
```

## Test Database Setup

### Local PostgreSQL for Development
```bash
# Install PostgreSQL locally
# Create development database
createdb ku_connect_dev

# Run migrations
cd backend
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Running Tests Locally
```bash
cd backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage  # if configured

# Run tests in watch mode
npm run test:watch     # if configured
```

## Database Migration Strategy

The pipeline follows this sequence:
1. **Fresh PostgreSQL container** starts for each test run
2. **Prisma migrations** are applied (`npx prisma migrate deploy`)
3. **Database seeding** runs if a seed script exists
4. **Tests execute** with clean database state
5. **Database is destroyed** after tests complete

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use environment variables** for database connections
3. **Separate test and development databases**
4. **Keep test data isolated** from production data
5. **Use transactions** in tests for cleanup

## Test Configuration Examples

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/generated/**',
    '!src/**/*.test.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
}
```

### Test Database Setup (tests/setup.js)
```javascript
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect()
})

afterAll(async () => {
  // Cleanup and disconnect
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean database before each test
  // Add cleanup logic here
})
```