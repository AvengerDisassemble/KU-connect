# NFR Testing Guide for KU-Connect Backend

## 📋 Overview
This guide explains how to test Non-Functional Requirements (NFRs) as defined in the Test Plan.

---

## 🎯 NFR Testing Categories

### 1. Security Testing (NFR-1.x)

#### What to Test:
- JWT token security (expired, tampered, invalid)
- OAuth authentication flows
- Input validation (SQL injection, XSS)
- Password strength and hashing
- Rate limiting

#### How to Run:
```bash
# Run security tests
npm test -- tests/security/

# Specific test files
npm test -- tests/security/jwt-security.test.js
npm test -- tests/security/data-protection.test.js
```

#### Manual Security Testing:
```bash
# Test with OWASP ZAP (install first)
zap-cli quick-scan http://localhost:3000

# Test with sqlmap
sqlmap -u "http://localhost:3000/api/login" --data="email=test&password=test"

# Test rate limiting manually
for i in {1..20}; do curl -X POST http://localhost:3000/api/login; done
```

---

### 2. Performance Testing (NFR-2.x)

#### What to Test:
- Response time < 3 seconds (NFR-2.1)
- 100 concurrent users support (NFR-2.2)
- Database query optimization
- Memory usage

#### How to Run:

**A. Jest Performance Tests:**
```bash
# Run performance tests
npm test -- tests/performance/response-time.test.js
```

**B. Artillery Load Testing:**
```bash
# Install Artillery globally
npm install -g artillery

# Run load test
cd tests/performance
artillery run artillery-load-test.yml

# Generate HTML report
artillery run --output report.json artillery-load-test.yml
artillery report report.json
```

**C. Alternative: k6 Load Testing:**
```bash
# Install k6 (https://k6.io/docs/getting-started/installation/)

# Create k6 test script (k6-load-test.js):
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% under 3s
  },
};

export default function () {
  let response = http.get('http://localhost:3000/api/job/list');
  check(response, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}

# Run k6 test
k6 run k6-load-test.js
```

---

### 3. Reliability Testing (NFR-4.x)

#### What to Test:
- Graceful error handling
- Transaction rollbacks
- System stability under load
- Memory leak detection

#### How to Run:
```bash
# Run reliability tests
npm test -- tests/reliability/error-handling.test.js

# Run with memory profiling
node --expose-gc node_modules/.bin/jest tests/reliability/
```

#### Manual Reliability Testing:
```bash
# Test database connection failure
# Stop PostgreSQL temporarily and make requests

# Test with invalid JSON
curl -X POST http://localhost:3000/api/register/alumni \
  -H "Content-Type: application/json" \
  -d '{ invalid json }'

# Stress test - rapid requests
ab -n 1000 -c 100 http://localhost:3000/api/job/list
```

---

### 4. Data Security Testing (NFR-7.x)

#### What to Test:
- Password encryption (bcrypt)
- Sensitive data protection
- SQL injection prevention
- File upload validation
- Data integrity constraints

#### How to Run:
```bash
# Run data security tests
npm test -- tests/security/data-protection.test.js
```

---

## 🛠️ Setup and Prerequisites

### Install Dependencies:
```bash
# Core testing dependencies (already in package.json)
npm install --save-dev jest supertest

# Load testing tools (optional)
npm install -g artillery
npm install -g k6  # or download from k6.io

# Security testing tools (optional)
brew install zap      # macOS
apt-get install zaproxy  # Linux
```

### Environment Setup:
```bash
# Use test environment
export NODE_ENV=test
export DATABASE_URL="postgresql://test_db"
export ACCESS_TOKEN_SECRET="test-secret-key"

# Run migrations
npx prisma migrate deploy
npx prisma db seed
```

---

## 📊 Performance Metrics to Track

### Response Time Targets (NFR-2.1):
- **Target**: < 3 seconds for all API endpoints
- **Measure with**: 
  - Jest: `Date.now()` before/after requests
  - Artillery: Built-in metrics
  - k6: Built-in metrics

### Concurrency Targets (NFR-2.2):
- **Target**: Support 100 concurrent users
- **Measure with**:
  - Jest: `Promise.all()` for concurrent requests
  - Artillery: `arrivalRate` configuration
  - k6: `vus` (virtual users) option

### Memory Usage:
- **Target**: < 50MB increase per 100 requests
- **Measure with**: `process.memoryUsage().heapUsed`

---

## 🚀 Running All NFR Tests

### Quick Test Suite:
```bash
# Run all NFR tests
npm run test:nfr

# Or manually:
npm test -- tests/security/ tests/performance/ tests/reliability/
```

### Full Test Suite (Functional + NFR):
```bash
# Run all tests
npm test

# With coverage
npm run test:coverage
```

### CI/CD Integration:
```yaml
# .github/workflows/nfr-tests.yml
name: NFR Tests
on: [push, pull_request]
jobs:
  nfr-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:nfr
      
      # Load testing (on main branch only)
      - name: Install Artillery
        if: github.ref == 'refs/heads/main'
        run: npm install -g artillery
      
      - name: Run Load Tests
        if: github.ref == 'refs/heads/main'
        run: artillery run tests/performance/artillery-load-test.yml
```

---

## 📈 Interpreting Results

### Jest Test Results:
```
PASS  tests/performance/response-time.test.js
  NFR-2.1: Response Time < 3 seconds
    ✓ GET /api/jobs should respond within 3 seconds (245ms)
    ✓ POST /api/login should respond within 3 seconds (189ms)

  NFR-2.2: Concurrent User Load
    ✓ should handle 100 concurrent read requests (2341ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

### Artillery Results:
```
Summary report @ 14:30:45(+0700)
  Scenarios launched:  5000
  Scenarios completed: 5000
  Requests completed:  10000
  Mean response/sec:   83.33
  Response time (msec):
    min:    45
    max:    3210
    median: 850
    p95:    2100  ✅ (target: < 3000)
    p99:    2800  ✅ (target: < 5000)
  Scenario duration:
    min:    102
    max:    4567
  Errors: 12 (0.24%)  ✅ (target: < 1%)
```

---

## 🔍 Troubleshooting

### Performance Tests Failing:
- Check if database has indexes on searchable fields
- Verify connection pool size is appropriate
- Monitor database query logs for slow queries
- Check if test database has sufficient seed data

### Security Tests Failing:
- Ensure JWT_SECRET is set correctly
- Verify bcrypt is installed and configured
- Check if rate limiting middleware is enabled
- Validate input sanitization middleware is active

### Load Tests Timeout:
- Increase server timeout configuration
- Scale up database resources
- Check for memory leaks
- Verify connection pooling is configured

---

## 📚 Additional Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [k6 Documentation](https://k6.io/docs/)
- [Jest Performance Testing](https://jestjs.io/docs/timer-mocks)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)

---

## ✅ NFR Test Checklist

Use this checklist to track NFR testing progress:

- [ ] JWT Security (NFR-1.1)
- [ ] OAuth Security (NFR-1.2)
- [ ] Input Validation (NFR-1.3)
- [ ] Response Time < 3s (NFR-2.1)
- [ ] 100 Concurrent Users (NFR-2.2)
- [ ] Error Handling (NFR-4.1)
- [ ] Transaction Integrity (NFR-4.2)
- [ ] Password Encryption (NFR-7.1)
- [ ] Data Protection (NFR-7.2)
- [ ] SQL Injection Prevention (NFR-7.3)
- [ ] Load Testing Report Generated
- [ ] Performance Metrics Documented
- [ ] Security Audit Passed

---

**Last Updated**: November 2025
**Maintained by**: Backend QA Team
