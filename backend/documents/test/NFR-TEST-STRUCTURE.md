# NFR Test Structure & Testing Guide

## 📁 File Structure Overview

### NFR Test Files Organization

```
backend/tests/
├── nfr-setup.js                        # Global setup/teardown for all NFR tests
├── nfr-helpers/
│   └── setup.js                        # Authentication and test user management
├── security/
│   ├── jwt-security.test.js            # JWT authentication & authorization tests
│   └── data-protection.test.js         # Data encryption & protection tests
├── performance/
│   ├── response-time.test.js           # Response time & concurrency tests
│   └── artillery-load-test.yml         # Advanced load testing configuration
└── reliability/
    └── error-handling.test.js          # Error handling & transaction integrity tests
```

---

## 📄 Detailed File Descriptions

### 1. **nfr-setup.js** - Global Test Configuration

**Purpose**: Provides setup and teardown functions that run before/after all NFR tests.

**Key Functions**:
- `setupNFRTests()`: Creates test users, generates tokens, creates test job
- `teardownNFRTests(context)`: Cleans up all test data

**What It Returns** (via `global.nfrTestContext`):
```javascript
{
  users: {
    student: { id, email, role },
    employer: { id, email, role, hr: {...} },
    admin: { id, email, role },
    professor: { id, email, role }
  },
  tokens: {
    student: "Bearer eyJhbGc...",    // Ready-to-use Authorization headers
    employer: "Bearer eyJhbGc...",
    admin: "Bearer eyJhbGc...",
    professor: "Bearer eyJhbGc..."
  },
  testJob: { id, title, hrId, ... },  // Sample job for testing
  degreeType: { id, degree_type_name }  // Sample degree type
}
```

**When to Use**:
- Every NFR test file MUST call `setupNFRTests()` in `beforeAll()`
- Every NFR test file MUST call `teardownNFRTests()` in `afterAll()`

**Example Usage**:
```javascript
const { setupNFRTests, teardownNFRTests } = require('../nfr-setup')

let testContext

describe('My NFR Tests', () => {
  beforeAll(async () => {
    testContext = await setupNFRTests()
  })

  afterAll(async () => {
    await teardownNFRTests(testContext)
  })

  it('should do something', async () => {
    // Use testContext.tokens.student for authenticated requests
    await request(app)
      .get('/api/profile')
      .set('Authorization', testContext.tokens.student)
  })
})
```

---

### 2. **nfr-helpers/setup.js** - Authentication & User Management

**Purpose**: Centralizes test user creation and token generation to ensure consistency with production authentication.

**Key Functions**:

#### `createNFRTestUsers()`
Creates 4 fully configured test users with proper database relationships:
- **Student**: Has Student record linked to degreeType
- **Employer**: Has User + HR record
- **Admin**: Has admin role
- **Professor**: Has professor role

**Returns**:
```javascript
{
  users: { student, employer, admin, professor },
  tokens: { student, employer, admin, professor }, // Bearer tokens
  degreeType: { id, degree_type_name }
}
```

#### `generateTestToken(payload)`
Generates JWT token using production `tokenUtils.generateAccessToken()`.

**Parameters**:
```javascript
{
  id: 'user-id',
  email: 'user@example.com',
  role: 'STUDENT',
  student: { id: 'student-id' },  // Optional: for students
  hr: { id: 'hr-id' }              // Optional: for employers
}
```

**Returns**: `"Bearer eyJhbGc..."` (ready-to-use Authorization header)

#### `createTempTestUser(userData)`
Creates a temporary test user for specific test scenarios.

**Parameters**:
```javascript
{
  role: 'STUDENT',
  email: 'temp@test.com',  // Optional: auto-generated if not provided
  password: 'Password123', // Optional: defaults to 'NFRTest123!'
  includeToken: true       // Optional: if true, returns token too
}
```

**Returns**:
```javascript
{
  user: { id, email, role, ... },
  token: "Bearer eyJhbGc..."  // Only if includeToken=true
}
```

**When to Use Each Function**:
- ✅ Use `createNFRTestUsers()`: In global setup (nfr-setup.js)
- ✅ Use `generateTestToken()`: When you need custom token payloads
- ✅ Use `createTempTestUser()`: When you need a temporary user for one specific test

---

### 3. **security/jwt-security.test.js** - JWT Security Tests

**Tests Coverage**: NFR-1.1, NFR-1.2 (Authentication & Authorization)

**Test Suites**:

#### A. JWT Token Validation (NFR-1.1)
- ✅ Valid tokens should be accepted
- ✅ Missing tokens should be rejected (401)
- ✅ Invalid signature tokens should be rejected
- ✅ Expired tokens should be rejected
- ✅ Malformed tokens should be rejected

#### B. Role-Based Access Control (NFR-1.2)
- ✅ Students cannot access HR/Employer endpoints
- ✅ Employers cannot access admin endpoints
- ✅ Professors cannot access student-specific features
- ✅ Admins can access admin endpoints
- ✅ Prevents role escalation attacks

**Key Test Pattern**:
```javascript
it('should reject tampered tokens', async () => {
  // Manipulate token to escalate privileges
  const tamperedToken = testContext.tokens.student.replace(/student/i, 'admin')
  
  const response = await request(app)
    .get('/api/admin/users')
    .set('Authorization', tamperedToken)
  
  expect(response.status).toBe(401) // Should be rejected
})
```

**Authentication Flow Tested**:
1. Token sent in `Authorization: Bearer <token>` header
2. Auth middleware validates token using `verifyAccessToken()`
3. Extracts user info (id, role, student/hr data)
4. Checks role permissions for the endpoint

---

### 4. **security/data-protection.test.js** - Data Security Tests

**Tests Coverage**: NFR-7.1, NFR-7.2 (Data Encryption & Protection)

**Test Suites**:

#### A. Password Encryption (NFR-7.1)
- ✅ Passwords stored as bcrypt hashes
- ✅ Uses strong bcrypt cost factor (≥10)
- ✅ Passwords not exposed in query results

#### B. Sensitive Data Protection (NFR-7.2)
- ✅ No sensitive info in logs
- ✅ Error messages don't expose internal details
- ✅ SQL injection prevention via Prisma

#### C. Data Integrity (NFR-7.3)
- ✅ Foreign key constraints enforced
- ✅ Unique constraints enforced
- ✅ Required fields validated

#### D. File Upload Security
- ✅ Restricted file types (images, PDFs only)
- ✅ File size limits enforced (5MB max)

**Key Test Pattern**:
```javascript
it('should store passwords as hashed values', async () => {
  const testUser = await prisma.user.findUnique({
    where: { email: 'nfr-student@test.com' }
  })

  // Should be bcrypt hash, not plain text
  expect(testUser.password).toMatch(/^\$2[aby]\$\d{2}\$/)
  
  // Hash should be valid
  const isValid = await bcrypt.compare('NFRTest123!', testUser.password)
  expect(isValid).toBe(true)
})
```

---

### 5. **performance/response-time.test.js** - Performance Tests

**Tests Coverage**: NFR-2.1 (Response Time), NFR-2.2 (Concurrent Users)

**Test Suites**:

#### A. Response Time Requirements (NFR-2.1)
Tests that critical endpoints respond within 3 seconds:
- ✅ GET /api/jobs (job listings)
- ✅ GET /api/job/:id (job details)
- ✅ POST /api/login (authentication)
- ✅ GET /api/profile/dashboard (user dashboard)

#### B. Concurrent User Load (NFR-2.2)
Tests system stability under load:
- ✅ 100 concurrent read requests
- ✅ 50 concurrent write operations
- ✅ No crashes or data corruption

#### C. Database Query Performance
- ✅ Complex queries execute efficiently (<2 seconds)

**Key Test Pattern**:
```javascript
it('should respond within 3 seconds', async () => {
  const startTime = Date.now()
  
  await request(app)
    .get('/api/jobs')
    .set('Authorization', testContext.tokens.student)
  
  const duration = Date.now() - startTime
  console.log(`Response time: ${duration}ms`)
  expect(duration).toBeLessThan(3000) // 3 seconds max
})
```

**Concurrency Testing**:
```javascript
it('should handle 100 concurrent requests', async () => {
  const requests = Array.from({ length: 100 }, () =>
    request(app)
      .post('/api/job/list')
      .set('Authorization', testContext.tokens.student)
      .send({ page: 1, pageSize: 10 })
  )
  
  const responses = await Promise.all(requests)
  const successCount = responses.filter(r => r.status === 200).length
  
  expect(successCount).toBeGreaterThanOrEqual(95) // 95% success rate
})
```

---

### 6. **reliability/error-handling.test.js** - Reliability Tests

**Tests Coverage**: NFR-4.1 (Error Handling), NFR-4.2 (Transaction Integrity)

**Test Suites**:

#### A. Graceful Error Handling (NFR-4.1)
- ✅ Invalid JSON handled gracefully
- ✅ Missing required fields return 400 errors
- ✅ Database errors don't crash server
- ✅ User-friendly error messages (no stack traces)
- ✅ File upload errors handled properly

#### B. Transaction Integrity (NFR-4.2)
- ✅ Failed transactions rollback completely
- ✅ No partial data saved on errors
- ✅ Concurrent updates don't corrupt data

#### C. System Stability Under Load (NFR-4.3)
- ✅ No crashes on rapid repeated requests
- ✅ Malformed requests handled safely
- ✅ No memory leaks on repeated operations

**Key Test Pattern**:
```javascript
it('should rollback transaction on failure', async () => {
  const initialCount = await prisma.job.count()
  
  // Try to create job with invalid data
  await request(app)
    .post('/api/job')
    .set('Authorization', testContext.tokens.employer)
    .send({ title: 'Test' }) // Missing required fields
  
  const finalCount = await prisma.job.count()
  expect(finalCount).toBe(initialCount) // No partial save
})
```

---

## 🧪 How to Run NFR Tests

### Run All NFR Tests
```powershell
npm run test:nfr
```

### Run Specific Test Category
```powershell
# Security tests only
npm run test:security

# Performance tests only
npm run test:performance

# Reliability tests only
npm run test:reliability
```

### Run Individual Test File
```powershell
# JWT security tests
npm test -- tests/security/jwt-security.test.js

# Response time tests
npm test -- tests/performance/response-time.test.js

# Error handling tests
npm test -- tests/reliability/error-handling.test.js
```

### Run Tests in Watch Mode (Development)
```powershell
npm test -- --watch tests/security/jwt-security.test.js
```

### Run with Verbose Output
```powershell
npm run test:nfr -- --verbose
```

---

## 🔧 How NFR Tests Work

### 1. Test Lifecycle

```
┌─────────────────────────────────────┐
│ 1. beforeAll() - Setup Phase       │
│    - setupNFRTests()                │
│    - Creates 4 test users           │
│    - Generates authentication tokens│
│    - Creates sample job & degree    │
│    - Stores in global.nfrTestContext│
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. Individual Tests Run             │
│    - Use testContext.tokens         │
│    - Make authenticated requests    │
│    - Verify responses & behavior    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. afterAll() - Cleanup Phase       │
│    - teardownNFRTests()             │
│    - Deletes all test users         │
│    - Deletes test job & degree      │
│    - Cleans up database             │
└─────────────────────────────────────┘
```

### 2. Authentication Flow

```javascript
// 1. Token Generation (Production Method)
const token = generateTestToken({
  id: user.id,
  email: user.email,
  role: user.role,
  student: { id: student.id } // For students
})

// 2. Token Format
// "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// 3. Token Usage in Tests
await request(app)
  .get('/api/profile')
  .set('Authorization', testContext.tokens.student) // Ready to use!
  .expect(200)

// 4. Token Validation (Server-side)
// authMiddleware.js validates using verifyAccessToken()
// Same validation as production!
```

### 3. Database State Management

**Before Tests**:
```
Database: Production data + existing test data
```

**During Setup** (beforeAll):
```
Database: Production data + NFR test users (4) + test job + test degree
```

**During Tests**:
```
- Tests READ from shared test users (no modifications)
- Tests CREATE temporary data (cleaned up individually)
- Tests VERIFY constraints and behavior
```

**After Cleanup** (afterAll):
```
Database: Production data (NFR test data removed)
```

**Key Principle**: NFR tests should NOT modify shared test users. Create temporary data if needed.

---

## 📊 Test Results Interpretation

### Example Output

```
PASS tests/security/jwt-security.test.js
  NFR-1: Authentication & Authorization
    JWT Token Validation
      ✓ should accept valid JWT tokens (150ms)
      ✓ should reject requests without tokens (45ms)
      ✓ should reject invalid tokens (38ms)
    Role-Based Access Control
      ✓ should prevent students from accessing HR endpoints (52ms)
      ✓ should allow admins to access admin endpoints (48ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Time:        2.459s
```

### Understanding Test Results

| Status | Meaning | Action Required |
|--------|---------|-----------------|
| ✓ Passed | Test passed, requirement met | None |
| ✗ Failed | Test failed, requirement NOT met | Fix implementation |
| ⊘ Skipped | Test skipped (intentionally) | Review why it's skipped |
| ⧗ Pending | Test not yet implemented | Complete the test |

### Common Failure Reasons

#### 401 Unauthorized
```
Expected status 200, received 401
```
**Cause**: Token authentication failed
**Fix**: 
- Ensure using `testContext.tokens.*` 
- Check token is valid and not expired
- Verify user exists in database

#### 403 Forbidden
```
Expected status 200, received 403
```
**Cause**: Role-based access denied
**Fix**:
- Verify correct token for endpoint (e.g., use employer token for /api/job POST)
- Check role permissions in route configuration

#### Timeout
```
Timeout - Async callback was not invoked within the 5000ms timeout
```
**Cause**: Test took too long (> 5 seconds)
**Fix**:
- Increase timeout: `it('test', async () => {...}, 10000)`
- Optimize test (reduce concurrent requests)
- Check for infinite loops or database deadlocks

---

## 🔍 Debugging NFR Tests

### Enable Verbose Logging

```javascript
// In your test file
console.log('Test Context:', testContext)
console.log('User:', testContext.users.student)
console.log('Token:', testContext.tokens.student)
```

### Inspect Token Payload

```javascript
const jwt = require('jsonwebtoken')

const decoded = jwt.decode(testContext.tokens.student.replace('Bearer ', ''))
console.log('Token Payload:', decoded)
```

### Check Database State

```javascript
it('debug test', async () => {
  const users = await prisma.user.findMany({
    where: { email: { contains: 'nfr-' } }
  })
  console.log('NFR Test Users:', users)
})
```

### Capture Request/Response

```javascript
const response = await request(app)
  .get('/api/profile')
  .set('Authorization', testContext.tokens.student)

console.log('Status:', response.status)
console.log('Body:', response.body)
console.log('Headers:', response.headers)
```

---

## 🛠️ Troubleshooting Common Issues

### Issue 1: "Cannot read property 'student' of undefined"

**Cause**: `testContext` not initialized
**Fix**:
```javascript
// Add this to your test file
let testContext

beforeAll(async () => {
  testContext = await setupNFRTests()
})
```

### Issue 2: Tests pass individually but fail when run together

**Cause**: Test pollution (tests modifying shared data)
**Fix**:
- Use `createTempTestUser()` for tests that modify users
- Clean up created data in `afterEach()` or within the test
- Don't modify shared test users from `testContext.users`

### Issue 3: "Unique constraint failed"

**Cause**: Trying to create user with email that already exists
**Fix**:
```javascript
// Use unique email for each test
const email = `test-${Date.now()}@test.com`
// OR
const { user } = await createTempTestUser({ role: 'STUDENT' })
```

### Issue 4: Performance tests timing out

**Cause**: Too many concurrent requests or slow database
**Fix**:
```javascript
// Increase timeout for performance tests
it('should handle 100 concurrent requests', async () => {
  // test code...
}, 30000) // 30 second timeout
```

---

## 📝 Best Practices

### ✅ DO

1. **Always use setupNFRTests()**
   ```javascript
   let testContext
   beforeAll(async () => {
     testContext = await setupNFRTests()
   })
   ```

2. **Use testContext.tokens for authentication**
   ```javascript
   .set('Authorization', testContext.tokens.student)
   ```

3. **Clean up temporary data**
   ```javascript
   afterEach(async () => {
     await prisma.tempData.deleteMany({ where: { testId: 'xyz' } })
   })
   ```

4. **Use descriptive test names**
   ```javascript
   it('should reject expired JWT tokens with 401 status', async () => {
   ```

5. **Log performance metrics**
   ```javascript
   console.log(`Response time: ${duration}ms`)
   ```

### ❌ DON'T

1. **Don't modify shared test users**
   ```javascript
   // ❌ BAD
   await prisma.user.update({
     where: { id: testContext.users.student.id },
     data: { email: 'new-email@test.com' }
   })
   
   // ✅ GOOD
   const { user } = await createTempTestUser({ role: 'STUDENT' })
   await prisma.user.update({
     where: { id: user.id },
     data: { email: 'new-email@test.com' }
   })
   ```

2. **Don't hardcode tokens**
   ```javascript
   // ❌ BAD
   const token = 'Bearer eyJhbGc...'
   
   // ✅ GOOD
   const token = testContext.tokens.student
   ```

3. **Don't skip teardown**
   ```javascript
   // ❌ BAD - Leaves test data in database
   // (missing afterAll)
   
   // ✅ GOOD
   afterAll(async () => {
     await teardownNFRTests(testContext)
   })
   ```

4. **Don't use fake data in production-critical tests**
   ```javascript
   // ❌ BAD
   const fakeToken = jwt.sign({ id: 'fake' }, 'secret')
   
   // ✅ GOOD
   const token = generateTestToken({ id: user.id, role: 'STUDENT' })
   ```

---

## 📚 Additional Resources

- **NFR Testing Guide**: `documents/test/NFR-TESTING-GUIDE.md` - Comprehensive guide
- **NFR Quick Reference**: `documents/test/NFR-QUICK-REFERENCE.md` - Quick commands
- **Test Plan**: `documents/test/ku-connect-test-plan.md` - Original requirements

---

## 🎯 Summary

### File Purposes
| File | Purpose | When to Use |
|------|---------|-------------|
| `nfr-setup.js` | Global setup/teardown | Required in all NFR tests |
| `nfr-helpers/setup.js` | Auth & user management | When you need custom users/tokens |
| `jwt-security.test.js` | Authentication tests | Testing login, tokens, RBAC |
| `data-protection.test.js` | Data security tests | Testing encryption, protection |
| `response-time.test.js` | Performance tests | Testing speed, concurrency |
| `error-handling.test.js` | Reliability tests | Testing error handling, transactions |

### Test Structure Template
```javascript
const { setupNFRTests, teardownNFRTests } = require('../nfr-setup')
const request = require('supertest')
const app = require('../../src/app')

let testContext

describe('My NFR Test Suite', () => {
  beforeAll(async () => {
    testContext = await setupNFRTests()
  })

  afterAll(async () => {
    await teardownNFRTests(testContext)
  })

  it('should do something', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', testContext.tokens.student)
    
    expect(response.status).toBe(200)
  })
})
```

---

**Last Updated**: 2024
**Version**: 1.0
**Maintained By**: KU-Connect Backend Team
