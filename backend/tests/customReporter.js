/**
 * Custom Jest Reporter to show failed tests summary at the end
 */

// Store reference to original console before it gets mocked
const originalConsole = console

class CustomReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig
    this._options = options
    this.failedTests = []
    this.passedTests = 0
    this.totalTests = 0
    // Use process.stderr.write to bypass console mocking
    this.write = (msg) => process.stderr.write(msg + '\n')
  }

  onRunStart(results, options) {
    this.write('\n🧪 Running tests...\n')
  }

  onTestResult(test, testResult, aggregatedResult) {
    const fileName = testResult.testFilePath.replace(process.cwd(), '').replace(/\\/g, '/')
    
    if (testResult.numFailingTests > 0) {
      this.write(`❌ FAIL ${fileName}`)
      this.failedTests.push({
        testFilePath: fileName,
        failureMessages: testResult.testResults
          .filter(t => t.status === 'failed')
          .map(t => ({
            title: t.fullName,
            message: this._cleanErrorMessage(t.failureMessages.join('\n'))
          }))
      })
    } else {
      this.write(`✅ PASS ${fileName}`)
    }
    
    this.passedTests += testResult.numPassingTests
    this.totalTests += testResult.numPassingTests + testResult.numFailingTests
  }

  _cleanErrorMessage(message) {
    // Remove excessive whitespace and stack traces for cleaner output
    const lines = message.split('\n')
    const cleanLines = []
    let skipStackTrace = false
    let inMinifiedCode = false
    
    for (const line of lines) {
      // Detect minified Prisma runtime code
      if (line.match(/function \w+\([^)]*\){/) || 
          (line.includes('let t=') && line.includes('let r=')) ||
          line.includes('src/generated/prisma/runtime/library.js') ||
          line.includes('.getPropertyValue') ||
          (line.length > 200 && line.match(/[a-z]\([a-z]\)/))) {
        inMinifiedCode = true
        continue
      }
      
      // Skip internal Jest and Prisma stack traces
      if (line.includes('at Object.<anonymous>') || 
          line.includes('at async') ||
          line.includes('src/generated/prisma/runtime') ||
          line.includes('node_modules') ||
          line.includes('at Nn (') ||
          line.includes('at ei.') ||
          line.includes('at a (')) {
        skipStackTrace = true
        continue
      }
      
      // Reset flags on empty lines or new test errors
      if (line.trim() === '' || line.includes('●')) {
        inMinifiedCode = false
        skipStackTrace = false
      }
      
      // Keep expect() errors and Prisma validation errors
      if (line.includes('expect(') || 
          line.includes('Expected:') || 
          line.includes('Received:') ||
          line.includes('PrismaClientValidationError') ||
          line.includes('Argument') ||
          line.includes('Invalid') ||
          line.includes('●') ||
          line.match(/^\s*\d+\s*\|/)) {  // Line numbers like "189 |"
        skipStackTrace = false
        inMinifiedCode = false
        cleanLines.push(line)
      } else if (!skipStackTrace && !inMinifiedCode && line.trim()) {
        cleanLines.push(line)
      }
    }
    
    // Limit to reasonable length and remove consecutive empty lines
    const filtered = cleanLines
      .filter((line, i, arr) => {
        if (line.trim() === '') {
          return i === 0 || arr[i - 1].trim() !== ''
        }
        return true
      })
      .slice(0, 20)  // Show up to 20 relevant lines
    
    return filtered.join('\n')
  }

  onRunComplete(contexts, results) {
    if (this.failedTests.length > 0) {
      this.write('\n')
      this.write('='.repeat(80))
      this.write('📋 FAILED TESTS SUMMARY')
      this.write('='.repeat(80))
      this.write('')

      this.failedTests.forEach((test, index) => {
        this.write(`\n${index + 1}. File: ${test.testFilePath}`)
        this.write('-'.repeat(80))
        test.failureMessages.forEach(failure => {
          this.write(`   ❌ ${failure.title}`)
          this.write('')
          // Split and write line by line to ensure visibility
          failure.message.split('\n').forEach(line => this.write(line))
          this.write('')
        })
      })

      this.write('='.repeat(80))
      this.write(`📊 Test Suites: ${results.numFailedTestSuites} failed, ${results.numPassedTestSuites} passed, ${results.numTotalTestSuites} total`)
      this.write(`📊 Tests:       ${results.numFailedTests} failed, ${results.numPassedTests} passed, ${results.numTotalTests} total`)
      this.write('='.repeat(80))
      this.write('')
      this.write('💡 Tip: Run with SHOW_LOGS=true npm test to see detailed logs')
      this.write('')
    } else {
      this.write('')
      this.write('='.repeat(80))
      this.write('✅ All tests passed!')
      this.write(`📊 Test Suites: ${results.numPassedTestSuites} passed, ${results.numTotalTestSuites} total`)
      this.write(`📊 Tests:       ${results.numPassedTests} passed, ${results.numTotalTests} total`)
      this.write('='.repeat(80))
      this.write('')
    }
  }
}

module.exports = CustomReporter
