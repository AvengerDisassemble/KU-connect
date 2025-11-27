// Run PDPA consent tests
const { execSync } = require('child_process');
const path = require('path');

process.env.NODE_ENV = 'test';

const jestPath = path.join(__dirname, 'node_modules', 'jest', 'bin', 'jest.js');
const testPath = path.join(__dirname, 'tests', 'services', 'pdpaConsent.test.js');

try {
  console.log('Running PDPA Consent Tests...\n');
  execSync(`node "${jestPath}" "${testPath}" --runInBand --verbose --forceExit`, {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Some tests failed');
  process.exit(1);
}
