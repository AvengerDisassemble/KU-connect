# Secret Rotation Guide
## JWT Secret and Sensitive Credentials Rotation Procedures

**Last Updated:** November 21, 2024  
**Applies To:** KU Connect Backend

---

## Overview

This document outlines procedures for rotating sensitive secrets and credentials used by the KU Connect application. Regular secret rotation is a critical security practice that mitigates the risk of credential compromise and maintains compliance with OWASP ASVS V10.4.2.

---

## Table of Contents

1. [JWT Secret Rotation](#jwt-secret-rotation)
2. [Database Password Rotation](#database-password-rotation)
3. [OAuth Client Secret Rotation](#oauth-client-secret-rotation)
4. [Email Service API Key Rotation](#email-service-api-key-rotation)
5. [Encryption Key Rotation](#encryption-key-rotation)
6. [Automated Rotation with AWS Secrets Manager](#automated-rotation-with-aws-secrets-manager)
7. [Emergency Rotation Procedures](#emergency-rotation-procedures)

---

## JWT Secret Rotation

### Frequency
**Recommended:** Every 90 days  
**Minimum:** Every 180 days  
**Emergency:** Immediately upon suspected compromise

### Procedure

#### 1. Generate New Secret

```bash
# Generate a strong 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2. Dual-Secret Acceptance Period (Zero-Downtime Rotation)

To avoid invalidating active sessions, implement a 24-hour dual-secret acceptance window:

**Step 2a: Update Code to Accept Both Secrets**

Edit `backend/src/utils/tokenUtils.js`:

```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET_PRIMARY = process.env.JWT_SECRET;
const JWT_SECRET_SECONDARY = process.env.JWT_SECRET_OLD; // Old secret

function verifyAccessToken(token) {
  try {
    // Try primary secret first
    return jwt.verify(token, JWT_SECRET_PRIMARY);
  } catch (primaryError) {
    if (JWT_SECRET_SECONDARY) {
      try {
        // Fallback to old secret during rotation window
        console.warn('Token verified with OLD secret - rotation in progress');
        return jwt.verify(token, JWT_SECRET_SECONDARY);
      } catch (secondaryError) {
        throw primaryError; // Throw original error
      }
    }
    throw primaryError;
  }
}

// Always sign new tokens with PRIMARY secret
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET_PRIMARY, { expiresIn: '15m' });
}
```

**Step 2b: Deploy Updated Code**

```bash
# Deploy code that accepts both secrets
git add src/utils/tokenUtils.js
git commit -m "feat: support dual JWT secret for rotation"
git push origin main

# Deploy to production
# (Use your CI/CD pipeline)
```

**Step 2c: Update Environment Variables**

```bash
# Set new primary secret and keep old as secondary
JWT_SECRET=<new_secret_64_chars>
JWT_SECRET_OLD=<current_secret_64_chars>
```

Restart application:
```bash
pm2 restart ku-connect-backend
```

#### 3. Wait 24 Hours

During this period:
- New tokens are issued with the NEW secret
- Old tokens (signed with OLD secret) are still accepted
- All tokens expire naturally (max: 15 minutes for access, 7 days for refresh)

#### 4. Remove Old Secret

After 24 hours, remove `JWT_SECRET_OLD`:

```bash
# Remove JWT_SECRET_OLD from .env
JWT_SECRET=<new_secret_64_chars>
# JWT_SECRET_OLD removed
```

**Revert code to single-secret verification:**

```javascript
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
```

Deploy and restart.

---

## Database Password Rotation

### Frequency
**Recommended:** Every 180 days  
**Minimum:** Annually  
**Emergency:** Immediately upon suspected compromise

### Procedure

#### 1. Generate New Password

```bash
# Generate 32-character password
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

#### 2. Create New Database User (Zero-Downtime)

```sql
-- PostgreSQL example
CREATE USER ku_connect_new WITH PASSWORD '<new_password>';
GRANT ALL PRIVILEGES ON DATABASE ku_connect TO ku_connect_new;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ku_connect_new;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ku_connect_new;
```

#### 3. Update Connection String

```bash
# Update DATABASE_URL in production environment
DATABASE_URL=postgresql://ku_connect_new:<new_password>@localhost:5432/ku_connect
```

#### 4. Restart Application

```bash
pm2 restart ku-connect-backend
```

#### 5. Verify Connectivity

```bash
# Test database connection
npm run db:test
```

#### 6. Remove Old User (After 24 Hours)

```sql
-- After confirming new user works
DROP USER ku_connect_old;
```

---

## OAuth Client Secret Rotation

### Frequency
**Recommended:** Every 180 days  
**Google OAuth:** When prompted by Google Security Alerts

### Procedure

#### 1. Generate New Client Secret

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Find your OAuth 2.0 Client
4. Click **"Add Secret"** or **"Reset Secret"**
5. Copy new `GOOGLE_CLIENT_SECRET`

#### 2. Update Environment Variables

```bash
GOOGLE_CLIENT_ID=<client_id>
GOOGLE_CLIENT_SECRET=<new_secret>
```

#### 3. Restart Application

```bash
pm2 restart ku-connect-backend
```

#### 4. Test OAuth Flow

```bash
# Navigate to login page and test Google Sign-In
curl -I https://your-domain.com/auth/google
```

#### 5. Delete Old Secret (After Testing)

Return to Google Cloud Console and delete the old secret.

---

## Email Service API Key Rotation

### Frequency
**Recommended:** Every 180 days  
**SendGrid/AWS SES:** Follow provider guidelines

### Procedure

#### 1. Generate New API Key

**SendGrid:**
1. Go to [SendGrid Settings](https://app.sendgrid.com/settings/api_keys)
2. Create New API Key
3. Set **Full Access** or **Mail Send** permissions
4. Copy key immediately (shown only once)

**AWS SES:**
```bash
aws iam create-access-key --user-name ku-connect-ses
```

#### 2. Update Environment Variables

```bash
# SendGrid
SENDGRID_API_KEY=<new_api_key>

# OR AWS SES
AWS_SES_ACCESS_KEY_ID=<new_access_key_id>
AWS_SES_SECRET_ACCESS_KEY=<new_secret_key>
```

#### 3. Restart Application

```bash
pm2 restart ku-connect-backend
```

#### 4. Test Email Sending

```bash
# Send test email via API
curl -X POST http://localhost:8000/api/test/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"admin@example.com","subject":"Test"}'
```

#### 5. Delete Old API Key

Delete old key from SendGrid/AWS IAM after confirming new key works.

---

## Encryption Key Rotation

### Frequency
**Recommended:** Every 180 days  
**Used For:** Token encryption, sensitive data encryption

### Procedure

#### 1. Generate New Encryption Key

```bash
# Generate 32-byte encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 2. Implement Key Versioning

Edit `backend/src/utils/encryptionUtils.js`:

```javascript
const crypto = require('crypto');

const ENCRYPTION_KEY_V2 = Buffer.from(process.env.ENCRYPTION_KEY_V2, 'hex');
const ENCRYPTION_KEY_V1 = Buffer.from(process.env.ENCRYPTION_KEY_V1, 'hex'); // Old key

function encrypt(text, version = 2) {
  const key = version === 2 ? ENCRYPTION_KEY_V2 : ENCRYPTION_KEY_V1;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Prepend version byte
  return `${version}:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedText) {
  const [version, ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const key = version === '2' ? ENCRYPTION_KEY_V2 : ENCRYPTION_KEY_V1;
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

#### 3. Re-encrypt Sensitive Data

Create migration script `scripts/reencrypt-data.js`:

```javascript
const prisma = require('../src/models/prisma');
const { encrypt, decrypt } = require('../src/utils/encryptionUtils');

async function reencryptMfaSecrets() {
  const users = await prisma.user.findMany({
    where: { mfaSecret: { not: null } },
  });

  for (const user of users) {
    // Decrypt with old key (v1)
    const decrypted = decrypt(user.mfaSecret); // Auto-detects version
    
    // Re-encrypt with new key (v2)
    const reencrypted = encrypt(decrypted, 2);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { mfaSecret: reencrypted },
    });
  }

  console.log(`Re-encrypted ${users.length} MFA secrets`);
}

reencryptMfaSecrets();
```

Run migration:
```bash
node scripts/reencrypt-data.js
```

#### 4. Remove Old Key (After Migration)

```bash
# Remove ENCRYPTION_KEY_V1 from .env
ENCRYPTION_KEY_V2=<new_key>
# ENCRYPTION_KEY_V1 removed
```

---

## Automated Rotation with AWS Secrets Manager

### Setup

#### 1. Store Secrets in AWS Secrets Manager

```bash
# Store JWT secret
aws secretsmanager create-secret \
  --name ku-connect/jwt-secret \
  --secret-string '{"JWT_SECRET":"<secret>"}'

# Enable automatic rotation
aws secretsmanager rotate-secret \
  --secret-id ku-connect/jwt-secret \
  --rotation-lambda-arn arn:aws:lambda:region:account:function:ku-connect-rotate \
  --rotation-rules AutomaticallyAfterDays=90
```

#### 2. Create Lambda Rotation Function

```javascript
// lambda/rotate-jwt-secret.js
const AWS = require('aws-sdk');
const crypto = require('crypto');
const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {
  const token = event.Token;
  const step = event.Step;

  if (step === 'createSecret') {
    // Generate new secret
    const newSecret = crypto.randomBytes(32).toString('hex');
    await secretsManager.putSecretValue({
      SecretId: event.SecretId,
      SecretString: JSON.stringify({ JWT_SECRET: newSecret }),
      VersionStages: ['AWSPENDING'],
    }).promise();
  }

  if (step === 'setSecret') {
    // Dual-secret period (handled by application)
    console.log('Waiting for dual-secret acceptance period...');
  }

  if (step === 'testSecret') {
    // Test new secret
    const secret = await secretsManager.getSecretValue({
      SecretId: event.SecretId,
      VersionStage: 'AWSPENDING',
    }).promise();
    console.log('Testing new JWT secret...');
    // Perform health check
  }

  if (step === 'finishSecret') {
    // Promote AWSPENDING to AWSCURRENT
    await secretsManager.updateSecretVersionStage({
      SecretId: event.SecretId,
      VersionStage: 'AWSCURRENT',
      MoveToVersionId: token,
      RemoveFromVersionId: event.Step,
    }).promise();
  }
};
```

#### 3. Update Application to Fetch from AWS

```javascript
// backend/src/config/secrets.js
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function getJwtSecret() {
  const response = await secretsManager.getSecretValue({
    SecretId: 'ku-connect/jwt-secret',
  }).promise();
  
  const secret = JSON.parse(response.SecretString);
  return secret.JWT_SECRET;
}

module.exports = { getJwtSecret };
```

---

## Emergency Rotation Procedures

### When to Trigger Emergency Rotation

- Secret appears in version control history
- Secret exposed in logs or error messages
- Suspected unauthorized access to production environment
- Security breach or data leak
- Notification from security scanner (e.g., GitGuardian, Snyk)

### Emergency Steps

#### 1. **IMMEDIATE: Revoke Compromised Secret**

```bash
# Invalidate all JWT tokens
# Option A: Change JWT_SECRET immediately (users logged out)
JWT_SECRET=<new_emergency_secret>
pm2 restart ku-connect-backend

# Option B: Revoke all refresh tokens in database
psql $DATABASE_URL -c "DELETE FROM \"RefreshToken\";"
```

#### 2. **Notify Security Team**

```bash
# Send alert
curl -X POST https://slack.webhook.url \
  -d '{"text":"SECURITY ALERT: JWT secret rotation initiated due to suspected compromise"}'
```

#### 3. **Audit Access Logs**

```bash
# Check for suspicious access patterns
grep "401\|403" /var/log/nginx/access.log | tail -1000
```

#### 4. **Follow Standard Rotation Procedure**

After immediate revocation, follow the standard rotation procedure to establish new secrets with proper dual-acceptance periods.

#### 5. **Post-Incident Review**

- Document incident in security log
- Update secret scanning rules
- Review access controls
- Conduct security training if needed

---

## Rotation Schedule Summary

| Secret Type | Frequency | Next Rotation | Responsible |
|-------------|-----------|---------------|-------------|
| JWT Secret | 90 days | TBD | DevOps Team |
| Database Password | 180 days | TBD | DBA |
| OAuth Client Secret | 180 days | TBD | DevOps Team |
| Email API Key | 180 days | TBD | DevOps Team |
| Encryption Keys | 180 days | TBD | Security Team |

---

## Checklist Template

Use this checklist for each rotation:

```markdown
## Rotation: [SECRET_TYPE] - [DATE]

- [ ] New secret generated
- [ ] Dual-secret acceptance deployed (if applicable)
- [ ] Environment variables updated
- [ ] Application restarted
- [ ] Functionality tested
- [ ] 24-hour wait period (if applicable)
- [ ] Old secret removed
- [ ] Incident log updated
- [ ] Next rotation scheduled
```

---

## References

- **OWASP ASVS V10.4.2:** Secrets Rotation
- **NIST SP 800-57:** Key Management Recommendations
- **AWS Secrets Manager:** [Automatic Rotation Guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/rotating-secrets.html)

---

**Document Maintenance:**  
Review this document quarterly and update procedures as infrastructure evolves.

**Contact:** DevOps Team - devops@ku-connect.example.com
