# KU-Connect Backend Testing Pipeline

This repository includes a GitHub Actions CI pipeline for automated backend testing of the KU-Connect job platform.

## Pipeline Overview

### 🔄 Backend Testing Pipeline (`backend-ci.yml`)

- **Triggers**: Push/PR to main, dev, or feature branches affecting backend code
- **Node.js versions**: 18.x, 20.x (matrix strategy for compatibility testing)
- **Database**: PostgreSQL 15 (isolated test environment)
- **Testing Framework**: Jest with Supertest for API testing

#### Pipeline Steps:
1. **Environment Setup**
   - Code checkout and Node.js setup
   - Dependency installation (`npm ci`)
   - PostgreSQL test database initialization

2. **Database Setup**
   - Prisma client generation
   - Database migration deployment
   - Optional database seeding

3. **Testing & Quality**
   - Jest test execution with coverage
   - Code style validation (StandardJS if configured)
   - Test coverage reporting (Codecov)

4. **Build Verification**
   - Prisma schema validation
   - Build artifact creation (if build script exists)

## 🛠️ Setup Instructions

### 1. Repository Secrets (Optional)

For test coverage reporting, go to **Repository Settings → Secrets and variables → Actions** and add:

```
CODECOV_TOKEN    # For test coverage reporting (optional)
```

### 2. Branch Protection Rules

Set up branch protection for `main` and `dev`:
1. Go to **Repository Settings → Branches**
2. Add protection rules:
   - Require PR reviews
   - Require status checks (Backend CI workflow)
   - Require up-to-date branches
   - Restrict direct pushes to main

## 📊 Testing Features

### ✅ Automated Testing
- **Multi-version compatibility**: Tests on Node.js 18.x and 20.x
- **Database integration**: Isolated PostgreSQL test environment
- **API testing**: Jest + Supertest for endpoint testing
- **Code coverage**: Automated coverage reporting
- **Code standards**: StandardJS compliance checking

### 🔒 Quality Assurance
- **Isolation**: Each test run uses a fresh database
- **Consistency**: Same test environment across all runs
- **Reliability**: Health checks ensure database readiness
- **Flexibility**: Supports optional seeding and custom test scripts

## 🔧 Customization

### Adding New Test Types

Edit the `backend-ci.yml` workflow to add additional testing steps:

```yaml
- name: Run Integration Tests
  run: npm run test:integration
  env:
    DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db

- name: Run API Tests
  run: npm run test:api
  env:
    DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
```

### Configuring Code Quality Checks

Add StandardJS to your project and the pipeline will automatically check code style:

```bash
npm install --save-dev standard
```

Add to your `package.json`:
```json
{
  "scripts": {
    "lint": "standard",
    "lint:fix": "standard --fix"
  }
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**: 
   - PostgreSQL service automatically starts in the pipeline
   - Test database URL: `postgresql://test_user:test_password@localhost:5432/test_db`

2. **Prisma Issues**:
   - Ensure `prisma/schema.prisma` exists
   - Check migration files in `prisma/migrations/`
   - Verify `@prisma/client` is in dependencies

3. **Test Failures**:
   - Check if tests require specific environment variables
   - Verify database schema matches your tests
   - Ensure test database is properly seeded

4. **Node Version Compatibility**:
   - Pipeline tests on Node.js 18.x and 20.x
   - Check if your code works on both versions

### Debugging Failed Tests

1. Check the "Actions" tab in your GitHub repository
2. Click on the failed workflow run
3. Expand the failed step to see detailed logs
4. Look for error messages in the test output

### Test Environment Variables

The pipeline automatically provides:
```
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_db
NODE_ENV=test
```

## 📝 Best Practices

1. **Write Comprehensive Tests**: Cover your API endpoints, models, and business logic
2. **Use Test Database**: Always use the provided test database URL in tests
3. **Clean Test Data**: Use database transactions or cleanup in test teardown
4. **Feature Branches**: Create feature branches for new development
5. **Small Commits**: Keep commits focused and test frequently

## 🎯 Next Steps

1. **Write More Tests**: Add unit tests for your models and services
2. **API Testing**: Use Supertest to test your Express routes
3. **Test Coverage**: Aim for high test coverage (80%+ recommended)
4. **Integration Tests**: Test database interactions and external APIs
5. **Performance Tests**: Add performance testing for critical endpoints

## 📚 Testing Examples

### Example Jest Test Structure
```javascript
// tests/src/routes/example.test.js
const request = require('supertest')
const app = require('../../../src/app')

describe('Example API', () => {
  beforeEach(async () => {
    // Setup test data
  })

  afterEach(async () => {
    // Cleanup test data
  })

  test('GET /api/example should return 200', async () => {
    const response = await request(app)
      .get('/api/example')
      .expect(200)
    
    expect(response.body).toHaveProperty('data')
  })
})
```

### Example Package.json Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration"
  }
}
```