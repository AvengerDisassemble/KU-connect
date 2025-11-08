# 🧭 ADMIN CREATE PROFESSOR FEATURE – KU CONNECT BACKEND

> **Purpose:**  
> Enable administrators to directly create verified professor accounts with auto-approval, bypassing the standard registration and approval workflow.  
> Read the `context/constitution.txt` to understand the project context.  
> Follow the **development & authentication guides** inside `backend/documents` before implementing.

---

## ⚙️ OVERVIEW

The Admin Create Professor Feature will enable:
- 👨‍🏫 **Direct Professor Creation** by admins with immediate approval
- 🔐 **Dual Password Options**: Auto-generated secure passwords OR custom admin-set passwords
- 📧 **Automated Email Notifications**: Welcome emails with temporary password (password reset excluded for now)
- 👤 **Enhanced Professor Profile**: Additional fields (phone, office location, title)
- ✅ **Immediate Access**: Created professors are auto-verified and can login instantly

---

## 🧱 DATABASE TASKS

### Update Professor Model

- [ ] **Add new fields to Professor model**
  ```prisma
  model Professor {
    id             String   @id @default(cuid())
    userId         String   @unique
    department     String
    phoneNumber    String?  // NEW: Optional phone number
    officeLocation String?  // NEW: Optional office location  
    title          String?  // NEW: Optional title (Assistant Professor, Associate Professor, etc.)
    user           User     @relation(fields: [userId], references: [id])
    createdAt      DateTime @default(now())  // NEW: Track creation date
    updatedAt      DateTime @updatedAt       // NEW: Track updates
  }
  ```

- [ ] **Run migration**
  ```bash
  npx prisma migrate dev --name add_professor_additional_fields
  ```

- [ ] **Update seed data** (`prisma/seed.js`)
  - Add new fields to existing professor seed data
  - Ensure backward compatibility

---

## 💼 IMPLEMENTATION TASKS

### Phase 1: Database & Utilities

| Step | File | Description | Status |
|------|------|-------------|--------|
| 1 | `prisma/schema.prisma` | Update Professor model with new fields (phoneNumber, officeLocation, title, timestamps) | [ ] |
| 2 | Terminal | Run migration: `npx prisma migrate dev --name add_professor_additional_fields` | [ ] |
| 3 | `src/utils/passwordUtils.js` | Implement `generateSecurePassword()` function (12+ chars, mixed case, numbers, special) | [ ] |
| 4 | `src/utils/emailUtils.js` | Create new file with `sendProfessorWelcomeEmail()` function | [ ] |

**Expected Output:**
✅ Database schema updated with new fields  
✅ Migration applied successfully  
✅ Utility functions ready for password generation and email sending

---

### Phase 2: Service Layer

| Step | File | Description | Status |
|------|------|-------------|--------|
| 1 | `src/services/adminService.js` | Create/update file with `createProfessorUser()` function | [ ] |
| 2 | Service logic | Check for duplicate email | [ ] |
| 3 | Service logic | Generate password (if not provided) or use custom password | [ ] |
| 4 | Service logic | Hash password using bcrypt | [ ] |
| 5 | Service logic | Create User with status='APPROVED', verified=true | [ ] |
| 6 | Service logic | Create Professor profile with all fields | [ ] |
| 7 | Service logic | Use Prisma transaction for atomic operation | [ ] |
| 8 | Service logic | Send welcome email (with error handling) | [ ] |
| 9 | Service logic | Return user, professor, credentials, and email status | [ ] |

**Function Signature:**
```javascript
/**
 * Create a professor user by admin
 * @param {Object} data - Professor creation data
 * @param {string} data.name - First name (required)
 * @param {string} data.surname - Last name (required)
 * @param {string} data.email - Email address (required, unique)
 * @param {string} data.department - Department (required)
 * @param {string} [data.password] - Custom password (optional, will auto-generate if not provided)
 * @param {string} [data.phoneNumber] - Phone number (optional)
 * @param {string} [data.officeLocation] - Office location (optional)
 * @param {string} [data.title] - Academic title (optional)
 * @param {boolean} [data.sendWelcomeEmail=true] - Send welcome email (optional, default: true)
 * @param {string} data.createdBy - Admin user ID who created this account
 * @returns {Promise<Object>} Created user with credentials
 * @throws {Error} If email already exists
 */
async function createProfessorUser(data)
```

**Expected Output:**
✅ Professor creation logic fully implemented  
✅ Transaction ensures data consistency  
✅ Email sending doesn't block response (graceful failure)

---

### Phase 3: Validation Layer

| Step | File | Description | Status |
|------|------|-------------|--------|
| 1 | `src/validators/adminValidator.js` | Implement `validateProfessorCreate` function | [ ] |
| 2 | Validator | Validate required fields: name, surname, email, department | [ ] |
| 3 | Validator | Validate name/surname: min 2 chars, max 100 chars | [ ] |
| 4 | Validator | Validate email: proper email format | [ ] |
| 5 | Validator | Validate department: min 2 chars, max 200 chars | [ ] |
| 6 | Validator | Validate optional password: min 8 chars, complexity (uppercase, lowercase, number) | [ ] |
| 7 | Validator | Validate optional fields: phoneNumber (max 20), officeLocation (max 200), title (max 100) | [ ] |
| 8 | Validator | Validate sendWelcomeEmail: boolean type | [ ] |
| 9 | Validator | Return clear error messages for each validation failure | [ ] |

**Joi Schema Structure:**
```javascript
const schema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  surname: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  department: Joi.string().min(2).max(200).required(),
  password: Joi.string().min(8).max(100)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).optional(),
  phoneNumber: Joi.string().max(20).optional(),
  officeLocation: Joi.string().max(200).optional(),
  title: Joi.string().max(100).optional(),
  sendWelcomeEmail: Joi.boolean().optional()
})
```

**Expected Output:**
✅ All inputs validated before processing  
✅ Clear, user-friendly error messages  
✅ Security enforced through validation

---

### Phase 4: Controller Layer

| Step | File | Description | Status |
|------|------|-------------|--------|
| 1 | `src/controllers/adminController.js` | Implement `createProfessorHandler` function | [ ] |
| 2 | Controller | Extract request body fields | [ ] |
| 3 | Controller | Add `createdBy: req.user.id` to track admin who created account | [ ] |
| 4 | Controller | Call `createProfessorUser()` service function | [ ] |
| 5 | Controller | Wrap in `asyncErrorHandler` for error handling | [ ] |
| 6 | Controller | Return 201 status with created user data | [ ] |
| 7 | Controller | Include credentials in response (temporary password if auto-generated) | [ ] |

**Expected Output:**
✅ RESTful endpoint handler implemented  
✅ Standardized response format  
✅ Proper HTTP status codes

---

### Phase 5: Routing Layer

| Step | File | Description | Status |
|------|------|-------------|--------|
| 1 | `src/routes/admin/index.js` | Import `createProfessorHandler` | [ ] |
| 2 | `src/routes/admin/index.js` | Import `validateProfessorCreate` | [ ] |
| 3 | `src/routes/admin/index.js` | Add POST route: `/users/professor` | [ ] |
| 4 | Route config | Apply `authMiddleware` (authentication required) | [ ] |
| 5 | Route config | Apply `roleMiddleware('ADMIN')` (admin only) | [ ] |
| 6 | Route config | Apply `adminCriticalLimiter` (strict rate limiting) | [ ] |
| 7 | Route config | Apply `validateProfessorCreate` (input validation) | [ ] |
| 8 | Route config | Connect to `createProfessorHandler` | [ ] |

**Route Definition:**
```javascript
router.post(
  '/users/professor',
  adminCriticalLimiter,
  validateProfessorCreate,
  createProfessorHandler
)
```

**Expected Output:**
✅ Endpoint: `POST /api/admin/users/professor`  
✅ Protected by authentication and authorization  
✅ Rate limited for security  
✅ Input validated before processing

---

### Phase 6: Email System (Optional but Recommended)

| Step | File | Description | Status |
|------|------|-------------|--------|
| 1 | `src/utils/emailUtils.js` | Implement email template for professor welcome | [ ] |
| 2 | Email template | Include professor name and personalized greeting | [ ] |
| 3 | Email template | Include temporary password (if auto-generated) | [ ] |
| 4 | Email template | Include getting started instructions | [ ] |
| 5 | Email template | Include support contact information | [ ] |
| 6 | Email config | Set up email service (console.log for dev, real service for prod) | [ ] |
| 7 | Error handling | Graceful failure if email sending fails (don't block response) | [ ] |

**Email Content Structure:**
```
Subject: Welcome to KU Connect - Your Professor Account

Dear Prof. [Name],

Your professor account has been created by the KU Connect administrator.

Account Details:
- Email: [email]
- Department: [department]
- Temporary Password: [password] (if auto-generated)

Getting Started:
1. Log in using your email and temporary password
2. Complete your profile information
3. Explore the platform features

If you have any questions, please contact support@kuconnect.local

Best regards,
KU Connect Team
```

**Expected Output:**
✅ Professional welcome email template  
✅ Both password options handled  
✅ Clear onboarding instructions

---

## 🧪 TESTING TASKS

### Unit Tests: `tests/services/adminService.test.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| 1 | Should create professor with all required fields | [ ] |
| 2 | Should create professor with all optional fields | [ ] |
| 3 | Should auto-generate password when not provided | [ ] |
| 4 | Should use custom password when provided | [ ] |
| 5 | Should hash password before storage | [ ] |
| 6 | Should set user status to APPROVED | [ ] |
| 7 | Should set user verified to true | [ ] |
| 8 | Should throw error for duplicate email | [ ] |
| 9 | Should handle email sending failure gracefully | [ ] |
| 10 | Should return temporary password only if auto-generated | [ ] |
| 11 | Should not return password if custom password used | [ ] |

---

### Integration Tests: `tests/routes/admin/users.test.js`

| Test Case | Description | Status |
|-----------|-------------|--------|
| 1 | POST /api/admin/users/professor - Success with all fields | [ ] |
| 2 | POST /api/admin/users/professor - Success with required fields only | [ ] |
| 3 | POST /api/admin/users/professor - Success with auto-generated password | [ ] |
| 4 | POST /api/admin/users/professor - Success with custom password | [ ] |
| 5 | POST /api/admin/users/professor - Returns 400 for missing name | [ ] |
| 6 | POST /api/admin/users/professor - Returns 400 for missing email | [ ] |
| 7 | POST /api/admin/users/professor - Returns 400 for invalid email format | [ ] |
| 8 | POST /api/admin/users/professor - Returns 400 for weak password | [ ] |
| 9 | POST /api/admin/users/professor - Returns 409 for duplicate email | [ ] |
| 10 | POST /api/admin/users/professor - Returns 401 for unauthenticated request | [ ] |
| 11 | POST /api/admin/users/professor - Returns 403 for non-admin user | [ ] |
| 12 | Created professor can login immediately | [ ] |
| 13 | Created professor has APPROVED status | [ ] |
| 14 | Created professor has verified=true | [ ] |
| 15 | Response includes temporary password (auto-generated only) | [ ] |

---

### Manual Testing Checklist

- [ ] Create professor with auto-generated password via Postman
- [ ] Create professor with custom password via Postman
- [ ] Verify professor can login immediately
- [ ] Test with all optional fields provided
- [ ] Test with only required fields
- [ ] Test duplicate email rejection
- [ ] Test validation errors (missing fields, invalid formats)
- [ ] Test authorization (non-admin cannot access)
- [ ] Test rate limiting (multiple rapid requests)

---

## 🔐 SECURITY CONSIDERATIONS

| Concern | Mitigation | Status |
|---------|------------|--------|
| Password Strength | Auto-generated passwords: 12+ chars, mixed case, numbers, special chars | [ ] |
| Custom Password Validation | Min 8 chars, require uppercase, lowercase, number | [ ] |
| Rate Limiting | `adminCriticalLimiter` prevents abuse | [ ] |
| Authorization | Only admins can create professors | [ ] |
| Password Exposure | Temporary password shown only once in response | [ ] |
| Audit Trail | Track which admin created each professor (createdBy field) | [ ] |
| Email Privacy | Use TLS for email transmission | [ ] |
| Data Validation | Joi schema validates all inputs | [ ] |

---

## 📦 DELIVERABLES CHECKLIST

### Code Files
- [ ] `prisma/schema.prisma` - Updated Professor model
- [ ] `prisma/migrations/[timestamp]_add_professor_additional_fields/` - Migration files
- [ ] `src/services/adminService.js` - Professor creation service
- [ ] `src/controllers/adminController.js` - Professor creation controller
- [ ] `src/validators/adminValidator.js` - Professor validation
- [ ] `src/routes/admin/index.js` - Professor creation route
- [ ] `src/utils/passwordUtils.js` - Password generation utility
- [ ] `src/utils/emailUtils.js` - Email sending utility

### Test Files
- [ ] `tests/services/adminService.test.js` - Service unit tests
- [ ] `tests/routes/admin/users.test.js` - Integration tests

### Documentation
- [ ] API endpoint documented in code (JSDoc)
- [ ] README updated with new endpoint
- [ ] Postman collection updated with example requests

### Quality Assurance
- [ ] All tests passing (npm test)
- [ ] Code follows JavaScript Standard Style
- [ ] All functions have JSDoc comments
- [ ] No console.log statements in production code
- [ ] Error handling implemented properly
- [ ] Rate limiting tested and working

---

## 📊 METRICS & SUCCESS CRITERIA

### Performance Targets
- [ ] Professor creation completes in < 2 seconds
- [ ] Email sending doesn't block response (async)
- [ ] Rate limit: max 10 professor creations per hour per admin

### Functionality Verification
- [ ] Created professors appear in user list immediately
- [ ] Created professors can login without approval
- [ ] Email notifications received (if configured)
- [ ] All optional fields stored correctly
- [ ] Duplicate email properly rejected

### Code Quality
- [ ] Test coverage > 80% for new code
- [ ] No linting errors
- [ ] All edge cases handled
- [ ] Consistent with existing codebase patterns

---

## 🚀 DEPLOYMENT STEPS

### Pre-Deployment
1. [ ] All tests passing locally
2. [ ] Code reviewed by team lead
3. [ ] Database backup completed
4. [ ] Email service configured (if using real email)

### Deployment
1. [ ] Pull latest code from main branch
2. [ ] Run database migration:
   ```bash
   npx prisma migrate deploy
   ```
3. [ ] Restart backend server
4. [ ] Verify health check endpoint
5. [ ] Test new endpoint in staging environment

### Post-Deployment
1. [ ] Monitor error logs for first 24 hours
2. [ ] Verify email notifications working
3. [ ] Test admin functionality in production
4. [ ] Document any issues in GitHub
5. [ ] Update admin user guide

---

## 📋 API ENDPOINT SPECIFICATION

### Create Professor Account

**Endpoint:** `POST /api/admin/users/professor`

**Authentication:** Required (Bearer token)

**Authorization:** Admin role only

**Rate Limit:** 10 requests per hour

**Request Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John",
  "surname": "Smith",
  "email": "john.smith@ku.ac.th",
  "department": "Computer Science",
  "password": "CustomPass123!",
  "phoneNumber": "+66-123-456789",
  "officeLocation": "Building A, Room 301",
  "title": "Assistant Professor",
  "sendWelcomeEmail": true
}
```

**Required Fields:**
- `name` (string, 2-100 chars)
- `surname` (string, 2-100 chars)
- `email` (valid email format, unique)
- `department` (string, 2-200 chars)

**Optional Fields:**
- `password` (string, 8-100 chars, must contain uppercase, lowercase, number)
- `phoneNumber` (string, max 20 chars)
- `officeLocation` (string, max 200 chars)
- `title` (string, max 100 chars)
- `sendWelcomeEmail` (boolean, default: true)

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Professor account created successfully",
  "data": {
    "user": {
      "id": "clxyz123abc",
      "name": "John",
      "surname": "Smith",
      "email": "john.smith@ku.ac.th",
      "role": "PROFESSOR",
      "status": "APPROVED",
      "verified": true,
      "createdAt": "2025-10-31T10:30:00.000Z"
    },
    "professor": {
      "id": "clxyz456def",
      "userId": "clxyz123abc",
      "department": "Computer Science",
      "phoneNumber": "+66-123-456789",
      "officeLocation": "Building A, Room 301",
      "title": "Assistant Professor",
      "createdAt": "2025-10-31T10:30:00.000Z",
      "updatedAt": "2025-10-31T10:30:00.000Z"
    },
    "credentials": {
      "temporaryPassword": "aB3$xY9!mN2p"
    },
    "emailSent": true
  }
}
```

**Note:** `temporaryPassword` only appears in response if password was auto-generated (not provided in request).

**Error Responses:**

**400 Bad Request** - Validation Error:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

**401 Unauthorized** - Not Authenticated:
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**403 Forbidden** - Not Admin:
```json
{
  "success": false,
  "message": "Admin access required"
}
```

**409 Conflict** - Duplicate Email:
```json
{
  "success": false,
  "message": "Email already registered"
}
```

**429 Too Many Requests** - Rate Limited:
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "message": "Failed to create professor account",
  "error": "Error details..."
}
```

---

## 🧠 IMPLEMENTATION NOTES

### Code Style Reminders
1. **JavaScript Standard Style** – No semicolons, 2-space indent
2. **JSDoc** – Document all public functions
3. **Comment "why", not "what"** – Explain intent, not mechanics
4. **Use async/await** – No callbacks or raw Promises
5. **Central error handling** – Use `asyncErrorHandler` wrapper

### Database Patterns
1. **Use transactions** – Ensure User + Professor creation is atomic
2. **Select only needed fields** – Don't return password hash
3. **Handle unique constraints** – Catch duplicate email gracefully
4. **Use cuid() for IDs** – Consistent with existing schema

### Security Best Practices
1. **Never log passwords** – Not even in development
2. **Hash before storage** – Always use bcrypt
3. **Validate all inputs** – Use Joi schemas
4. **Check authorization** – Verify admin role
5. **Rate limit critical endpoints** – Prevent abuse

### Testing Strategy
1. **Test happy path first** – Ensure basic flow works
2. **Test edge cases** – Missing fields, invalid formats
3. **Test security** – Authorization, validation
4. **Test error handling** – Duplicate email, service failures
5. **Test integration** – Can created professor actually login?

---

## 💡 FUTURE ENHANCEMENTS (Not in Scope)

These are ideas for future iterations, NOT part of current implementation:

1. **Bulk Import**: CSV upload to create multiple professors
2. **Email Templates**: Rich HTML email with branding
3. **Audit Logging**: Detailed logs of who created which accounts
4. **Notification System**: In-app notifications for new professors
5. **Profile Photo Upload**: Allow uploading professor photo during creation
6. **Department Validation**: Validate against pre-defined department list
7. **Auto-Username Generation**: Generate unique usernames from names
8. **Two-Factor Authentication**: Optional 2FA setup during creation
9. **Welcome Survey**: Collect additional info during first login
10. **Analytics Dashboard**: Track professor creation metrics

---

## ✅ DEFINITION OF DONE

The feature is considered **DONE** when:

1. ✅ All database migrations applied successfully
2. ✅ All code files created and updated as specified
3. ✅ All unit tests passing (100% of new test cases)
4. ✅ All integration tests passing (100% of new test cases)
5. ✅ Code follows JavaScript Standard Style (no linting errors)
6. ✅ All functions documented with JSDoc
7. ✅ API endpoint works in Postman/manual testing
8. ✅ Created professors can login immediately
9. ✅ Email system functional (or gracefully degrades)
10. ✅ Authorization working (only admins can access)
11. ✅ Rate limiting working (protects against abuse)
12. ✅ Error handling robust (all edge cases covered)
13. ✅ No breaking changes to existing functionality
14. ✅ Code reviewed and approved by team lead

---

## 📝 ESTIMATED EFFORT

| Phase | Estimated Time | Complexity |
|-------|---------------|------------|
| Phase 1: Database & Utilities | 1-2 hours | Medium |
| Phase 2: Service Layer | 2-3 hours | High |
| Phase 3: Validation Layer | 1-2 hours | Low |
| Phase 4: Controller Layer | 1 hour | Low |
| Phase 5: Routing Layer | 30 minutes | Low |
| Phase 6: Email System | 1-2 hours | Low |
| Testing (Unit + Integration) | 3-4 hours | High |
| Documentation & Code Review | 1-2 hours | Low |
| **Total Estimated Time** | **11-16 hours** | **Medium-High** |

**Recommended Timeline:** 2-3 working days with proper testing

---

## 🔄 DEPENDENCIES

### Technical Dependencies
- Prisma ORM (already installed)
- bcrypt for password hashing (already installed)
- Joi for validation (already installed)
- JWT for authentication (already installed)

### External Dependencies
- Email service (optional, can use console.log for MVP)

### Code Dependencies
- Existing admin authentication and authorization system
- Existing user creation patterns from authService
- Existing error handling middleware
- Existing rate limiting middleware

---

🎯 **Ready to implement!** Follow this plan step-by-step for a successful feature delivery.
