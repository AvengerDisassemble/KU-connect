/**
 * @fileoverview Global NFR Test Setup
 * @description Sets up test environment for all NFR tests
 * Runs once before all NFR tests start
 */

const { createNFRTestUsers, cleanupNFRTestUsers } = require('./nfr-helpers/setup')
const prisma = require('../src/models/prisma')

let nfrTestContext = null

/**
 * Global setup for NFR tests
 * Creates test users and stores them in global context
 */
async function setupNFRTests() {
  try {
    console.log('\n🔧 Setting up NFR test environment...\n')
    
    // Clean up any existing NFR test data
    await cleanupNFRTestUsers()
    
    // Create fresh NFR test users
    nfrTestContext = await createNFRTestUsers()
    
    // Make context globally available
    global.nfrTestContext = nfrTestContext
    
    console.log('✅ NFR test users created successfully')
    console.log('   - Student:', nfrTestContext.users.student.email)
    console.log('   - Employer:', nfrTestContext.users.employer.email)
    console.log('   - Admin:', nfrTestContext.users.admin.email)
    console.log('   - Professor:', nfrTestContext.users.professor.email)
    console.log('')
    
    return nfrTestContext
  } catch (error) {
    console.error('❌ Failed to setup NFR tests:', error)
    throw error
  }
}

/**
 * Global teardown for NFR tests
 * Cleans up test users after all NFR tests complete
 * Note: Does NOT disconnect Prisma - that's handled by tests/setup.js
 */
async function teardownNFRTests() {
  try {
    console.log('\n🧹 Cleaning up NFR test environment...\n')
    await cleanupNFRTestUsers()
    console.log('✅ NFR test cleanup completed\n')
  } catch (error) {
    console.error('❌ Failed to cleanup NFR tests:', error)
    // Don't throw - cleanup should be best-effort
  }
}

module.exports = {
  setupNFRTests,
  teardownNFRTests,
  getNFRTestContext: () => global.nfrTestContext
}
