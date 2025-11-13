/**
 * Quick test script to verify Resend email configuration
 * Run with: node test-resend.js
 */

require('dotenv').config()
const { Resend } = require('resend')

async function testResend() {
  console.log('🔍 Testing Resend Configuration...\n')

  // Check if API key exists
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in .env file')
    console.log('   Please add: RESEND_API_KEY="re_your_api_key_here"')
    process.exit(1)
  }

  console.log('✅ API Key found:', process.env.RESEND_API_KEY.substring(0, 10) + '...')

  // Initialize Resend
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Get the from email
  const fromEmail = process.env.SMTP_FROM || 'onboarding@resend.dev'
  console.log('📧 From email:', fromEmail)

  // Prompt for recipient email
  const recipientEmail = process.argv[2]
  if (!recipientEmail) {
    console.error('\n❌ Please provide a recipient email address')
    console.log('   Usage: node test-resend.js your-email@example.com')
    process.exit(1)
  }

  console.log('📧 To email:', recipientEmail)
  console.log('\n📤 Sending test email...\n')

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: [recipientEmail],
      subject: 'Test Email from KU-Connect',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1e40af; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
            .success { color: #10b981; font-size: 48px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Test Email</h1>
            </div>
            <div class="content">
              <div class="success">🎉</div>
              <h2>Success!</h2>
              <p>If you're reading this, your Resend configuration is working correctly!</p>
              <p><strong>Configuration Details:</strong></p>
              <ul>
                <li>From: ${fromEmail}</li>
                <li>To: ${recipientEmail}</li>
                <li>Time: ${new Date().toLocaleString()}</li>
              </ul>
              <p>Your KU-Connect notification system should now be able to send emails.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Success! If you're reading this, your Resend configuration is working correctly!\n\nFrom: ${fromEmail}\nTo: ${recipientEmail}\nTime: ${new Date().toLocaleString()}\n\nYour KU-Connect notification system should now be able to send emails.`
    })

    if (error) {
      console.error('❌ Resend API Error:', error)
      console.log('\n🔍 Troubleshooting:')
      console.log('   1. Check your API key is correct')
      console.log('   2. Verify your Resend account is active')
      console.log('   3. Check if you have remaining email quota')
      console.log('   4. Visit https://resend.com/dashboard to check status')
      process.exit(1)
    }

    console.log('✅ Email sent successfully!')
    console.log('   Message ID:', data.id)
    console.log('\n📬 Check your inbox at:', recipientEmail)
    console.log('   (Also check spam/junk folder)')
    console.log('\n💡 Tips:')
    console.log('   - Emails typically arrive within seconds')
    console.log('   - Check spam folder if not in inbox')
    console.log('   - Free tier has 3,000 emails/month limit')
    console.log('   - Default from address is onboarding@resend.dev')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    if (error.statusCode === 401) {
      console.log('\n🔑 Authentication Error - Your API key may be invalid')
      console.log('   Get a new one at: https://resend.com/api-keys')
    } else if (error.statusCode === 429) {
      console.log('\n⏱️  Rate limit exceeded - Wait a moment and try again')
    }
    process.exit(1)
  }
}

testResend()
