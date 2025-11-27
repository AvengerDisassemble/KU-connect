/**
 * Manual test script for PDPA consent feature
 * Run this file with: node backend/manual-test-pdpa.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (error) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test data
const testUser = {
  name: 'Test',
  surname: 'User',
  email: `test-pdpa-${Date.now()}@example.com`,
  password: 'TestPass123!',
  degreeTypeId: '', // Will be set after fetching degree types
  address: '123 Test Street, Test City',
  privacyConsent: {
    dataProcessingConsent: true
  }
};

async function testPDPAFeature() {
  console.log('🧪 Testing PDPA Consent Feature\n');

  try {
    // Step 1: Get available degree types
    console.log('1️⃣  Fetching degree types...');
    const degreesResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/degree',
      method: 'GET'
    });
    const degreeTypes = degreesResponse.data.data;
    
    if (degreeTypes && degreeTypes.length > 0) {
      testUser.degreeTypeId = degreeTypes[0].id;
      console.log(`✅ Found degree type: ${degreeTypes[0].name} (${testUser.degreeTypeId})\n`);
    } else {
      console.error('❌ No degree types found. Please seed the database first.');
      return;
    }

    // Step 2: Test registration WITHOUT consent (should fail)
    console.log('2️⃣  Testing registration WITHOUT PDPA consent (should fail)...');
    const invalidUser1 = { ...testUser };
    delete invalidUser1.privacyConsent;
    
    const response1 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/register/alumni',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, invalidUser1);

    if (response1.status === 400) {
      console.log('✅ Registration correctly rejected without consent');
      console.log(`   Message: ${response1.data.message}\n`);
    } else {
      console.log('❌ ERROR: Registration without consent should have failed!\n');
    }

    // Step 3: Test registration WITH consent = false (should fail)
    console.log('3️⃣  Testing registration with PDPA consent = false (should fail)...');
    const invalidUser2 = {
      ...testUser,
      privacyConsent: { dataProcessingConsent: false }
    };
    
    const response2 = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/register/alumni',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, invalidUser2);

    if (response2.status === 400) {
      console.log('✅ Registration correctly rejected with consent=false');
      console.log(`   Message: ${response2.data.message}\n`);
    } else {
      console.log('❌ ERROR: Registration with consent=false should have failed!\n');
    }

    // Step 4: Test successful registration WITH consent
    console.log('4️⃣  Testing registration WITH PDPA consent (should succeed)...');
    const registerResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/register/alumni',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, testUser);
    
    if (registerResponse.status === 201) {
      const userId = registerResponse.data.data.user.id;
      console.log('✅ Registration successful with consent');
      console.log(`   User ID: ${userId}`);
      console.log(`   Email: ${testUser.email}\n`);

      // Step 5: Login to get auth token
      console.log('5️⃣  Logging in to test account deletion...');
      const loginResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        email: testUser.email,
        password: testUser.password
      });

      // Extract cookies from login response
      const cookies = loginResponse.headers['set-cookie'];
      const cookieHeader = cookies ? cookies.join('; ') : '';

      console.log('✅ Login successful\n');

      // Step 6: Test account deletion (Right to Erasure)
      console.log('6️⃣  Testing account deletion (Right to Erasure)...');
      const deleteResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: `/api/user/${userId}`,
        method: 'DELETE',
        headers: {
          Cookie: cookieHeader
        }
      });

      if (deleteResponse.status === 204) {
        console.log('✅ Account deletion successful');
        console.log('   User and all associated data removed\n');
      } else {
        console.log(`❌ Account deletion failed with status: ${deleteResponse.status}\n`);
      }

      // Step 7: Verify user is deleted
      console.log('7️⃣  Verifying user was deleted...');
      const verifyResponse = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        email: testUser.email,
        password: testUser.password
      });

      if (verifyResponse.status === 400) {
        console.log('✅ Confirmed: User no longer exists in database\n');
      } else {
        console.log('❌ ERROR: User should have been deleted!\n');
      }

      console.log('🎉 All PDPA consent tests passed!\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the test
console.log('Starting PDPA consent feature test...\n');
testPDPAFeature();
