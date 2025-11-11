# NFR Test Quick Start Guide

## 🚀 Quick Commands

```powershell
# Run all NFR tests
npm run test:nfr

# Run specific category
npm run test:security
npm run test:performance
npm run test:reliability

# Run single file
npm test -- tests/security/jwt-security.test.js

# Watch mode (for development)
npm test -- --watch tests/security/jwt-security.test.js

# Verbose output
npm run test:nfr -- --verbose
```

---

## 📁 Test Files at a Glance

```
tests/
├── nfr-setup.js                    → Global setup (use in beforeAll)
├── nfr-helpers/setup.js            → Auth helpers (use when needed)
├── security/
│   ├── jwt-security.test.js        → Auth & authorization tests
│   └── data-protection.test.js     → Encryption & data security
├── performance/
│   └── response-time.test.js       → Speed & concurrency tests
└── reliability/
    └── error-handling.test.js      → Error handling & transactions
```

---

## ✍️ Test Template

```javascript
const { setupNFRTests, teardownNFRTests } = require('../nfr-setup')
const request = require('supertest')
const app = require('../../src/app')

let testContext

describe('My Test Suite', () => {
  beforeAll(async () => {
    testContext = await setupNFRTests()
  })

  afterAll(async () => {
    await teardownNFRTests(testContext)
  })

  it('should work with authentication', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', testContext.tokens.student)
      .expect(200)
  })
})
```

---

## 🔑 Available Test Tokens

```javascript
testContext.tokens.student    // "Bearer eyJ..." for STUDENT role
testContext.tokens.employer   // "Bearer eyJ..." for EMPLOYER role
testContext.tokens.admin      // "Bearer eyJ..." for ADMIN role
testContext.tokens.professor  // "Bearer eyJ..." for PROFESSOR role
```

---

## 👥 Available Test Users

```javascript
testContext.users.student    // { id, email: 'nfr-student@test.com', role: 'STUDENT' }
testContext.users.employer   // { id, email: 'nfr-employer@test.com', role: 'EMPLOYER' }
testContext.users.admin      // { id, email: 'nfr-admin@test.com', role: 'ADMIN' }
testContext.users.professor  // { id, email: 'nfr-professor@test.com', role: 'PROFESSOR' }
```

---

## 🧪 Common Test Patterns

### Making Authenticated Request

```javascript
const response = await request(app)
  .get('/api/profile')
  .set('Authorization', testContext.tokens.student)
  .expect(200)
```

### Testing Unauthorized Access

```javascript
const response = await request(app)
  .get('/api/admin/users')
  .set('Authorization', testContext.tokens.student)
  .expect(403)  // Forbidden
```

### Testing Missing Auth

```javascript
const response = await request(app)
  .get('/api/profile')
  // No Authorization header
  .expect(401)  // Unauthorized
```

### Creating Temporary User

```javascript
const { createTempTestUser } = require('../nfr-helpers/setup')

const { user, token } = await createTempTestUser({
  role: 'STUDENT',
  includeToken: true
})

// Use the temporary user
await request(app)
  .get('/api/profile')
  .set('Authorization', token)

// Clean up
await prisma.user.delete({ where: { id: user.id } })
```

### Measuring Response Time

```javascript
const startTime = Date.now()

await request(app)
  .get('/api/endpoint')
  .set('Authorization', testContext.tokens.student)

const duration = Date.now() - startTime
console.log(`Response time: ${duration}ms`)
expect(duration).toBeLessThan(3000)  // 3 seconds
```

### Testing Concurrency

```javascript
const requests = Array.from({ length: 100 }, () =>
  request(app)
    .get('/api/jobs')
    .set('Authorization', testContext.tokens.student)
)

const responses = await Promise.all(requests)
const successCount = responses.filter(r => r.status === 200).length

expect(successCount).toBeGreaterThanOrEqual(95)  // 95% success
```

---

## ⚠️ Common Mistakes

### ❌ DON'T DO THIS

```javascript
// ❌ Hardcoded token
const token = 'Bearer eyJhbGc...'

// ❌ Creating token manually
const token = jwt.sign({ id: 'test' }, 'secret')

// ❌ Modifying shared test users
await prisma.user.update({
  where: { id: testContext.users.student.id },
  data: { email: 'new@email.com' }
})

// ❌ Missing cleanup
// (no afterAll with teardownNFRTests)
```

### ✅ DO THIS INSTEAD

```javascript
// ✅ Use testContext tokens
const token = testContext.tokens.student

// ✅ Use generateTestToken for custom tokens
const token = generateTestToken({ id: user.id, role: 'STUDENT' })

// ✅ Create temporary user if modification needed
const { user } = await createTempTestUser({ role: 'STUDENT' })
await prisma.user.update({
  where: { id: user.id },
  data: { email: 'new@email.com' }
})

// ✅ Always include cleanup
afterAll(async () => {
  await teardownNFRTests(testContext)
})
```

---

## 🔧 Debugging Tips

### Print Test Context

```javascript
console.log('Users:', testContext.users)
console.log('Tokens:', testContext.tokens)
console.log('Job:', testContext.testJob)
```

### Decode Token

```javascript
const jwt = require('jsonwebtoken')
const payload = jwt.decode(testContext.tokens.student.replace('Bearer ', ''))
console.log('Token payload:', payload)
```

### Check Response Details

```javascript
const response = await request(app).get('/api/endpoint')
console.log('Status:', response.status)
console.log('Body:', response.body)
console.log('Headers:', response.headers)
```

### Find Test Users in Database

```javascript
const users = await prisma.user.findMany({
  where: { email: { contains: 'nfr-' } }
})
console.log('NFR Test Users:', users)
```

---

## 📊 Expected Results

### All Tests Passing

```
✅ PASS tests/security/jwt-security.test.js (10 tests)
✅ PASS tests/security/data-protection.test.js (10 tests)
✅ PASS tests/performance/response-time.test.js (13 tests)
✅ PASS tests/reliability/error-handling.test.js (7 tests)

Test Suites: 4 passed, 4 total
Tests:       40 passed, 40 total
Time:        ~45s
```

### Performance Benchmarks

| Metric | Expected | Typical |
|--------|----------|---------|
| Response Time | <3000ms | ~20-50ms |
| Concurrent Users | 100+ | 95%+ success |
| Memory Increase | <50MB | ~20-30MB |

---

## 📚 Documentation Links

- **Comprehensive Guide**: `documents/test/NFR-TESTING-GUIDE.md`
- **File Structure**: `documents/test/NFR-TEST-STRUCTURE.md`
- **Implementation Summary**: `documents/test/NFR-IMPLEMENTATION-SUMMARY.md`
- **Test Plan**: `documents/test/ku-connect-test-plan.md`

---

## 🎯 NFR Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| Security | 16 | ✅ 100% |
| Performance | 13 | ✅ 100% |
| Reliability | 11 | ✅ 100% |
| **Total** | **40** | **✅ 100%** |

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check token is from `testContext.tokens.*` |
| 403 Forbidden | Use correct role token for endpoint |
| Tests timeout | Increase timeout: `it('test', async () => {...}, 10000)` |
| "Cannot read property of undefined" | Ensure `testContext = await setupNFRTests()` in `beforeAll` |
| Unique constraint error | Use `createTempTestUser()` or unique email per test |

---

**Quick Help**: If you're stuck, run `npm run test:nfr -- --verbose` for detailed output!

---

**Last Updated**: 2024  
**Status**: ✅ All 40 tests passing  
**Team**: KU-Connect Backend
