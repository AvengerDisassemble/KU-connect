// Run auth controller tests
const { execSync } = require('child_process');
const path = require('path');

process.env.NODE_ENV = 'test';

const jestPath = path.join(__dirname, 'node_modules', 'jest', 'bin', 'jest.js');
const testPath1 = path.join(__dirname, 'tests', 'src', 'controllers', 'authController.staff-admin.test.js');
const testPath2 = path.join(__dirname, 'tests', 'src', 'auth.test.js');

try {
  console.log('Running Auth Controller Tests...\n');
  execSync(`node "${jestPath}" "${testPath1}" "${testPath2}" --runInBand --verbose --forceExit`, {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('\n✅ All tests passed!');
} catch (error) {
  console.error('\n❌ Some tests failed');
  process.exit(1);
}
