# Google OAuth 2.0 Implementation Guide

## Overview

This document provides instructions for configuring and using the Google OAuth 2.0 authentication system that has been integrated into the KU-Connect backend application.

## Architecture

The implementation follows the **Identity/Account Segregation Pattern**:

- **User Model**: Contains core user identity information
- **Account Model**: Stores provider-specific OAuth data (Google, Facebook, etc.)
- Users can have multiple accounts linked to different providers

## Environment Variables

Add the following variables to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

## Setting Up Google OAuth

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen if prompted
6. Select "Web application" as application type
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - Your production URL when deploying
8. Copy the Client ID and Client Secret to your `.env` file

### 2. Database Setup

The OAuth implementation requires the `Account` model and modified `User` model. The migration has already been created and applied:

```bash
# Migration already run, but if you need to reset:
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate
```

Ensure you have at least one `DegreeType` in your database:

```sql
INSERT INTO DegreeType (id, name) VALUES (1, 'Bachelor of Science');
```

## API Endpoints

### Initiate Google OAuth Flow

```
GET /api/auth/google
```

Redirects user to Google's OAuth consent screen.

### OAuth Callback

```
GET /api/auth/google/callback
```

Handles the OAuth callback from Google and returns JWT tokens.

**Success Response:**

```json
{
  "user": {
    "id": "user-id",
    "name": "John",
    "surname": "Doe",
    "email": "john.doe@gmail.com",
    "role": "STUDENT",
    "verified": true,
    "createdAt": "2025-10-14T08:00:00.000Z",
    "updatedAt": "2025-10-14T08:00:00.000Z"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

## Authentication Flow

### New User (First-time Google Sign-in)

1. User clicks "Sign in with Google"
2. Frontend redirects to `/api/auth/google`
3. User authenticates with Google
4. Google redirects back to `/api/auth/google/callback`
5. Backend creates:
   - New `User` record (no password, verified=true, role=STUDENT)
   - New `Account` record linked to User (provider=google)
   - New `Student` record with placeholder data
6. JWT tokens are issued and returned

### Existing User (Returning Google User)

1. Same flow as above (steps 1-4)
2. Backend finds existing `Account` by `providerAccountId`
3. Returns existing user data with new JWT tokens

### Account Linking (User exists with email, new Google sign-in)

1. Same flow as above (steps 1-4)
2. Backend finds existing `User` by email
3. Creates new `Account` record linked to existing User
4. Returns existing user data with new JWT tokens

### Local Login Protection

Users who signed up via OAuth cannot use local login (password authentication). The system will return:

```json
{
  "error": "This account uses OAuth authentication. Please sign in with Google."
}
```

## Frontend Integration Example

```typescript
// Redirect to Google OAuth
const handleGoogleLogin = () => {
  window.location.href = "http://localhost:3000/api/auth/google";
};

// Handle OAuth callback (if using client-side routing)
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

  if (token) {
    // Store token and redirect to dashboard
    localStorage.setItem("accessToken", token);
    navigate("/dashboard");
  }
}, []);
```

## Testing

Run the test suites:

```bash
# Run all tests
npm test

# Run OAuth-specific tests
npm test authService.test.js
npm test authRoutes.test.js
```

### Test Coverage

**authService.test.js:**

- ✅ Finding existing user by Google account
- ✅ Linking Google account to existing email
- ✅ Creating new user with Google OAuth
- ✅ Preventing local login for OAuth users
- ✅ Successful local login for password users

**authRoutes.test.js:**

- ✅ Google OAuth initiation
- ✅ OAuth callback with token generation
- ✅ OAuth callback failure handling
- ✅ Token refresh functionality
- ✅ User logout

## Security Considerations

1. **No Sessions**: Implementation uses JWT tokens without server-side sessions
2. **HTTPS Required**: Always use HTTPS in production for OAuth callbacks
3. **Token Storage**: Access tokens should be stored securely (httpOnly cookies recommended)
4. **CORS Configuration**: Ensure `FRONTEND_URL` is properly configured
5. **Environment Variables**: Never commit `.env` file to version control

## Database Schema Changes

### User Model

```prisma
model User {
  id           String         @id @default(cuid())
  name         String
  surname      String
  password     String?        // Now optional for OAuth users
  email        String         @unique
  role         Role
  verified     Boolean        @default(false)
  accounts     Account[]      // New relation to Account
  // ... other fields
}
```

### Account Model (New)

```prisma
model Account {
  id                String   @id @default(cuid())
  userId            String
  type              String
  provider          String   // "google", "facebook", etc.
  providerAccountId String   // Provider's user ID
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

## Troubleshooting

### "Invalid credentials" error

- Verify Google Client ID and Secret in `.env`
- Check that redirect URI matches exactly in Google Console

### "DegreeType not found" error

- Ensure at least one DegreeType exists in database
- Run seed script if available

### CORS errors

- Verify `FRONTEND_URL` in `.env` matches your frontend origin
- Check that credentials are enabled in CORS configuration

### Tests failing

- Ensure test database is configured properly
- Run migrations on test database
- Check that all mocks are properly configured

## Next Steps

1. **Add More OAuth Providers**: Extend with Facebook, GitHub, etc.
2. **Improve User Profile**: Allow users to update placeholder data
3. **Account Management**: Let users link/unlink OAuth accounts
4. **Email Verification**: Add email verification for local signups
5. **Role Management**: Implement role selection for OAuth users

## References

- [Passport.js Documentation](http://www.passportjs.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Prisma Documentation](https://www.prisma.io/docs)
