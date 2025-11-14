# OAuth Implementation - Quick Reference

## Files Modified/Created

### Schema & Database

- ✅ `prisma/schema.prisma` - Added Account model, made User.password optional
- ✅ `prisma/migrations/20251014080912_add_oauth_account_model/` - Migration files generated

### Core Application

- ✅ `src/services/authService.js` - Added `findOrCreateGoogleUser()`, updated `loginUser()`
- ✅ `src/utils/passport.js` - New: Google OAuth strategy configuration
- ✅ `src/routes/auth.js` - Added `/auth/google` and `/auth/google/callback` routes
- ✅ `src/app.js` - Integrated Passport middleware

### Tests

- ✅ `tests/src/services/authService.test.js` - Unit tests for OAuth functions
- ✅ `tests/src/routes/authRoutes.test.js` - Integration tests for OAuth routes

### Documentation

- ✅ `documents/authorization-and-authentication/OAUTH_IMPLEMENTATION_GUIDE.md` - Complete guide
- ✅ `.env.example` - Updated with OAuth variables

## Environment Setup

```bash
# 1. Install dependencies (already done)
npm install passport passport-google-oauth20

# 2. Run migration (already done)
npx prisma migrate dev --name add_oauth_account_model

# 3. Add to .env file:
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/auth/google/callback"
```

## API Endpoints

| Method | Endpoint                    | Description                 |
| ------ | --------------------------- | --------------------------- |
| GET    | `/api/auth/google`          | Initiate Google OAuth       |
| GET    | `/api/auth/google/callback` | OAuth callback, returns JWT |
| POST   | `/api/auth/refresh`         | Refresh access token        |
| POST   | `/api/auth/logout`          | Invalidate refresh token    |
| GET    | `/api/auth/me`              | Get current user profile    |

## Key Features Implemented

1. **Identity/Account Segregation Pattern**
   - One User can have multiple OAuth Accounts
   - OAuth users have `password: null`

2. **Three User Scenarios Handled**
   - New user → Create User + Account + Student
   - Existing account → Return existing user
   - Existing email → Link new Account to User

3. **Security**
   - Passport runs without sessions (`session: false`)
   - JWT-based authentication
   - Password check before local login
   - OAuth users cannot use local login

4. **Complete Test Coverage**
   - Unit tests for service functions
   - Integration tests for routes
   - Mock passport authentication

## Testing

```bash
# Run all tests
npm test

# Run specific test files
npm test authService.test.js
npm test authRoutes.test.js
```

## Database Schema

```prisma
model User {
  password     String?        // ← Now optional
  accounts     Account[]      // ← New relation
  // ...
}

model Account {
  id                String   @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  access_token      String?
  refresh_token     String?
  user              User     @relation(...)

  @@unique([provider, providerAccountId])
}
```

## Next Steps

1. Set up Google OAuth credentials in Google Cloud Console
2. Add credentials to `.env` file
3. Ensure DegreeType(id=1) exists in database
4. Test OAuth flow in development
5. Update frontend to use OAuth endpoints

## Common Issues & Solutions

**Issue:** "This account uses OAuth authentication"

- **Solution:** User has OAuth account, cannot use local login

**Issue:** Migration not applied

- **Solution:** Run `npx prisma migrate dev`

**Issue:** Prisma Client out of date

- **Solution:** Run `npx prisma generate`

**Issue:** No DegreeType found

- **Solution:** Insert at least one DegreeType record

**Issue:** CORS errors

- **Solution:** Check `FRONTEND_URL` in `.env`
