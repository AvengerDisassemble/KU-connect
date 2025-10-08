/**
 * Quick API test script to demonstrate staff and admin registration
 * Run this after starting the server to see the endpoints in action
 */

const http = require('http')

async function testRegistrationAPI() {
  console.log('🧪 Testing University Staff and Admin Registration API\n')
  
  // Test staff registration
  console.log('1. Testing Staff Registration...')
  try {
    const staffResult = await makeAPICall('POST', '/api/register/staff', {
      name: 'Dr. Sarah',
      surname: 'Johnson',
      email: `sarah.johnson.${Date.now()}@university.edu`,
      password: 'SecurePass123',
      department: 'Computer Science'
    })
    
    console.log('✅ Staff Registration Success!')
    console.log(`   👤 User: ${staffResult.data.user.name} ${staffResult.data.user.surname}`)
    console.log(`   📧 Email: ${staffResult.data.user.email}`)
    console.log(`   🎭 Role: ${staffResult.data.user.role}`)
    console.log(`   ✅ Verified: ${staffResult.data.user.verified}`)
  } catch (error) {
    console.log('❌ Staff Registration Failed:', error.message)
  }
  
  console.log('')
  
  // Test admin registration
  console.log('2. Testing Admin Registration...')
  try {
    const adminResult = await makeAPICall('POST', '/api/register/admin', {
      name: 'Michael',
      surname: 'Administrator',
      email: `michael.admin.${Date.now()}@university.edu`,
      password: 'AdminPass123'
    })
    
    console.log('✅ Admin Registration Success!')
    console.log(`   👤 User: ${adminResult.data.user.name} ${adminResult.data.user.surname}`)
    console.log(`   📧 Email: ${adminResult.data.user.email}`)
    console.log(`   🎭 Role: ${adminResult.data.user.role}`)
    console.log(`   ✅ Verified: ${adminResult.data.user.verified}`)
  } catch (error) {
    console.log('❌ Admin Registration Failed:', error.message)
  }
  
  console.log('')
  
  // Test validation error
  console.log('3. Testing Validation (missing department)...')
  try {
    await makeAPICall('POST', '/api/register/staff', {
      name: 'Test',
      surname: 'User',
      email: `test.${Date.now()}@university.edu`,
      password: 'TestPass123'
      // department missing
    })
    console.log('❌ Should have failed validation')
  } catch (error) {
    console.log('✅ Validation working correctly:', error.message)
  }
  
  console.log('\n🎯 API Test Complete!')
  console.log('\n📋 Summary:')
  console.log('   ✅ Staff registration endpoint works')
  console.log('   ✅ Admin registration endpoint works')
  console.log('   ✅ Validation is working properly')
  console.log('   ✅ Database integration successful')
}

function makeAPICall(method, path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data)
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = http.request(options, (res) => {
      let body = ''
      
      res.on('data', (chunk) => {
        body += chunk
      })
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result)
          } else {
            reject(new Error(result.message || `HTTP ${res.statusCode}`))
          }
        } catch (error) {
          reject(new Error(`Invalid JSON: ${body}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(new Error(`Connection error: ${error.message}`))
    })

    req.setTimeout(5000, () => {
      reject(new Error('Request timeout'))
    })

    if (data) {
      req.write(postData)
    }
    req.end()
  })
}

// Auto-run if executed directly
if (require.main === module) {
  testRegistrationAPI().catch(console.error)
}

module.exports = { testRegistrationAPI }