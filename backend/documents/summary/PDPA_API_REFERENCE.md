# PDPA Consent API Quick Reference

## Endpoints

### 1. Registration Endpoints (Modified)

All registration endpoints now require PDPA consent.

#### Alumni Registration
```http
POST /api/register/alumni
Content-Type: application/json

{
  "name": "string",
  "surname": "string",
  "email": "string",
  "password": "string",
  "degreeTypeId": "string",
  "address": "string",
  "privacyConsent": {
    "dataProcessingConsent": true  // Required: must be true
  }
}
```

#### Enterprise Registration
```http
POST /api/register/enterprise
Content-Type: application/json

{
  "name": "string",
  "surname": "string",
  "email": "string",
  "password": "string",
  "companyName": "string",
  "address": "string",
  "phoneNumber": "string",
  "privacyConsent": {
    "dataProcessingConsent": true  // Required: must be true
  }
}
```

#### Staff Registration
```http
POST /api/register/staff
Content-Type: application/json

{
  "name": "string",
  "surname": "string",
  "email": "string",
  "password": "string",
  "department": "string",
  "privacyConsent": {
    "dataProcessingConsent": true  // Required: must be true
  }
}
```

#### Admin Registration
```http
POST /api/register/admin
Content-Type: application/json

{
  "name": "string",
  "surname": "string",
  "email": "string",
  "password": "string",
  "privacyConsent": {
    "dataProcessingConsent": true  // Required: must be true
  }
}
```

### 2. Account Deletion (New)

#### Delete User Account
```http
DELETE /api/user/:id
Cookie: accessToken=<encrypted_token>
```

**Authorization:**
- Users can delete their own account
- Admins can delete any account

**Response:**
- `204 No Content` - Success, account deleted
- `400 Bad Request` - Invalid user ID
- `403 Forbidden` - Unauthorized to delete this account
- `404 Not Found` - User not found

**What Gets Deleted:**
- User record
- Role-specific data (Student/Professor/HR/Admin records)
- All applications and resumes
- All saved jobs and preferences
- All notifications (sent and received)
- All job reports
- All announcements created by user
- OAuth accounts and refresh tokens
- For employers: all job postings and related data

## Error Codes

### Validation Errors (400)

#### Missing Consent
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["PDPA consent is required"]
}
```

#### Consent Not Accepted
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["PDPA consent required"]
}
```

### Authorization Errors (403)

```json
{
  "success": false,
  "message": "Unauthorized to delete this account"
}
```

## Database Fields

The `User` model now includes:

```prisma
model User {
  // ... existing fields ...
  dataProcessingConsent   Boolean   @default(false)
  privacyPolicyAcceptedAt DateTime?
  // ... other fields ...
}
```

## Testing with cURL

### Test Registration with Consent
```bash
curl -X POST http://localhost:3000/api/register/alumni \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "surname": "User",
    "email": "test@example.com",
    "password": "TestPass123!",
    "degreeTypeId": "cm3w8jz0l0000vvmd6y7qg123",
    "address": "123 Test St",
    "privacyConsent": {
      "dataProcessingConsent": true
    }
  }'
```

### Test Registration without Consent (Should Fail)
```bash
curl -X POST http://localhost:3000/api/register/alumni \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "surname": "User",
    "email": "test2@example.com",
    "password": "TestPass123!",
    "degreeTypeId": "cm3w8jz0l0000vvmd6y7qg123",
    "address": "123 Test St"
  }'
```

### Test Account Deletion
```bash
# First, login to get cookies
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }' \
  -c cookies.txt

# Then delete account
curl -X DELETE http://localhost:3000/api/user/USER_ID_HERE \
  -b cookies.txt
```

## Notes

1. **OAuth Users**: Google OAuth registrations automatically set `dataProcessingConsent: true` and `privacyPolicyAcceptedAt: <current_timestamp>`, as consent is assumed through the OAuth flow.

2. **Cascade Deletion**: When an account is deleted, all related records are removed in a single database transaction to ensure data integrity.

3. **Privacy Policy**: The privacy policy content is served as a static page by the frontend at `/privacy-policy`. There is no backend API endpoint for policy content in this minimal implementation.

4. **Irreversible**: Account deletion is permanent and cannot be undone. Consider adding a confirmation step in the frontend.

5. **File Cleanup**: The current implementation deletes database records. If your application stores uploaded files (avatars, resumes, etc.), you'll need to add file deletion logic separately.
