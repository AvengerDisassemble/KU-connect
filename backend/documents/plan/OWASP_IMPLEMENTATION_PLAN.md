# OWASP ASVS Implementation Plan - KU Connect
## 6-Phase Security Enhancement Roadmap

**Project**: KU Connect Security Hardening  
**Based On**: OWASP ASVS Security Audit Report  
**Timeline**: 10 weeks (2 sprints per phase)  
**Goal**: Increase OWASP ASVS compliance from 31% → 80%

---

## 📋 Phase 1: Critical Security Fixes (Weeks 1-2)

**Objective**: Eliminate high-risk vulnerabilities that could lead to data breaches or account takeover.

**Sprint Goal**: Deploy production-ready security headers, secrets management, and brute-force protection.

### Tasks

#### 1.1 Secrets Management & Key Hardening
**Requirements**: V9.2.1, V11.4.1, V13.4.1, V13.4.4, V7.2.4

**Task 1A: Migrate to AWS Secrets Manager**
- [ ] Set up AWS Secrets Manager in AWS console
- [ ] Create secrets for:
  - `JWT_ACCESS_TOKEN_SECRET`
  - `JWT_REFRESH_TOKEN_SECRET`
  - `COOKIE_ENCRYPTION_KEY`
  - `DATABASE_URL` (production)
  - `GOOGLE_CLIENT_SECRET`
- [ ] Install AWS SDK: `npm install @aws-sdk/client-secrets-manager`
- [ ] Create `src/utils/secretsManager.js`:
  ```javascript
  // Fetch secrets from AWS Secrets Manager at startup
  // Cache secrets in memory
  // Fallback to .env for local development
  ```
- [ ] Update `server.js` to load secrets before starting server
- [ ] Test in staging environment
- [ ] **Files**: `server.js`, `src/utils/secretsManager.js`, `package.json`

**Task 1B: Generate Strong JWT Secrets**
- [ ] Generate cryptographically strong secrets:
  ```bash
  node -e "console.log('ACCESS_TOKEN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
  node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
  node -e "console.log('COOKIE_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Update production secrets in AWS Secrets Manager
- [ ] Update `.env.example` with instructions (remove weak defaults)
- [ ] Document secret generation process in `README.md`
- [ ] **Files**: `.env`, `.env.example`, `README.md`

**Task 1C: Fix Cookie Encryption Key Persistence**
- [ ] Update `src/utils/tokenUtils.js`:
  - Remove random key generation fallback
  - Require COOKIE_ENCRYPTION_KEY to be set
  - Exit with error if not found in production
- [ ] Add validation on server startup
- [ ] Test session persistence across server restarts
- [ ] **Files**: `src/utils/tokenUtils.js`, `server.js`

**Task 1D: Add Secrets Scanning to CI/CD**
- [ ] Install GitGuardian GitHub App or add TruffleHog
- [ ] Create `.github/workflows/secrets-scan.yml`:
  ```yaml
  name: Secret Scanning
  on: [push, pull_request]
  jobs:
    trufflehog:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
          with:
            fetch-depth: 0
        - uses: trufflesecurity/trufflehog@main
          with:
            path: ./
            base: ${{ github.event.repository.default_branch }}
            head: HEAD
  ```
- [ ] Add pre-commit hook to scan for secrets locally
- [ ] **Files**: `.github/workflows/secrets-scan.yml`, `.husky/pre-commit`

---

#### 1.2 HTTP Security Headers
**Requirements**: V3.4.4, V3.4.5, V4.4.1, V12.2.1

**Task 1E: Install and Configure Helmet.js**
- [ ] Install helmet: `npm install helmet`
- [ ] Update `src/app.js`:
  ```javascript
  const helmet = require('helmet');
  
  // Apply helmet with custom CSP
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // For inline styles (review if needed)
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny', // X-Frame-Options: DENY
    },
    noSniff: true, // X-Content-Type-Options: nosniff
    xssFilter: true, // X-XSS-Protection: 1; mode=block
  }));
  ```
- [ ] Test CSP doesn't break frontend (adjust directives if needed)
- [ ] Verify headers using https://securityheaders.com/
- [ ] **Files**: `src/app.js`, `package.json`

**Task 1F: Add HSTS Preload Submission**
- [ ] Test HSTS header in production
- [ ] Submit domain to https://hstspreload.org/ (if applicable)
- [ ] Document HSTS configuration in `SECURITY.md`
- [ ] **Files**: `SECURITY.md`

---

#### 1.3 Account Security
**Requirements**: V6.2.6, V6.2.2

**Task 1G: Implement Account Lockout After Failed Logins**
- [ ] Update Prisma schema:
  ```prisma
  model User {
    // ... existing fields
    failedLoginAttempts Int      @default(0)
    lockedUntil         DateTime?
  }
  ```
- [ ] Run migration: `npx prisma migrate dev --name add-account-lockout`
- [ ] Update `src/services/authService.js`:
  - Check if account is locked before validating password
  - Increment failedLoginAttempts on invalid password
  - Lock account for 15 minutes after 5 failed attempts
  - Reset failedLoginAttempts on successful login
- [ ] Add error message: "Account locked due to multiple failed login attempts. Try again in 15 minutes."
- [ ] Add admin endpoint to manually unlock accounts
- [ ] Test lockout mechanism
- [ ] **Files**: `prisma/schema.prisma`, `src/services/authService.js`, `src/controllers/adminController.js`

**Task 1H: Integrate HaveIBeenPwned API for Breached Passwords**
- [ ] Install axios: `npm install axios`
- [ ] Create `src/utils/passwordUtils.js` function:
  ```javascript
  async function isPasswordBreached(password) {
    // Hash password with SHA-1
    // Query HaveIBeenPwned API (k-anonymity model)
    // Return true if password found in breach database
  }
  ```
- [ ] Update `src/validators/authValidator.js`:
  - Call `isPasswordBreached()` during registration/password change
  - Return error if password found in breach database
- [ ] Add rate limiting to prevent API abuse
- [ ] Test with known breached passwords (e.g., "password123")
- [ ] **Files**: `src/utils/passwordUtils.js`, `src/validators/authValidator.js`

---

#### 1.4 Dependency Security
**Requirements**: V15.3.2

**Task 1I: Add Snyk Dependency Scanning**
- [ ] Sign up for Snyk free account
- [ ] Install Snyk GitHub App
- [ ] Create `.github/workflows/security.yml`:
  ```yaml
  name: Security Scan
  on: [push, pull_request]
  jobs:
    snyk:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - uses: snyk/actions/node@master
          env:
            SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
  ```
- [ ] Add Snyk badge to README.md
- [ ] Fix critical and high vulnerabilities
- [ ] Set up Snyk PR checks (auto-fail on high/critical vulns)
- [ ] **Files**: `.github/workflows/security.yml`, `README.md`

---

### Phase 1 Deliverables
- [x] Secrets stored in AWS Secrets Manager
- [x] Strong JWT secrets generated (256-bit)
- [x] Helmet middleware with CSP, HSTS, X-Frame-Options
- [x] Account lockout after 5 failed login attempts
- [x] Breached password detection (HaveIBeenPwned)
- [x] Snyk dependency scanning in CI/CD
- [x] Secrets scanning with TruffleHog/GitGuardian

### Phase 1 Success Metrics
- 🎯 Security headers score: A+ on securityheaders.com
- 🎯 Zero weak secrets in production
- 🎯 Zero critical/high dependency vulnerabilities
- 🎯 Brute force attacks mitigated (lockout working)

---

## 📋 Phase 2: Authentication & Session Hardening (Weeks 3-4)

**Objective**: Strengthen authentication mechanisms and session management.

**Sprint Goal**: Deploy MFA, session timeouts, and password security notifications.

### Tasks

#### 2.1 Multi-Factor Authentication (MFA)
**Requirements**: V6.2.7

**Task 2A: Implement TOTP-Based MFA**
- [ ] Install dependencies: `npm install speakeasy qrcode`
- [ ] Update Prisma schema:
  ```prisma
  model User {
    // ... existing fields
    mfaEnabled Boolean  @default(false)
    mfaSecret  String?  // Encrypted TOTP secret
  }
  ```
- [ ] Run migration: `npx prisma migrate dev --name add-mfa`
- [ ] Create `src/services/mfaService.js`:
  - `generateMfaSecret()` - Generate TOTP secret
  - `verifyMfaToken()` - Verify 6-digit code
  - `generateQrCode()` - Generate QR code for authenticator app
- [ ] Add MFA enrollment endpoints:
  - `POST /api/auth/mfa/enroll` - Generate secret, return QR code
  - `POST /api/auth/mfa/verify` - Verify code and enable MFA
  - `POST /api/auth/mfa/disable` - Disable MFA (requires password + code)
- [ ] Update login flow:
  - If MFA enabled, require TOTP code after password validation
  - Generate temporary token for MFA verification step
- [ ] Add recovery codes (10 single-use codes for account recovery)
- [ ] **Files**: `prisma/schema.prisma`, `src/services/mfaService.js`, `src/controllers/authController.js`

**Task 2B: Enforce MFA for Admin Users**
- [ ] Update `src/middlewares/roleMiddleware.js`:
  - Check if admin user has MFA enabled
  - Block admin operations if MFA not enabled (grace period: 7 days)
- [ ] Send email notification to admins to enable MFA
- [ ] Add admin dashboard banner prompting MFA enrollment
- [ ] **Files**: `src/middlewares/roleMiddleware.js`, `src/utils/emailUtils.js`

**Task 2C: Frontend MFA Enrollment UI**
- [ ] Create MFA enrollment page (display QR code)
- [ ] Create MFA verification page during login
- [ ] Add MFA settings in user profile
- [ ] Test MFA flow with Google Authenticator, Authy, Microsoft Authenticator
- [ ] **Files**: `frontend/src/pages/MfaEnrollPage.tsx`, `frontend/src/pages/MfaVerifyPage.tsx`

---

#### 2.2 Session Management Enhancements
**Requirements**: V7.5.1, V6.3.6, V6.3.8, V7.4.4

**Task 2D: Implement Idle Session Timeout (30 minutes)**
- [ ] Frontend: Track user activity (mouse, keyboard, scroll)
- [ ] Store `lastActivityAt` timestamp in localStorage
- [ ] Check activity every 60 seconds:
  - If idle > 30 minutes, auto-logout and redirect to login
  - Show warning modal at 25 minutes ("Session expires in 5 minutes")
- [ ] Backend: Add `lastActivityAt` to JWT payload (refresh on API calls)
- [ ] **Files**: `frontend/src/hooks/useIdleTimeout.ts`, `frontend/src/components/SessionTimeoutModal.tsx`

**Task 2E: Add Session Timeout Warnings**
- [ ] Create modal component: "Your session will expire in 5 minutes. Continue working?"
- [ ] Add "Extend Session" button (refreshes access token)
- [ ] Add countdown timer in modal
- [ ] Test timeout logic across different pages
- [ ] **Files**: `frontend/src/components/SessionTimeoutModal.tsx`

**Task 2F: Implement Concurrent Session Limits**
- [ ] Update Prisma schema:
  ```prisma
  model Session {
    id         String   @id @default(cuid())
    userId     String
    deviceId   String   // Browser fingerprint
    ipAddress  String
    userAgent  String
    createdAt  DateTime @default(now())
    lastActiveAt DateTime @default(now())
    user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }
  ```
- [ ] Run migration: `npx prisma migrate dev --name add-sessions-table`
- [ ] Update `src/services/authService.js`:
  - Track active sessions on login
  - Limit to 3 concurrent sessions per user
  - Delete oldest session if limit exceeded
- [ ] Add "Active Sessions" page in user settings (view/revoke sessions)
- [ ] **Files**: `prisma/schema.prisma`, `src/services/authService.js`, `src/controllers/authController.js`

**Task 2G: Implement Cross-Device Logout Notification**
- [ ] Option 1: WebSocket server for real-time notifications
  - Install `socket.io`: `npm install socket.io`
  - Broadcast logout event to all user sessions
- [ ] Option 2: Polling (simpler)
  - Frontend polls `/api/auth/session-status` every 30 seconds
  - Backend checks if session still valid
  - Auto-logout if session revoked
- [ ] Show notification: "You've been logged out on another device"
- [ ] **Files**: `src/services/socketService.js` or polling in `frontend/src/hooks/useSessionCheck.ts`

---

#### 2.3 Password Security Notifications
**Requirements**: V6.2.10

**Task 2H: Send Email on Password Change**
- [ ] Update `src/services/authService.js`:
  - After successful password change, send email notification
  - Include: timestamp, IP address, device info
  - Add "I didn't make this change" link (locks account, prompts password reset)
- [ ] Create email template: `src/templates/password-changed.html`
- [ ] Test email delivery (use SendGrid, AWS SES, or Nodemailer)
- [ ] Log password change events
- [ ] **Files**: `src/services/authService.js`, `src/utils/emailUtils.js`, `src/templates/password-changed.html`

---

#### 2.4 OAuth Security Enhancements
**Requirements**: V10.4.2, V6.4.2

**Task 2I: Add OAuth PKCE (Proof Key for Code Exchange)**
- [ ] Update `src/utils/passport.js`:
  - Generate `code_verifier` and `code_challenge` for OAuth flow
  - Store code_verifier in session
  - Send code_challenge to Google OAuth
  - Verify code on callback
- [ ] Validate OAuth state parameter:
  - Generate random state token on auth initiation
  - Store in session
  - Verify on callback
- [ ] Test OAuth flow with PKCE enabled
- [ ] **Files**: `src/utils/passport.js`

**Task 2J: Implement Secret Rotation Mechanism**
- [ ] Document JWT secret rotation procedure:
  1. Generate new secret in AWS Secrets Manager (version 2)
  2. Update code to accept both old and new secrets for 24 hours
  3. After 24 hours, disable old secret
- [ ] Create AWS Lambda function for automated rotation (every 90 days)
- [ ] Add monitoring for rotation failures
- [ ] **Files**: `docs/SECRET_ROTATION.md`, AWS Lambda function

---

### Phase 2 Deliverables
- [x] TOTP MFA implemented with recovery codes
- [x] MFA enforced for all admin users
- [x] 30-minute idle session timeout
- [x] Session timeout warnings (5-minute countdown)
- [x] Concurrent session limits (3 devices max)
- [x] Cross-device logout notifications
- [x] Email notifications on password changes
- [x] OAuth PKCE implemented
- [x] JWT secret rotation mechanism documented

### Phase 2 Success Metrics
- 🎯 100% of admin users have MFA enabled
- 🎯 Zero unauthorized session access
- 🎯 Password breach detection rate: 95%+ blocked
- 🎯 Session hijacking attacks prevented

---

## 📋 Phase 3: Data Protection & File Security (Weeks 5-6)

**Objective**: Protect sensitive data at rest and in transit, harden file upload security.

**Sprint Goal**: Deploy encryption at rest, malware scanning, and CSRF protection.

### Tasks

#### 3.1 Encryption at Rest
**Requirements**: V14.2.3

**Task 3A: Implement Field-Level Encryption**
- [ ] Install encryption library: `npm install @aws-sdk/client-kms` (for AWS KMS)
- [ ] Create `src/utils/encryption.js`:
  ```javascript
  // Use AWS KMS or AES-256-GCM for field encryption
  async function encryptField(plaintext) {
    // Encrypt using AWS KMS or local key
  }
  
  async function decryptField(ciphertext) {
    // Decrypt using AWS KMS or local key
  }
  ```
- [ ] Update Prisma schema (mark fields as encrypted in comments):
  ```prisma
  model User {
    email         String @unique // ENCRYPTED
    phoneNumber   String? // ENCRYPTED
  }
  model Student {
    resumeKey      String? // ENCRYPTED
    transcriptKey  String? // ENCRYPTED
  }
  ```
- [ ] Create Prisma middleware for automatic encryption/decryption:
  ```javascript
  prisma.$use(async (params, next) => {
    // Encrypt fields before write
    // Decrypt fields after read
  })
  ```
- [ ] Run data migration to encrypt existing data
- [ ] Test read/write operations
- [ ] **Files**: `src/utils/encryption.js`, `src/models/prisma.js`, `scripts/encryptExistingData.js`

**Task 3B: Document Encryption Key Management**
- [ ] Store encryption keys in AWS KMS or Secrets Manager
- [ ] Document key rotation procedure
- [ ] Add key backup/recovery process
- [ ] **Files**: `docs/ENCRYPTION_KEY_MANAGEMENT.md`

---

#### 3.2 File Upload Security Hardening
**Requirements**: V2.2.3, V2.2.1, V5.3.1

**Task 3C: Integrate ClamAV for Malware Scanning**
- [ ] Option 1: Self-hosted ClamAV
  - Install ClamAV: `sudo apt-get install clamav clamav-daemon`
  - Install Node.js client: `npm install clamscan`
- [ ] Option 2: Cloud-based (VirusTotal API)
  - Sign up for VirusTotal API key
  - Install client: `npm install virustotal-api`
- [ ] Create `src/utils/virusScanner.js`:
  ```javascript
  async function scanFile(fileBuffer) {
    // Scan file with ClamAV or VirusTotal
    // Return { clean: boolean, threats: [] }
  }
  ```
- [ ] Update `src/controllers/documents-controller/documentsController.js`:
  - Scan file before storing
  - Reject if malware detected
  - Log scan results
- [ ] Add error message: "File rejected: malware detected"
- [ ] Test with EICAR test file
- [ ] **Files**: `src/utils/virusScanner.js`, `src/controllers/documents-controller/documentsController.js`

**Task 3D: Implement Magic Number Verification**
- [ ] Install file-type library: `npm install file-type`
- [ ] Update multer fileFilter in `src/routes/documents/index.js`:
  ```javascript
  fileFilter: async (req, file, cb) => {
    const fileType = await FileType.fromBuffer(file.buffer);
    if (!fileType || !allowedMimes.includes(fileType.mime)) {
      return cb(new Error('File type mismatch'));
    }
    cb(null, true);
  }
  ```
- [ ] Test with:
  - Renamed malicious files (e.g., `malware.exe` → `malware.pdf`)
  - Polyglot files (valid in multiple formats)
- [ ] **Files**: `src/routes/documents/index.js`, `src/routes/profile/index.js`, `src/routes/jobs/index.js`

**Task 3E: Implement File Sandboxing**
- [ ] Update storage configuration:
  - Store files in isolated directory (`/var/uploads/`)
  - Set directory permissions: `chmod 700 /var/uploads/`
  - Ensure no execute permissions on files: `chmod 600 <file>`
- [ ] Add AppArmor or SELinux profile to restrict file access
- [ ] Document file storage security in `SECURITY.md`
- [ ] **Files**: `src/services/localStorage.js`, deployment scripts

---

#### 3.3 CSRF Protection
**Requirements**: V3.4.1, V3.4.2

**Task 3F: Implement CSRF Tokens**
- [ ] Install csurf middleware: `npm install csurf`
- [ ] Update `src/app.js`:
  ```javascript
  const csrf = require('csurf');
  const csrfProtection = csrf({ cookie: true });
  
  // Apply to state-changing routes
  app.use('/api', csrfProtection);
  
  // Endpoint to get CSRF token
  app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });
  ```
- [ ] Frontend: Fetch CSRF token on app load
- [ ] Include `X-CSRF-Token` header in all POST/PUT/DELETE requests
- [ ] Test CSRF protection:
  - Attempt request without token (should fail)
  - Attempt request with invalid token (should fail)
- [ ] **Files**: `src/app.js`, `frontend/src/utils/api.ts`

---

### Phase 3 Deliverables
- [x] Field-level encryption for email, phone, file keys
- [x] AWS KMS integration for key management
- [x] ClamAV/VirusTotal malware scanning on uploads
- [x] Magic number verification for file uploads
- [x] File sandboxing with restricted permissions
- [x] CSRF tokens on all state-changing operations

### Phase 3 Success Metrics
- 🎯 100% of sensitive fields encrypted at rest
- 🎯 Zero malware uploaded (100% detection rate on test files)
- 🎯 CSRF attacks prevented (100% token validation)
- 🎯 File upload bypass attempts blocked

---

## 📋 Phase 4: Logging & Monitoring (Weeks 7-8)

**Objective**: Enable security incident detection, investigation, and compliance.

**Sprint Goal**: Deploy structured logging, audit trails, and real-time alerting.

### Tasks

#### 4.1 Structured Logging
**Requirements**: V16.1.1, V16.3.4

**Task 4A: Replace console.log with Winston**
- [ ] Install Winston: `npm install winston`
- [ ] Create `src/utils/logger.js`:
  ```javascript
  const winston = require('winston');
  
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    ]
  });
  
  module.exports = logger;
  ```
- [ ] Refactor all `console.log` → `logger.info()`
- [ ] Refactor all `console.error` → `logger.error()`
- [ ] Add severity levels: debug, info, warn, error, critical
- [ ] **Files**: `src/utils/logger.js`, refactor 50+ files

**Task 4B: Add Contextual Logging**
- [ ] Include in all logs:
  - `timestamp` (ISO 8601)
  - `userId` (if authenticated)
  - `requestId` (generate UUID per request)
  - `ipAddress`
  - `userAgent`
  - `action` (e.g., "login", "file_download")
  - `resource` (e.g., "job:123")
  - `result` ("success" or "failure")
- [ ] Create middleware to attach context to req object
- [ ] **Files**: `src/middlewares/loggingMiddleware.js`

---

#### 4.2 Authentication Audit Logs
**Requirements**: V16.2.1, V16.2.3

**Task 4C: Centralize Authentication Event Logging**
- [ ] Update `src/services/authService.js` to log:
  - **Login Success**: `{ event: 'login_success', userId, ip, userAgent, timestamp }`
  - **Login Failure**: `{ event: 'login_failure', email, reason: 'invalid_password', ip, attempts }`
  - **Account Locked**: `{ event: 'account_locked', userId, reason: 'failed_attempts', lockDuration: '15min' }`
  - **Logout**: `{ event: 'logout', userId, sessionDuration }`
  - **Session Created**: `{ event: 'session_created', userId, deviceId, ip }`
  - **Session Expired**: `{ event: 'session_expired', userId, reason: 'timeout' }`
  - **Token Refreshed**: `{ event: 'token_refreshed', userId }`
  - **Password Changed**: `{ event: 'password_changed', userId, ip }`
  - **MFA Enabled**: `{ event: 'mfa_enabled', userId }`
  - **MFA Token Verified**: `{ event: 'mfa_verified', userId, success: true }`
- [ ] Store logs in dedicated `auth_audit.log` file
- [ ] **Files**: `src/services/authService.js`, `src/utils/logger.js`

---

#### 4.3 Admin Action Audit Trail
**Requirements**: V16.2.4, V8.3.1

**Task 4D: Log All Admin Operations**
- [ ] Update `src/controllers/adminController.js` to log:
  - **User Approved**: `{ event: 'user_approved', adminId, targetUserId, role }`
  - **User Rejected**: `{ event: 'user_rejected', adminId, targetUserId, reason }`
  - **User Suspended**: `{ event: 'user_suspended', adminId, targetUserId, reason, duration }`
  - **User Unsuspended**: `{ event: 'user_unsuspended', adminId, targetUserId }`
  - **Announcement Created**: `{ event: 'announcement_created', adminId, announcementId, audience }`
  - **Job Deleted**: `{ event: 'job_deleted', adminId, jobId, reason }`
- [ ] Store in `admin_audit.log`
- [ ] Create admin audit log viewer (read-only, admins only)
- [ ] **Files**: `src/controllers/adminController.js`, `src/routes/admin/auditLogs.js`

---

#### 4.4 Document Access Audit Logs
**Requirements**: V16.2.2

**Task 4E: Enhance Document Access Logging**
- [ ] Update `src/utils/auditLogger.js`:
  - Log to file instead of console
  - Add severity levels
  - Include more context (file size, download duration)
- [ ] Log all document operations:
  - Upload, download, delete, access denied
- [ ] Create document access report for admins
- [ ] **Files**: `src/utils/auditLogger.js`, `src/controllers/documents-controller/documentsController.js`

---

#### 4.5 Log Aggregation & Alerting
**Requirements**: V16.4.1, V16.5.1, V16.5.2

**Task 4F: Integrate AWS CloudWatch Logs**
- [ ] Install Winston CloudWatch transport: `npm install winston-cloudwatch`
- [ ] Update `src/utils/logger.js`:
  ```javascript
  const CloudWatchTransport = require('winston-cloudwatch');
  
  logger.add(new CloudWatchTransport({
    logGroupName: '/aws/ec2/ku-connect',
    logStreamName: `${process.env.NODE_ENV}-${Date.now()}`,
    awsRegion: process.env.AWS_REGION,
  }));
  ```
- [ ] Create CloudWatch dashboard with:
  - Failed login count (last 24h)
  - Account lockouts
  - 5xx errors
  - Average response time
- [ ] **Files**: `src/utils/logger.js`, AWS CloudWatch setup

**Task 4G: Implement Real-Time Security Alerting**
- [ ] Create CloudWatch alarms for:
  - **10+ failed logins from same IP in 5 minutes** → Alert via SNS
  - **5+ account lockouts in 1 hour** → Alert via SNS
  - **Any privilege escalation attempt** (role change by non-admin)
  - **10+ file downloads by same user in 1 minute** (data exfiltration)
  - **Server error rate > 5%** (potential attack)
- [ ] Integrate with AWS SNS → Email/SMS alerts to security team
- [ ] Create runbook for each alert type
- [ ] **Files**: AWS CloudWatch Alarms, `docs/INCIDENT_RESPONSE.md`

**Task 4H: Implement Log Tampering Protection**
- [ ] Configure log rotation with append-only flag
- [ ] Calculate SHA-256 checksum for each log file on rotation
- [ ] Store checksums in separate secure location (S3 with versioning)
- [ ] Create daily verification script to check log integrity
- [ ] **Files**: `scripts/verifyLogIntegrity.js`, log rotation config

---

### Phase 4 Deliverables
- [x] Winston structured logging (JSON format)
- [x] Authentication audit logs (login, logout, password change)
- [x] Admin action audit trail (approvals, suspensions)
- [x] Document access audit logs (downloads, access denied)
- [x] AWS CloudWatch integration
- [x] Real-time security alerting (SNS)
- [x] Log tampering protection (checksums)

### Phase 4 Success Metrics
- 🎯 100% of security events logged
- 🎯 Mean time to detect (MTTD) security incidents: < 5 minutes
- 🎯 Log retention: 90 days minimum
- 🎯 Zero log tampering incidents

---

## 📋 Phase 5: Defense in Depth & Cleanup (Weeks 9-10)

**Objective**: Add additional security layers, improve API design, and finalize documentation.

**Sprint Goal**: Harden API, implement data retention policies, and prepare for audit.

### Tasks

#### 5.1 Input Sanitization Enhancements
**Requirements**: V1.1.1, V1.3.3

**Task 5A: Add Input Canonicalization**
- [ ] Install validator library: `npm install validator`
- [ ] Create `src/utils/sanitizer.js`:
  ```javascript
  function canonicalizeInput(input) {
    // Unicode normalization (NFC)
    let sanitized = input.normalize('NFC');
    
    // Decode URL encoding
    sanitized = decodeURIComponent(sanitized);
    
    // Decode HTML entities
    sanitized = he.decode(sanitized);
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    return sanitized;
  }
  ```
- [ ] Apply canonicalization before Joi validation
- [ ] Test with bypass attempts (e.g., `%2e%2e%2f`, Unicode tricks)
- [ ] **Files**: `src/utils/sanitizer.js`, `src/middlewares/validate.js`

**Task 5B: Implement Path Canonicalization**
- [ ] Update file path handling:
  ```javascript
  const path = require('path');
  const sanitizedPath = path.resolve(path.normalize(userInput));
  
  // Ensure path is within allowed directory
  if (!sanitizedPath.startsWith(allowedDir)) {
    throw new Error('Path traversal attempt detected');
  }
  ```
- [ ] Test with path traversal payloads: `../../etc/passwd`, `..\\..\\windows\\system32`
- [ ] **Files**: `src/controllers/documents-controller/documentsController.js`, `src/services/storageFactory.js`

---

#### 5.2 API Improvements
**Requirements**: V4.3.1, V13.1.1

**Task 5C: Implement API Versioning**
- [ ] Restructure routes:
  - Move all routes to `/api/v1/`
  - Keep `/api/` as alias (deprecated, log warning)
- [ ] Update route structure:
  ```javascript
  app.use('/api/v1', routes);
  app.use('/api', (req, res, next) => {
    logger.warn('Deprecated API endpoint accessed', { path: req.path });
    next();
  }, routes);
  ```
- [ ] Update frontend API calls to use `/api/v1/`
- [ ] Document API versioning policy
- [ ] **Files**: `src/routes/index.js`, `frontend/src/utils/api.ts`, `API_VERSIONING.md`

**Task 5D: Enforce NODE_ENV Validation**
- [ ] Update `server.js`:
  ```javascript
  const ALLOWED_ENVS = ['development', 'test', 'production'];
  if (!process.env.NODE_ENV || !ALLOWED_ENVS.includes(process.env.NODE_ENV)) {
    console.error('Error: NODE_ENV must be set to development, test, or production');
    process.exit(1);
  }
  ```
- [ ] Add validation for other critical env vars (DATABASE_URL, JWT secrets)
- [ ] **Files**: `server.js`

---

#### 5.3 Data Retention & Minimization
**Requirements**: V14.3.1, V14.3.3

**Task 5E: Document Data Retention Policy**
- [ ] Create `DATA_RETENTION_POLICY.md`:
  - User accounts: Retained indefinitely (or until user deletes)
  - Job applications: 2 years after job closed
  - Audit logs: 90 days (1 year for admin actions)
  - Refresh tokens: 7 days (auto-deleted on expiry)
  - Expired job postings: 6 months after deadline
- [ ] Add GDPR-compliant data deletion process
- [ ] Implement "Delete My Account" feature
- [ ] **Files**: `DATA_RETENTION_POLICY.md`, `src/controllers/profileController.js`

**Task 5F: Implement Automated Data Purging**
- [ ] Create scheduled job (cron or AWS Lambda):
  ```javascript
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    // Delete expired refresh tokens (>7 days old)
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });
    
    // Delete old applications (>2 years, job closed)
    // Archive or delete old logs (>90 days)
  });
  ```
- [ ] Add metrics: "Records purged today"
- [ ] **Files**: `src/jobs/dataPurgeJob.js`, `server.js`

---

#### 5.4 Testing & DevOps
**Requirements**: V15.3.1, V15.2.3

**Task 5G: Integrate SAST Tool (SonarQube or Semgrep)**
- [ ] Option 1: SonarCloud (free for open source)
  - Sign up at https://sonarcloud.io/
  - Add GitHub Action:
    ```yaml
    - uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    ```
- [ ] Option 2: Semgrep (free tier)
  - Add `.github/workflows/semgrep.yml`
- [ ] Fix critical/high issues flagged by SAST
- [ ] Set quality gate (fail build if vulnerabilities found)
- [ ] **Files**: `.github/workflows/sast.yml`

**Task 5H: Generate Software Bill of Materials (SBOM)**
- [ ] Install syft: `npm install -g @anchore/syft`
- [ ] Add to CI/CD:
  ```yaml
  - name: Generate SBOM
    run: |
      syft dir:. -o cyclonedx-json > sbom.json
      syft dir:. -o spdx-json > sbom-spdx.json
  ```
- [ ] Upload SBOM to artifact repository
- [ ] Include SBOM in release notes
- [ ] **Files**: `.github/workflows/sbom.yml`

---

#### 5.5 Documentation
**Requirements**: V13.4.5

**Task 5I: Improve .env.example**
- [ ] Update `.env.example`:
  - Remove all example secrets
  - Add comments with generation instructions
  - Mark required vs optional variables
  ```bash
  # JWT Secrets (REQUIRED)
  # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ACCESS_TOKEN_SECRET=
  REFRESH_TOKEN_SECRET=
  COOKIE_ENCRYPTION_KEY=
  
  # Database (REQUIRED)
  DATABASE_URL="postgresql://user:password@localhost:5432/ku_connect"
  
  # OAuth (REQUIRED for Google login)
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  ```
- [ ] **Files**: `.env.example`, `README.md`

**Task 5J: Create Security Policy Document**
- [ ] Create `SECURITY.md`:
  - Password requirements (8+ chars, complexity)
  - MFA enrollment instructions
  - Secret rotation schedule (JWT: 90 days, DB: 180 days)
  - Supported authentication methods (local, Google OAuth)
  - Session timeout policies
  - Vulnerability disclosure process
  - Security contact: security@ku-connect.com
- [ ] **Files**: `SECURITY.md`

**Task 5K: Create Incident Response Plan**
- [ ] Create `INCIDENT_RESPONSE.md`:
  - Detection procedures (monitoring, alerts)
  - Escalation matrix (who to notify)
  - Containment steps (isolate compromised accounts)
  - Eradication steps (patch vulnerabilities)
  - Recovery steps (restore from backups)
  - Post-incident review process
- [ ] Test incident response with tabletop exercise
- [ ] **Files**: `INCIDENT_RESPONSE.md`

---

### Phase 5 Deliverables
- [x] Input canonicalization (Unicode, URL decode)
- [x] Path canonicalization (prevent traversal)
- [x] API versioning (/api/v1/)
- [x] NODE_ENV validation on startup
- [x] Data retention policy documented
- [x] Automated data purging (cron job)
- [x] SAST integration (SonarQube/Semgrep)
- [x] SBOM generation (CycloneDX)
- [x] Updated .env.example
- [x] SECURITY.md policy document
- [x] INCIDENT_RESPONSE.md runbook

### Phase 5 Success Metrics
- 🎯 Zero path traversal vulnerabilities
- 🎯 SAST code quality score: A
- 🎯 SBOM generated for every release
- 🎯 Incident response tested (1 tabletop exercise)

---

## 📋 Phase 6: Advanced Features (Backlog, Weeks 11-14)

**Objective**: Implement nice-to-have security features for defense in depth.

**Sprint Goal**: Add device fingerprinting, TLS hardening, and advanced monitoring.

### Tasks

#### 6.1 Advanced Authentication
**Requirements**: V6.3.4, V9.2.4

**Task 6A: Implement Device Fingerprinting**
- [ ] Frontend: Install FingerprintJS: `npm install @fingerprintjs/fingerprintjs`
- [ ] Generate device fingerprint on login:
  ```javascript
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  const deviceId = result.visitorId;
  ```
- [ ] Backend: Store deviceId in sessions table
- [ ] Detect suspicious activity:
  - Same account logged in from different countries within 1 hour
  - New device login (send verification email)
- [ ] **Files**: `frontend/src/utils/fingerprint.ts`, `src/services/authService.js`

**Task 6B: Implement Token Binding to Device/IP**
- [ ] Include deviceId and ipAddress in JWT payload
- [ ] Validate on each request:
  - Token deviceId matches current device
  - Token IP matches current IP (or same subnet)
- [ ] Invalidate token if mismatch detected
- [ ] **Files**: `src/middlewares/authMiddleware.js`, `src/utils/tokenUtils.js`

---

#### 6.2 TLS Hardening
**Requirements**: V12.1.1, V12.3.1, V12.3.2

**Task 6C: Add TLS Enforcement Middleware**
- [ ] Install express-sslify: `npm install express-sslify`
- [ ] Update `src/app.js`:
  ```javascript
  const enforce = require('express-sslify');
  if (process.env.NODE_ENV === 'production') {
    app.use(enforce.HTTPS({ trustProtoHeader: true }));
  }
  ```
- [ ] Test HTTP → HTTPS redirect
- [ ] **Files**: `src/app.js`

**Task 6D: Enforce Minimum TLS 1.2**
- [ ] Update `server.js` (if using https.createServer):
  ```javascript
  const https = require('https');
  const server = https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
    minVersion: 'TLSv1.2', // Reject TLS < 1.2
  }, app);
  ```
- [ ] Test with SSL Labs: https://www.ssllabs.com/ssltest/
- [ ] **Files**: `server.js`

**Task 6E: Disable Weak Cipher Suites**
- [ ] Update TLS config:
  ```javascript
  ciphers: [
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'DHE-RSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-GCM-SHA256'
  ].join(':'),
  honorCipherOrder: true
  ```
- [ ] Test with: `openssl s_client -connect localhost:443 -cipher 'DES-CBC3-SHA'` (should fail)
- [ ] **Files**: `server.js`

---

#### 6.3 OAuth Enhancements
**Requirements**: V10.4.5

**Task 6F: Implement OAuth Token Revocation**
- [ ] Add endpoint: `POST /api/auth/oauth/revoke`
- [ ] Call Google token revocation API:
  ```javascript
  await axios.post('https://oauth2.googleapis.com/revoke', {
    token: accessToken
  });
  ```
- [ ] Delete OAuth account linkage from database
- [ ] **Files**: `src/controllers/authController.js`

---

#### 6.4 Frontend Security Enhancements
**Requirements**: V3.3.1, V3.3.4

**Task 6G: Add DOMPurify for Rich Text (Future-Proofing)**
- [ ] Install DOMPurify: `npm install dompurify`
- [ ] Create sanitizer utility:
  ```javascript
  import DOMPurify from 'dompurify';
  
  export function sanitizeHtml(dirty) {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
      ALLOWED_ATTR: ['href']
    });
  }
  ```
- [ ] Apply to any rich text fields (currently none, but future-proof)
- [ ] **Files**: `frontend/src/utils/sanitize.ts`

**Task 6H: Add Runtime API Response Validation with Zod**
- [ ] Install Zod: `npm install zod`
- [ ] Define Zod schemas for API responses:
  ```typescript
  import { z } from 'zod';
  
  const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    role: z.enum(['STUDENT', 'EMPLOYER', 'ADMIN', 'PROFESSOR']),
    // ... other fields
  });
  ```
- [ ] Validate API responses at runtime:
  ```typescript
  const user = UserSchema.parse(apiResponse.data.user);
  ```
- [ ] Handle validation errors gracefully
- [ ] **Files**: `frontend/src/schemas/*.ts`, `frontend/src/services/*.ts`

---

#### 6.5 Cryptography Enhancements
**Requirements**: V11.5.1

**Task 6I: Implement Key Escrow for Recovery**
- [ ] Use AWS KMS for encryption key backup
- [ ] Enable automatic key rotation in AWS KMS
- [ ] Document key recovery procedure for disaster scenarios
- [ ] Test key recovery process
- [ ] **Files**: `docs/KEY_RECOVERY.md`, AWS KMS configuration

---

#### 6.6 Advanced Monitoring
**Requirements**: V15.3.6, V16.5.2, V16.5.3

**Task 6J: Evaluate RASP Solutions**
- [ ] Research RASP vendors:
  - Sqreen (Datadog)
  - Contrast Security
  - Imperva RASP
- [ ] Run proof-of-concept with free tier
- [ ] Evaluate cost vs. benefit
- [ ] Document findings in `docs/RASP_EVALUATION.md`
- [ ] **Files**: `docs/RASP_EVALUATION.md`

**Task 6K: Implement Automated Incident Response**
- [ ] Create Lambda function to auto-block IPs:
  - Trigger: CloudWatch alarm (50+ failed logins)
  - Action: Add IP to AWS WAF blocklist for 1 hour
- [ ] Create Lambda function to auto-suspend accounts:
  - Trigger: Privilege escalation attempt
  - Action: Suspend account, notify admins
- [ ] Test incident response automation
- [ ] **Files**: AWS Lambda functions, CloudWatch Event Rules

**Task 6L: Integrate with SIEM**
- [ ] Option 1: AWS Security Hub
  - Enable Security Hub
  - Configure log ingestion from CloudWatch
  - Set up compliance checks (CIS AWS Foundations)
- [ ] Option 2: Splunk or Elastic SIEM
  - Install Splunk forwarder or Filebeat
  - Configure log shipping
  - Create security dashboards
- [ ] Create correlation rules (e.g., failed login + privilege escalation = alert)
- [ ] **Files**: SIEM configuration, dashboards

---

### Phase 6 Deliverables
- [x] Device fingerprinting (FingerprintJS)
- [x] Token binding to device/IP
- [x] TLS enforcement middleware
- [x] Minimum TLS 1.2, strong ciphers only
- [x] OAuth token revocation endpoint
- [x] DOMPurify for rich text sanitization
- [x] Zod runtime API validation
- [x] AWS KMS key escrow
- [x] RASP solution evaluation
- [x] Automated incident response (IP blocking)
- [x] SIEM integration (AWS Security Hub or Splunk)

### Phase 6 Success Metrics
- 🎯 Zero XSS vulnerabilities (DOMPurify + CSP)
- 🎯 TLS security score: A+ on SSL Labs
- 🎯 Mean time to respond (MTTR) to incidents: < 30 minutes
- 🎯 Automated blocking of 95%+ brute force attacks

---

## 📊 Overall Project Success Metrics

### Compliance Improvement
- **Starting**: 31% OWASP ASVS compliant (44/142 requirements)
- **Target**: 80% OWASP ASVS compliant (113/142 requirements)
- **Actual**: ___ % (track after each phase)

### Security Posture
- ✅ Zero critical vulnerabilities (Snyk scan)
- ✅ A+ rating on securityheaders.com
- ✅ A+ rating on SSL Labs
- ✅ 100% of admins using MFA
- ✅ Mean time to detect (MTTD): < 5 minutes
- ✅ Mean time to respond (MTTR): < 30 minutes

### Operational Metrics
- ✅ Zero data breaches
- ✅ Zero account takeover incidents
- ✅ 99.9% uptime
- ✅ < 5% false positive rate on security alerts

---

## 🎯 Checkpoint Reviews

### After Each Phase
1. **Code Review**: Security-focused PR review
2. **Testing**: Penetration testing of new features
3. **Metrics Review**: Check progress toward KPIs
4. **Retrospective**: What went well, what to improve
5. **Go/No-Go Decision**: Proceed to next phase or fix issues

### Final Security Audit (Week 11)
- [ ] External penetration test by certified ethical hacker
- [ ] OWASP ASVS compliance verification
- [ ] Generate final security report
- [ ] Obtain security certification (if applicable)

---

## 📚 Resources & References

### OWASP Resources
- [OWASP ASVS 4.0](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)

### Tools & Libraries
- **Secrets Management**: AWS Secrets Manager, HashiCorp Vault
- **Security Headers**: Helmet.js
- **MFA**: speakeasy, qrcode
- **Logging**: Winston, winston-cloudwatch
- **Malware Scanning**: ClamAV, VirusTotal API
- **SAST**: SonarQube, Semgrep
- **Dependency Scanning**: Snyk, npm audit
- **Device Fingerprinting**: FingerprintJS

### Best Practices
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 9+
- PostgreSQL 14+ (production) or SQLite (dev)
- AWS account with Secrets Manager, KMS, CloudWatch access
- GitHub repository with Actions enabled

### Phase 1 Quick Start
```bash
# 1. Generate strong secrets
node -e "console.log('ACCESS_TOKEN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('REFRESH_TOKEN_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('COOKIE_ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"

# 2. Install helmet
npm install helmet

# 3. Add helmet to app.js
# (See Task 1E for configuration)

# 4. Run security scan
npm audit

# 5. Deploy to staging and test
npm run start
```

### Weekly Progress Tracking
- **Monday**: Plan week's tasks, assign owners
- **Wednesday**: Mid-week checkpoint, unblock issues
- **Friday**: Demo completed features, update metrics

---

**Document Version**: 1.0  
**Last Updated**: November 21, 2025  
**Next Review**: December 1, 2025 (after Phase 1)
