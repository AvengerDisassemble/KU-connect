# PDPA Consent Implementation - Summary

## Overview
This document summarizes the implementation of the minimal PDPA consent feature for the KU-Connect backend.

## What Was Implemented

### 1. Database Schema Changes ✅
**File**: `backend/prisma/schema.prisma`

Added two new fields to the `User` model:
- `dataProcessingConsent` (Boolean, default: false) - Stores user's consent to data processing
- `privacyPolicyAcceptedAt` (DateTime, nullable) - Timestamp when consent was given

Migration applied: `20251126173413_add_pdpa_consent_fields`

### 2. Registration Validation ✅
**File**: `backend/src/validators/authValidator.js`

Updated all registration validators to require `privacyConsent`:
- `validateAlumniRegistration()`
- `validateEnterpriseRegistration()`
- `validateStaffRegistration()`
- `validateAdminRegistration()`

Each validator now checks:
```javascript
if (!privacyConsent || typeof privacyConsent !== 'object') {
  errors.push("PDPA consent is required");
} else if (privacyConsent.dataProcessingConsent !== true) {
  errors.push("PDPA consent required");
}
```

### 3. Registration Controllers ✅
**File**: `backend/src/controllers/authController.js`

Updated all registration controllers to extract and pass `privacyConsent`:
- `registerAlumni()`
- `registerEnterprise()`
- `registerStaff()`
- `registerAdmin()`

### 4. Registration Service ✅
**File**: `backend/src/services/authService.js`

Updated `registerUser()` function to:
- Validate PDPA consent before user creation
- Store consent fields in database:
  ```javascript
  dataProcessingConsent: true,
  privacyPolicyAcceptedAt: new Date()
  ```

Updated `findOrCreateGoogleUser()` function to:
- Automatically set consent for OAuth users (implicit consent through Google)

### 5. Account Deletion (Right to Erasure) ✅
**Files**: 
- `backend/src/services/userService.js` - Added `deleteAccount()` function
- `backend/src/controllers/userController.js` - New file with `deleteUserAccount()` controller
- `backend/src/routes/user.js` - New route file

Implemented `DELETE /api/user/:id` endpoint that:
- Requires authentication
- Allows users to delete their own account
- Allows admins to delete any account
- Deletes all associated personal data:
  - Role-specific data (Student, Professor, HR, Admin records)
  - Saved jobs, job reports, notifications
  - Announcements, OAuth accounts, refresh tokens
  - Applications, resumes, and job postings (for employers)

Authorization logic:
```javascript
// Users can delete their own account, admins can delete others
if (userId !== requesterId && requester.role !== 'ADMIN') {
  throw new Error('Unauthorized to delete this account');
}
```

## API Usage

### Registration with PDPA Consent

#### Request Example:
```json
POST /api/register/alumni

{
  "name": "John",
  "surname": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "degreeTypeId": "cm3w8jz0l0000vvmd6y7qg123",
  "address": "123 Main St, Bangkok",
  "privacyConsent": {
    "dataProcessingConsent": true
  }
}
```

#### Success Response (201):
```json
{
  "success": true,
  "message": "Alumni registration successful",
  "data": {
    "user": {
      "id": "cm3w8jz0l0000vvmd6y7qg123",
      "name": "John",
      "surname": "Doe",
      "email": "john@example.com",
      "role": "STUDENT",
      "status": "PENDING",
      "verified": false,
      "createdAt": "2024-11-26T17:34:13.000Z"
    }
  }
}
```

#### Error Response (400 - Missing Consent):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "PDPA consent required"
  ]
}
```

### Account Deletion

#### Request Example:
```http
DELETE /api/user/cm3w8jz0l0000vvmd6y7qg123
Cookie: accessToken=<encrypted_token>
```

#### Success Response (204):
No content - User and all associated data deleted

#### Error Responses:
- 400: Invalid user ID
- 403: Unauthorized to delete this account
- 404: User not found

## Testing Notes

To test the implementation:

1. **Registration without consent** - Should return 400 error
2. **Registration with consent = false** - Should return 400 error
3. **Registration with consent = true** - Should succeed (201)
4. **OAuth registration** - Consent automatically set to true
5. **Delete own account** - Should succeed (204)
6. **Delete another user's account** - Should fail unless requester is admin (403)

## Files Created/Modified

### Created:
- `backend/src/controllers/userController.js`
- `backend/src/routes/user.js`
- `backend/prisma/migrations/20251126173413_add_pdpa_consent_fields/`
- `backend/manual-test-pdpa.js` (test script)

### Modified:
- `backend/prisma/schema.prisma`
- `backend/src/validators/authValidator.js`
- `backend/src/controllers/authController.js`
- `backend/src/services/authService.js`
- `backend/src/services/userService.js`

## Compliance Notes

This implementation provides:
1. ✅ **Explicit consent** - Users must actively consent during registration
2. ✅ **Right to erasure** - Users can delete their account and all personal data
3. ✅ **OAuth handling** - Google OAuth users implicitly consent
4. ✅ **Timestamp recording** - `privacyPolicyAcceptedAt` records when consent was given

## Out of Scope (As Per Plan)

The following were intentionally NOT implemented to keep complexity low:
- No consent versioning or policy version numbers
- No consent history or audit trail (IP, user agent, consent method)
- No marketing consent
- No dedicated `/api/privacy/*` endpoints for policy content
- No admin dashboards for consent reporting
- No backend API for serving privacy policy (handled by frontend)

## Frontend Integration Required

The frontend should:
1. Display privacy policy link during registration
2. Include checkbox for `privacyConsent.dataProcessingConsent`
3. Disable registration button until consent is given
4. Provide account deletion button in user settings
5. Show confirmation dialog before deletion
6. Serve static privacy policy page at `/privacy-policy`

## Next Steps

1. Test the implementation thoroughly
2. Update frontend to include consent checkbox
3. Create privacy policy content for frontend
4. Write automated tests for the new endpoints
5. Update API documentation
