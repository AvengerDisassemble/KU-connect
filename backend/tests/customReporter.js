/**
 * Custom Jest Reporter to show failed tests summary at the end
 */

class CustomReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig
    this._options = options
    this.failedTests = []
  }

  onTestResult(test, testResult, aggregatedResult) {
    if (testResult.numFailingTests > 0) {
      this.failedTests.push({
        testFilePath: testResult.testFilePath.replace(process.cwd(), ''),
        failureMessages: testResult.testResults
          .filter(t => t.status === 'failed')
          .map(t => ({
            title: t.fullName,
            message: t.failureMessages.join('\n')
          }))
      })
    }
  }

  onRunComplete(contexts, results) {
    if (this.failedTests.length > 0) {
      console.log('\n\n========================================')
      console.log('📋 FAILED TESTS SUMMARY')
      console.log('========================================\n')

      this.failedTests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.testFilePath}`)
        test.failureMessages.forEach(failure => {
          console.log(`   ❌ ${failure.title}`)
        })
        console.log('')
      })

      console.log('========================================')
      console.log(`Total Failed Test Suites: ${results.numFailedTestSuites}`)
      console.log(`Total Failed Tests: ${results.numFailedTests}`)
      console.log('========================================\n')
    } else {
      console.log('\n✅ All tests passed!\n')
    }
  }
}

module.exports = CustomReporter
