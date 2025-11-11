# NFR Testing Quick Reference

## 🚀 Quick Start Commands

```bash
# Run all NFR tests
npm run test:nfr

# Run specific NFR categories
npm run test:security      # Security tests only
npm run test:performance   # Performance tests only
npm run test:reliability   # Reliability tests only

# Run with coverage
npm run test:coverage
```

---

## 📂 Test File Structure

```
tests/
├── security/
│   ├── jwt-security.test.js         # NFR-1.1, 1.2
│   └── data-protection.test.js      # NFR-7.1, 7.2, 7.3
├── performance/
│   ├── response-time.test.js        # NFR-2.1, 2.2
│   └── artillery-load-test.yml      # Load testing config
└── reliability/
    └── error-handling.test.js       # NFR-4.1, 4.2
```

---

## 🎯 NFR Coverage Map

| NFR ID | Test File | Test Type | Status |
|--------|-----------|-----------|--------|
| NFR-1.1 | `jwt-security.test.js` | Unit/Integration | ✅ Created |
| NFR-1.2 | `jwt-security.test.js` | Unit/Integration | ✅ Created |
| NFR-1.3 | `jwt-security.test.js` | Manual/Load | ⚠️ Partial |
| NFR-2.1 | `response-time.test.js` | Integration | ✅ Created |
| NFR-2.2 | `response-time.test.js`, `artillery-load-test.yml` | Load Testing | ✅ Created |
| NFR-3.x | Covered by existing functional tests | - | ✅ Implicit |
| NFR-4.1 | `error-handling.test.js` | Integration | ✅ Created |
| NFR-4.2 | `error-handling.test.js` | Integration | ✅ Created |
| NFR-5.x | Covered by existing functional tests | - | ✅ Implicit |
| NFR-6.x | Manual review | - | 📋 Manual |
| NFR-7.1 | `data-protection.test.js` | Unit | ✅ Created |
| NFR-7.2 | `data-protection.test.js` | Unit | ✅ Created |
| NFR-7.3 | `data-protection.test.js` | Unit | ✅ Created |

---

## 🔧 Prerequisites

### Install Load Testing Tools (Optional)

```bash
# Artillery (recommended)
npm install -g artillery

# OR k6 (alternative)
# Download from https://k6.io/docs/getting-started/installation/
```

### Environment Setup

```bash
export NODE_ENV=test
export DATABASE_URL="postgresql://test_db"
export ACCESS_TOKEN_SECRET="test-secret-key"
```

---

## 📊 Performance Benchmarks

### Response Time Targets (NFR-2.1)
- **All endpoints**: < 3 seconds
- **Expected**: Most endpoints < 1 second

### Concurrency Targets (NFR-2.2)
- **Minimum**: 100 concurrent users
- **Target**: 200+ concurrent users

### Error Rate
- **Maximum**: < 1% under load
- **Target**: < 0.1% under normal load

---

## 🧪 Testing Workflow

### 1. Development Phase
```bash
# Run NFR tests alongside functional tests
npm run test:nfr
```

### 2. Pre-Commit
```bash
# Quick NFR check
npm run test:security
npm run test:reliability
```

### 3. Pre-Release
```bash
# Full test suite including load testing
npm run test:coverage

# Manual load test with Artillery
cd tests/performance
artillery run artillery-load-test.yml
```

### 4. Production Monitoring
```bash
# Monitor live performance metrics
# - Response times
# - Error rates
# - Concurrent users
# - Memory usage
```

---

## 🐛 Common Issues & Solutions

### Issue: Performance tests timeout
**Solution**: Increase Jest timeout or optimize database queries
```javascript
jest.setTimeout(30000) // Increase to 30 seconds
```

### Issue: Security tests fail on rate limiting
**Solution**: Rate limiting may not be implemented yet - this is expected
```javascript
// Document requirement for future implementation
console.log('Rate limiting: NOT YET IMPLEMENTED')
```

### Issue: Load tests show high response times
**Solution**: 
1. Check database indexes
2. Optimize N+1 queries
3. Enable connection pooling
4. Scale up resources

### Issue: Artillery not found
**Solution**: Install globally
```bash
npm install -g artillery
```

---

## 📈 Success Criteria

### ✅ All NFR Tests Pass When:
- [ ] JWT security tests pass (no token spoofing)
- [ ] All endpoints respond < 3 seconds
- [ ] System handles 100+ concurrent users
- [ ] Error handling returns user-friendly messages
- [ ] Passwords are bcrypt hashed (cost >= 10)
- [ ] No SQL injection vulnerabilities
- [ ] Transaction rollbacks work correctly
- [ ] No memory leaks detected

---

## 📚 Documentation References

- **Full Guide**: `documents/test/NFR-TESTING-GUIDE.md`
- **Test Plan**: `documents/test/ku-connect-test-plan.md`
- **Artillery Config**: `tests/performance/artillery-load-test.yml`

---

## 💡 Pro Tips

1. **Run NFR tests in isolation** to avoid interference from functional tests
2. **Use production-like data** for load testing (seed database properly)
3. **Monitor system resources** during load tests (CPU, memory, DB connections)
4. **Document performance baselines** for future comparison
5. **Run load tests on dedicated test environment**, not local machines

---

**Updated**: November 2025  
**Team**: Backend QA - AvengerDisassemble
