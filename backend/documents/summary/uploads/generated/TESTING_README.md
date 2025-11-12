# Testing Guide

## Running Tests

### Basic Test Commands

```bash
# Run all tests (default - clean output)
npm test

# Run tests with detailed logs (for debugging)
npm run test:verbose

# Run only failed tests from previous run
npm run test:failures

# Run tests in silent mode (minimal output)
npm run test:quiet
```

### Environment Variables

You can control test output verbosity with environment variables:

```bash
# Show all console logs during tests
SHOW_LOGS=true npm test

# PowerShell (Windows)
$env:SHOW_LOGS="true"; npm test
```

## Test Output Explained

### Clean Mode (Default)

By default, tests run with **clean output**:

- ✅ Suppresses application console.log, console.warn, console.info
- ✅ Filters out noisy console.error messages from controllers/services
- ✅ Shows test results clearly
- ✅ Displays failed tests summary at the end

### What You'll See

**During Test Run:**

```
PASS  tests/controllers/authController.test.js
PASS  tests/controllers/profileController.test.js
FAIL  tests/controllers/jobController.test.js
  ● Job Controller › should create job
    Expected: 201
    Received: 400
```

**After All Tests:**

```
================================================================================
📋 FAILED TESTS SUMMARY
================================================================================

1. File: /tests/controllers/jobController.test.js
--------------------------------------------------------------------------------
   ❌ Job Controller › should create job

   expect(received).toBe(expected)
   Expected: 201
   Received: 400

================================================================================
📊 Test Suites: 1 failed, 25 passed, 26 total
📊 Tests:       2 failed, 199 passed, 201 total
================================================================================

💡 Tip: Run with SHOW_LOGS=true npm test to see detailed logs
```

## Debugging Failed Tests

### Step 1: Read the Summary

After tests complete, check the **FAILED TESTS SUMMARY** at the bottom. This shows:

- Which test file failed
- Which specific test case failed
- The actual error message

### Step 2: Run with Verbose Logging

If you need more details:

```bash
# Windows PowerShell
$env:SHOW_LOGS="true"; npm test

# Linux/Mac
SHOW_LOGS=true npm test
```

### Step 3: Run Only Failed Tests

To quickly re-run failed tests:

```bash
npm run test:failures
```

### Step 4: Run a Specific Test File

```bash
npx jest tests/controllers/jobController.test.js
```

### Step 5: Run a Specific Test Case

```bash
npx jest -t "should create job"
```

## Understanding Test Errors

### Common Error Patterns

#### 1. Schema Validation Errors

```
PrismaClientValidationError:
Argument `companyName` is missing.
```

**Solution**: Check the Prisma schema and ensure all required fields are provided in test data.

#### 2. Status Code Mismatches

```
expect(received).toBe(expected)
Expected: 201
Received: 500
```

**Solution**: Run with `SHOW_LOGS=true` to see the actual error, or check server logs.

#### 3. Duplicate Key Errors

```
Unique constraint failed on the fields: (`email`)
```

**Solution**: Ensure test cleanup is happening properly, or use unique test data.

## Test Configuration Files

- **`jest.config.js`** - Main Jest configuration
- **`tests/setup.js`** - Console suppression and cleanup hooks
- **`tests/customReporter.js`** - Custom reporter for clean summaries

## Tips for Writing Tests

1. **Use descriptive test names**:

   ```javascript
   it("should return 404 when job does not exist", async () => {
     // test code
   });
   ```

2. **Clean up test data**:

   ```javascript
   afterEach(async () => {
     await prisma.job.deleteMany();
   });
   ```

3. **Use factories for test data** (see `tests/factories/` if available)

4. **Test one thing per test case**

5. **Mock external dependencies** (S3, email services, etc.)

## Troubleshooting

### Tests hang or don't exit

- Check for unclosed database connections
- Ensure async operations are properly awaited
- Review the `forceExit` setting in `jest.config.js`

### Too much noise in test output

- Use default `npm test` (already configured for clean output)
- Add more patterns to suppress in `tests/setup.js`

### Need to see all logs for debugging

- Use `npm run test:verbose` or `SHOW_LOGS=true npm test`

### Tests are too slow

- Tests run sequentially (`maxWorkers: 1`) to avoid database conflicts
- Consider splitting large test files
- Mock database operations where appropriate

## CI/CD Integration

In CI pipelines, use:

```bash
# Standard test run with clean output
npm test

# Or with explicit verbosity
npm run test:summary
```

The custom reporter will show a clear summary of failures at the end, making it easy to identify issues in CI logs.
