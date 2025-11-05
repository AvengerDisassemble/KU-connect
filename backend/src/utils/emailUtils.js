const nodemailer = require('nodemailer')

/**
 * Create email transporter
 * Uses SMTP configuration from environment variables
 * Falls back to ethereal email for development/testing if no SMTP config
 */
async function createTransporter () {
  // Check if SMTP configuration exists
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  // Fallback to Ethereal Email for development/testing
  // This creates a test account that doesn't actually send emails
  console.warn('⚠️  No SMTP configuration found. Using Ethereal Email (test mode)')
  const testAccount = await nodemailer.createTestAccount()
  
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  })
}

/**
 * Send welcome email to newly created professor
 * 
 * @param {Object} data - Email data
 * @param {string} data.name - Professor's first name
 * @param {string} data.surname - Professor's last name
 * @param {string} data.email - Professor's email address
 * @param {string} data.department - Professor's department
 * @param {string} [data.temporaryPassword] - Temporary password (if auto-generated)
 * @returns {Promise<boolean>} True if email sent successfully, false otherwise
 * 
 * @example
 * await sendProfessorWelcomeEmail({
 *   name: 'John',
 *   surname: 'Smith',
 *   email: 'john.smith@ku.ac.th',
 *   department: 'Computer Science',
 *   temporaryPassword: 'Abc123!@#'
 * })
 */
async function sendProfessorWelcomeEmail (data) {
  const { name, surname, email, department, temporaryPassword } = data

  try {
    const transporter = await createTransporter()

    const loginUrl = process.env.FRONTEND_URL 
      ? `${process.env.FRONTEND_URL}/login`
      : 'http://localhost:5173/login'

    const changePasswordUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/profile/security`
      : 'http://localhost:5173/profile/security'

    // Email subject
    const subject = 'Welcome to KU-Connect - Your Professor Account'

    // HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #1e40af;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 5px 5px;
          }
          .credentials-box {
            background-color: #fff;
            border: 2px solid #3b82f6;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
          }
          .credentials-box h3 {
            margin-top: 0;
            color: #1e40af;
          }
          .credential-item {
            margin: 10px 0;
          }
          .credential-label {
            font-weight: bold;
            color: #4b5563;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background-color: #f3f4f6;
            padding: 5px 10px;
            border-radius: 3px;
            display: inline-block;
            margin-top: 5px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .warning {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
          }
          ul {
            padding-left: 20px;
          }
          li {
            margin: 8px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to KU-Connect</h1>
        </div>
        <div class="content">
          <h2>Hello ${name} ${surname},</h2>
          
          <p>Welcome to KU-Connect! An administrator has created a professor account for you in the <strong>${department}</strong> department.</p>
          
          ${temporaryPassword ? `
            <div class="credentials-box">
              <h3>🔐 Your Login Credentials</h3>
              <div class="credential-item">
                <div class="credential-label">Email:</div>
                <div class="credential-value">${email}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">Temporary Password:</div>
                <div class="credential-value">${temporaryPassword}</div>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Important Security Notice:</strong>
              <p>This is a <strong>temporary password</strong>. For security reasons, please change your password immediately after your first login.</p>
            </div>
          ` : `
            <p>You can now log in using the password you set up with the administrator.</p>
          `}

          <h3>What you can do with your account:</h3>
          <ul>
            <li>📊 View comprehensive student analytics and job search progress</li>
            <li>👥 Monitor students in your department</li>
            <li>📈 Track application trends and success rates</li>
            <li>🎓 Filter and sort students by various criteria</li>
            <li>📋 View detailed student profiles and application history</li>
          </ul>

          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Login to KU-Connect</a>
          </div>

          ${temporaryPassword ? `
            <h3>Next Steps:</h3>
            <ol>
              <li>Click the button above to log in</li>
              <li>Use your email and temporary password</li>
              <li>Go to <a href="${changePasswordUrl}">Profile Settings → Security</a></li>
              <li>Change your password to something secure and memorable</li>
            </ol>
          ` : ''}

          <p>If you have any questions or need assistance, please contact the system administrator.</p>

          <p>Best regards,<br>
          <strong>KU-Connect Team</strong></p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} KU-Connect. All rights reserved.</p>
        </div>
      </body>
      </html>
    `

    // Plain text version (fallback for email clients that don't support HTML)
    const textContent = `
Welcome to KU-Connect

Hello ${name} ${surname},

Welcome to KU-Connect! An administrator has created a professor account for you in the ${department} department.

${temporaryPassword ? `
Your Login Credentials:
Email: ${email}
Temporary Password: ${temporaryPassword}

⚠️ IMPORTANT: This is a temporary password. Please change it immediately after your first login for security reasons.
` : `
You can now log in using the password you set up with the administrator.
`}

What you can do with your account:
- View comprehensive student analytics and job search progress
- Monitor students in your department
- Track application trends and success rates
- Filter and sort students by various criteria
- View detailed student profiles and application history

Login URL: ${loginUrl}

${temporaryPassword ? `
Next Steps:
1. Visit the login page
2. Use your email and temporary password
3. Go to Profile Settings → Security
4. Change your password to something secure and memorable
` : ''}

If you have any questions or need assistance, please contact the system administrator.

Best regards,
KU-Connect Team

---
This is an automated email. Please do not reply to this message.
© ${new Date().getFullYear()} KU-Connect. All rights reserved.
    `.trim()

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"KU-Connect" <noreply@ku-connect.com>',
      to: email,
      subject,
      text: textContent,
      html: htmlContent
    })

    // Log success
    console.log('✅ Professor welcome email sent successfully')
    console.log('   To:', email)
    console.log('   Message ID:', info.messageId)

    // If using Ethereal, provide preview URL
    if (info.messageId && !process.env.SMTP_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      console.log('   Preview URL:', previewUrl)
      console.log('   ℹ️  Note: Email not actually sent (test mode). Use preview URL to view.')
    }

    return true
  } catch (error) {
    console.error('❌ Failed to send professor welcome email:', error.message)
    console.error('   Recipient:', email)
    if (error.code) {
      console.error('   Error code:', error.code)
    }
    
    // Don't throw error - email failure shouldn't fail account creation
    return false
  }
}

/**
 * Send generic email
 * Can be used for other email types in the future
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content (optional)
 * @returns {Promise<boolean>} True if email sent successfully
 */
async function sendEmail (options) {
  const { to, subject, text, html } = options

  try {
    const transporter = await createTransporter()

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"KU-Connect" <noreply@ku-connect.com>',
      to,
      subject,
      text,
      html: html || text
    })

    console.log('✅ Email sent successfully')
    console.log('   To:', to)
    console.log('   Subject:', subject)
    console.log('   Message ID:', info.messageId)

    if (info.messageId && !process.env.SMTP_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info)
      console.log('   Preview URL:', previewUrl)
    }

    return true
  } catch (error) {
    console.error('❌ Failed to send email:', error.message)
    console.error('   Recipient:', to)
    return false
  }
}

module.exports = {
  sendProfessorWelcomeEmail,
  sendEmail
}
