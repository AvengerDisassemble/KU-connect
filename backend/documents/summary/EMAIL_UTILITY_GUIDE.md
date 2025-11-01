# Email Utility Guide

## Overview

The email utility (`src/utils/emailUtils.js`) provides email sending functionality for KU-Connect using [Nodemailer](https://nodemailer.com/). It includes professional HTML email templates and automatic fallback to test mode when SMTP is not configured.

## Features

- ✅ HTML email templates with responsive design
- ✅ Plain text fallback for all emails
- ✅ Automatic test mode using Ethereal Email (no SMTP needed for development)
- ✅ Production-ready SMTP support
- ✅ Welcome emails for new professor accounts
- ✅ Extensible for future email types

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Email / SMTP Configuration
SMTP_HOST="smtp.gmail.com"          # SMTP server host
SMTP_PORT="587"                      # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE="false"                  # true for port 465, false for other ports
SMTP_USER="your-email@gmail.com"    # SMTP username
SMTP_PASS="your-app-password"       # SMTP password/app password
SMTP_FROM="KU-Connect <noreply@ku-connect.com>"  # From address

# Frontend URL (used for login links in emails)
FRONTEND_URL="http://localhost:5173"
```

### Gmail Configuration

If using Gmail:

1. Go to Google Account Settings → Security
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password
4. Use this app password as `SMTP_PASS`

### Other SMTP Providers

**SendGrid:**
```bash
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
```

**AWS SES:**
```bash
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-aws-smtp-username"
SMTP_PASS="your-aws-smtp-password"
```

**Mailgun:**
```bash
SMTP_HOST="smtp.mailgun.org"
SMTP_PORT="587"
SMTP_USER="postmaster@your-domain.mailgun.org"
SMTP_PASS="your-mailgun-password"
```

### Development Mode (No SMTP)

If no SMTP configuration is provided, the utility automatically uses **Ethereal Email** test mode:

- ✅ No configuration needed
- ✅ Emails are not actually sent
- ✅ Preview URLs are logged to console
- ✅ Perfect for development and testing

Console output:
```
⚠️  No SMTP configuration found. Using Ethereal Email (test mode)
✅ Professor welcome email sent successfully
   To: john.smith@ku.ac.th
   Message ID: <abc123@ethereal.email>
   Preview URL: https://ethereal.email/message/abc123
   ℹ️  Note: Email not actually sent (test mode). Use preview URL to view.
```

## Available Functions

### `sendProfessorWelcomeEmail(data)`

Sends a welcome email to a newly created professor account.

**Parameters:**
```javascript
{
  name: string,              // Professor's first name
  surname: string,           // Professor's last name
  email: string,             // Professor's email address
  department: string,        // Professor's department
  temporaryPassword?: string // Optional: auto-generated password
}
```

**Returns:** `Promise<boolean>` - `true` if sent successfully, `false` otherwise

**Example:**
```javascript
const { sendProfessorWelcomeEmail } = require('../utils/emailUtils')

const emailSent = await sendProfessorWelcomeEmail({
  name: 'John',
  surname: 'Smith',
  email: 'john.smith@ku.ac.th',
  department: 'Computer Science',
  temporaryPassword: 'TempPass123!'
})

if (emailSent) {
  console.log('Welcome email sent successfully')
}
```

**Email Template Preview:**

The email includes:
- 🎨 Professional HTML design with KU-Connect branding
- 🔐 Login credentials (email + temporary password)
- ⚠️ Security warning to change password
- 🔗 Direct login button
- 📋 List of professor features
- 📝 Step-by-step instructions

### `sendEmail(options)`

Generic email sending function for custom emails.

**Parameters:**
```javascript
{
  to: string,      // Recipient email
  subject: string, // Email subject
  text: string,    // Plain text content
  html?: string    // Optional: HTML content
}
```

**Returns:** `Promise<boolean>`

**Example:**
```javascript
const { sendEmail } = require('../utils/emailUtils')

await sendEmail({
  to: 'user@example.com',
  subject: 'Important Notice',
  text: 'This is a plain text email',
  html: '<p>This is an <strong>HTML</strong> email</p>'
})
```

## Usage in Admin Service

The `createProfessorUser` function in `adminService.js` automatically sends welcome emails:

```javascript
const result = await createProfessorUser({
  name: 'John',
  surname: 'Smith',
  email: 'john.smith@ku.ac.th',
  department: 'Computer Science',
  sendWelcomeEmail: true  // default: true
})

// Response includes email status
console.log(result.emailSent)  // true or false
```

## Error Handling

The email utility is designed to **never fail the main operation**:

- ❌ If email sending fails, the error is logged but not thrown
- ✅ Account creation proceeds normally
- ✅ Return value indicates email status
- ✅ Admin can manually send credentials if needed

**Console Logging:**

Success:
```
✅ Professor welcome email sent successfully
   To: john.smith@ku.ac.th
   Message ID: <abc123@ethereal.email>
```

Failure:
```
❌ Failed to send professor welcome email: Connection timeout
   Recipient: john.smith@ku.ac.th
   Error code: ETIMEDOUT
```

## Testing

### Manual Testing

1. **Test Mode (No SMTP):**
   ```bash
   # Don't set SMTP variables
   npm run dev
   ```
   - Create a professor account
   - Check console for preview URL
   - Open URL in browser to view email

2. **Production Mode (With SMTP):**
   ```bash
   # Set SMTP variables in .env
   SMTP_HOST="smtp.gmail.com"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   
   npm run dev
   ```
   - Create a professor account
   - Check recipient's inbox

### Automated Testing

Mock nodemailer in tests:

```javascript
jest.mock('nodemailer')

const nodemailer = require('nodemailer')
const { sendProfessorWelcomeEmail } = require('../utils/emailUtils')

describe('Email Utils', () => {
  it('should send welcome email', async () => {
    const mockSendMail = jest.fn().mockResolvedValue({
      messageId: 'test-message-id'
    })

    nodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail
    })

    const result = await sendProfessorWelcomeEmail({
      name: 'John',
      surname: 'Smith',
      email: 'test@example.com',
      department: 'CS'
    })

    expect(result).toBe(true)
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com'
      })
    )
  })
})
```

## Adding New Email Types

To add a new email type (e.g., password reset, application notification):

1. **Create Email Template:**
```javascript
async function sendPasswordResetEmail(data) {
  const { name, email, resetToken } = data
  
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body>
      <h1>Password Reset Request</h1>
      <p>Hello ${name},</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
    </body>
    </html>
  `
  
  const textContent = `
    Password Reset Request
    
    Hello ${name},
    
    Visit this link to reset your password:
    ${resetUrl}
  `
  
  try {
    const transporter = await createTransporter()
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"KU-Connect" <noreply@ku-connect.com>',
      to: email,
      subject: 'Password Reset Request',
      text: textContent,
      html: htmlContent
    })
    
    return true
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return false
  }
}

module.exports = {
  sendProfessorWelcomeEmail,
  sendPasswordResetEmail  // Export new function
}
```

2. **Use in Service:**
```javascript
const { sendPasswordResetEmail } = require('../utils/emailUtils')

async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } })
  const resetToken = generateResetToken()
  
  await sendPasswordResetEmail({
    name: user.name,
    email: user.email,
    resetToken
  })
}
```

## Security Best Practices

1. ✅ **Never commit SMTP credentials** - Use environment variables
2. ✅ **Use app-specific passwords** - Don't use your main email password
3. ✅ **Limit email content** - Don't include sensitive data
4. ✅ **Use HTTPS links** - All links should be secure in production
5. ✅ **Rate limit email sending** - Prevent abuse
6. ✅ **Log failures** - Monitor email delivery issues
7. ✅ **Non-blocking operations** - Don't fail requests if email fails

## Troubleshooting

### Email Not Sending (Production)

**Issue:** Email returns `false`, not sent

**Solutions:**
1. Check SMTP credentials are correct
2. Verify SMTP port and host
3. Check firewall/network restrictions
4. Enable "Less secure app access" (Gmail)
5. Use app-specific password (Gmail)
6. Check SMTP service status

### Preview URL Not Showing (Test Mode)

**Issue:** No preview URL in console

**Solution:**
- This is normal in production mode with real SMTP
- Preview URLs only work with Ethereal Email (test mode)

### "Connection Timeout" Error

**Issue:** `ETIMEDOUT` error

**Solutions:**
1. Check internet connection
2. Verify SMTP host is correct
3. Check firewall blocking port 587/465
4. Try different SMTP port

### "Invalid Login" Error

**Issue:** Authentication failed

**Solutions:**
1. Verify SMTP_USER and SMTP_PASS
2. Use app-specific password (not regular password)
3. Check if 2FA is enabled (requires app password)

## Production Deployment

### Recommended SMTP Services

1. **SendGrid** (Recommended)
   - ✅ Free tier: 100 emails/day
   - ✅ Easy setup
   - ✅ Good deliverability

2. **AWS SES**
   - ✅ Very cheap ($0.10 per 1000 emails)
   - ✅ Highly scalable
   - ⚠️ Requires AWS account

3. **Mailgun**
   - ✅ Free tier: 5000 emails/month
   - ✅ Simple API
   - ✅ Good docs

### Deployment Checklist

- [ ] Set all SMTP environment variables
- [ ] Set correct FRONTEND_URL
- [ ] Test email sending in staging
- [ ] Monitor email delivery rates
- [ ] Set up email logs/alerts
- [ ] Configure SPF/DKIM records (for better deliverability)

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Gmail SMTP Guide](https://support.google.com/mail/answer/7126229)
- [Email Template Best Practices](https://reallygoodemails.com/)
- [MJML Email Framework](https://mjml.io/) (for complex templates)

---

**Last Updated:** November 2, 2025  
**Version:** 1.0.0
