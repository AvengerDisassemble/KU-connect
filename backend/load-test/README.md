# 🔥 Load Testing Guide for KU Connect Backend

This directory contains load testing scripts and configurations for the KU Connect backend API.

## Tools Available

### 1. Artillery (Recommended for CI/CD)

**Installation:**
```bash
npm install -g artillery
```

**Run Basic Load Test:**
```bash
# Make sure your server is running first
npm start

# In another terminal, run the load test
artillery run load-test/artillery.yml
```

**Generate HTML Report:**
```bash
artillery run --output report.json load-test/artillery.yml
artillery report report.json
```

**Quick Test:**
```bash
artillery quick --count 10 --num 50 http://localhost:3000/api/jobs
```

### 2. K6 (Recommended for Advanced Testing)

**Installation:**
- Windows: `choco install k6` or download from https://k6.io/
- macOS: `brew install k6`
- Linux: See https://k6.io/docs/getting-started/installation/

**Run Load Test:**
```bash
k6 run load-test/k6-test.js
```

**Run with Custom Settings:**
```bash
# 50 virtual users for 60 seconds
k6 run --vus 50 --duration 60s load-test/k6-test.js

# Custom base URL
k6 run -e BASE_URL=http://production-url.com load-test/k6-test.js
```

**Cloud Testing (Optional):**
```bash
k6 cloud load-test/k6-test.js
```

### 3. Apache JMeter (GUI-based)

**Installation:**
1. Download from https://jmeter.apache.org/download_jmeter.cgi
2. Extract and run `bin/jmeter.bat` (Windows) or `bin/jmeter` (Linux/Mac)

**Setup:**
1. Create Thread Group (simulates users)
2. Add HTTP Request Samplers
3. Add Listeners (View Results Tree, Summary Report)
4. Configure and run

## Load Test Scenarios

### Artillery Configuration

The `artillery.yml` file includes 4 test phases:

1. **Warm-up (30s)**: 5 users/second
2. **Normal Load (60s)**: 20 users/second
3. **Peak Load (60s)**: 50 users/second  
4. **Stress Test (30s)**: 100 users/second

**Scenarios Tested:**
- Authentication and profile access (30% weight)
- Job browsing and search (40% weight)
- Profile management (20% weight)
- Admin operations (5% weight)
- Notifications (5% weight)

### K6 Configuration

The `k6-test.js` file includes 5 stages:

1. **Warm-up (30s)**: Ramp up to 10 virtual users
2. **Normal Load (1m)**: 20 concurrent users
3. **Peak Load (1m)**: 50 concurrent users
4. **Stress Test (1m)**: 100 concurrent users
5. **Cool Down (30s)**: Ramp down to 0

**Performance Thresholds:**
- 95th percentile: < 1.5 seconds
- 99th percentile: < 3 seconds
- Error rate: < 5%

## Understanding Results

### Key Metrics to Monitor

1. **Response Time**
   - p50 (median): 50% of requests complete within this time
   - p95: 95% of requests complete within this time
   - p99: 99% of requests complete within this time

2. **Throughput**
   - Requests per second (RPS)
   - Data transferred per second

3. **Error Rate**
   - HTTP error status codes (4xx, 5xx)
   - Connection errors
   - Timeouts

4. **Resource Usage** (monitor separately)
   - CPU utilization
   - Memory consumption
   - Database connections
   - Disk I/O

### Success Criteria (from Test Plan)

- ✅ 95% of requests < 3 seconds
- ✅ Error rate < 5%
- ✅ System stable under 100 concurrent users
- ✅ No memory leaks during extended tests

## Running Load Tests

### Step-by-Step Process

1. **Prepare Environment**
   ```bash
   # Start your backend server
   cd backend
   npm start
   ```

2. **Run Load Test**
   ```bash
   # Artillery (in new terminal)
   artillery run load-test/artillery.yml
   
   # OR K6
   k6 run load-test/k6-test.js
   ```

3. **Monitor Server**
   ```bash
   # Monitor CPU/Memory (Windows)
   Get-Process node | Select-Object CPU, WS
   
   # Monitor in real-time (requires admin)
   Get-Counter '\Process(node)\% Processor Time','\Process(node)\Working Set'
   ```

4. **Analyze Results**
   - Check response times (p95, p99)
   - Review error rates
   - Identify bottlenecks
   - Compare with baseline metrics

### Integration with CI/CD

Add to your GitHub Actions or CI pipeline:

```yaml
- name: Load Testing
  run: |
    npm start &
    sleep 10
    artillery run load-test/artillery.yml
  env:
    NODE_ENV: test
```

## Interpreting Results

### Good Results Example
```
Summary report
  Scenarios launched:  1000
  Scenarios completed: 1000
  Requests completed:  5000
  Mean response time:  245 ms
  p95 response time:   890 ms
  p99 response time:   1240 ms
  Errors:             0
```

### Poor Results Example (Needs Optimization)
```
Summary report
  Scenarios launched:  1000
  Scenarios completed: 875
  Requests completed:  4200
  Mean response time:  3450 ms
  p95 response time:   8900 ms
  p99 response time:   15240 ms
  Errors:             125 (connection timeout)
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure backend server is running
   - Check port number (default: 3000)
   - Verify firewall settings

2. **High Error Rate**
   - Check server logs for errors
   - Verify database connection pool size
   - Review authentication logic

3. **Slow Response Times**
   - Check database query performance
   - Review N+1 query problems
   - Consider adding caching
   - Optimize expensive operations

4. **Memory Leaks**
   - Monitor memory over time
   - Check for unclosed database connections
   - Review event listener cleanup
   - Use heap snapshots for analysis

## Best Practices

1. **Start Small**: Begin with low load and gradually increase
2. **Isolate Tests**: Test one scenario at a time initially
3. **Baseline Metrics**: Record normal performance before optimizing
4. **Monitor Resources**: Watch CPU, memory, database during tests
5. **Test Realistic Scenarios**: Simulate actual user behavior
6. **Document Results**: Keep records of performance over time
7. **Test Regularly**: Include in CI/CD pipeline

## Advanced Testing

### Soak Testing (Endurance)
Test system stability over extended periods:

```bash
# Artillery: 2 hours with moderate load
artillery run --config '{"phases": [{"duration": 7200, "arrivalRate": 10}]}' load-test/artillery.yml

# K6: 1 hour with constant load
k6 run --vus 20 --duration 1h load-test/k6-test.js
```

### Spike Testing
Test system recovery from sudden traffic spikes:

```bash
# K6 spike test
k6 run --stage 1m:10,30s:200,1m:10 load-test/k6-test.js
```

## Resources

- [Artillery Documentation](https://www.artillery.io/docs)
- [K6 Documentation](https://k6.io/docs/)
- [Apache JMeter](https://jmeter.apache.org/)
- [Performance Testing Checklist](https://www.perfmatrix.com/performance-testing-checklist/)

## Questions?

See the main test documentation or contact the Backend QA Team.
