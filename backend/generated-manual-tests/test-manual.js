const request = require('supertest')
const app = require('../src/app')

async function testBasicEndpoints() {
  console.log('Testing basic endpoints...')
  
  try {
    // Test server is responding
    console.log('\n1. Testing server response...')
    const healthResponse = await request(app)
      .get('/api/example')
      .expect(200)
    console.log('✅ Server is responding')

    // Test alumni registration
    console.log('\n2. Testing alumni registration...')
    const alumniData = {
      name: 'John',
      surname: 'Doe', 
      email: 'john.test@ku.th',
      password: 'Password123',
      degreeTypeId: 1,
      address: '123 Test Street, Bangkok, Thailand'
    }

    const registerResponse = await request(app)
      .post('/api/register/alumni')
      .send(alumniData)
    
    console.log('Response status:', registerResponse.status)
    console.log('Response body:', JSON.stringify(registerResponse.body, null, 2))
    
    if (registerResponse.status === 201) {
      console.log('✅ Alumni registration successful')
      
      // Test login
      console.log('\n3. Testing login...')
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          email: alumniData.email,
          password: alumniData.password
        })
      
      console.log('Login status:', loginResponse.status)
      console.log('Login body:', JSON.stringify(loginResponse.body, null, 2))
      
      if (loginResponse.status === 200) {
        console.log('✅ Login successful')
      } else {
        console.log('❌ Login failed')
      }
    } else {
      console.log('❌ Alumni registration failed')
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testBasicEndpoints()