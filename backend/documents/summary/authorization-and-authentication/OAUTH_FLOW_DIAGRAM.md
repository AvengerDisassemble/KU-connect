# OAuth Flow Diagram

## Google OAuth 2.0 Authentication Flow

```
┌─────────┐                                      ┌──────────────┐
│ Browser │                                      │ Google OAuth │
└────┬────┘                                      └──────┬───────┘
     │                                                  │
     │  1. Click "Sign in with Google"                 │
     │  GET /api/auth/google                           │
     ├──────────────────────────────────────►          │
     │                                       │          │
     │                                       │ KU-Connect
     │                                       │ Backend
     │                                       │          │
     │  2. Redirect to Google                │          │
     │  ◄─────────────────────────────────────          │
     │                                       │          │
     │                                                  │
     │  3. User authenticates with Google              │
     ├─────────────────────────────────────────────────►
     │                                                  │
     │  4. Google redirects back with code             │
     │  GET /callback?code=...                         │
     ◄──────────────────────────────────────────────────┤
     │                                                  │
     │                                       │          │
     │                                       │ 5. Exchange code
     │                                       │    for profile
     │                                       ├─────────►
     │                                       │          │
     │                                       │ 6. Return profile
     │                                       ◄──────────┤
     │                                       │          │
     │                                       │ 7. findOrCreateGoogleUser()
     │                                       │    ├─ Find by providerAccountId
     │                                       │    ├─ Find by email
     │                                       │    └─ Create new user
     │                                       │          │
     │                                       │ 8. Generate JWT tokens
     │                                       │    ├─ Access Token
     │                                       │    └─ Refresh Token
     │                                       │          │
     │  9. Return tokens                     │          │
     │  { user, accessToken, refreshToken }  │          │
     ◄──────────────────────────────────────────        │
     │                                       │          │
     │  10. Store tokens & redirect          │          │
     │  to dashboard                         │          │
     │                                                  │
```

## Database Flow - Three Scenarios

### Scenario 1: Existing Account

```
findOrCreateGoogleUser(profile)
  │
  ├─ Find Account by provider + providerAccountId
  │   ├─ ✅ Found
  │   │
  │   └─ Return existing user
  │       └─ No database changes
```

### Scenario 2: Existing Email, New Provider

```
findOrCreateGoogleUser(profile)
  │
  ├─ Find Account by provider + providerAccountId
  │   └─ ❌ Not found
  │
  ├─ Find User by email
  │   ├─ ✅ Found
  │   │
  │   └─ Create new Account
  │       ├─ Link to existing User
  │       └─ Return existing user
  │
  └─ Database: INSERT INTO Account (userId, provider, ...)
```

### Scenario 3: Brand New User

```
findOrCreateGoogleUser(profile)
  │
  ├─ Find Account by provider + providerAccountId
  │   └─ ❌ Not found
  │
  ├─ Find User by email
  │   └─ ❌ Not found
  │
  └─ Transaction: Create User + Account + Student
      │
      ├─ INSERT INTO User
      │   ├─ password: null
      │   ├─ verified: true
      │   └─ role: 'STUDENT'
      │
      ├─ INSERT INTO Account
      │   ├─ userId: new_user_id
      │   ├─ provider: 'google'
      │   └─ providerAccountId: 'google-123'
      │
      └─ INSERT INTO Student
          ├─ userId: new_user_id
          ├─ degreeTypeId: 1
          └─ address: 'To be updated'
```

## Database Schema Relationships

```
┌─────────────────────────┐
│        User             │
├─────────────────────────┤
│ id: String (PK)         │
│ email: String (unique)  │
│ password: String?       │◄──────┐
│ role: Role              │       │
│ verified: Boolean       │       │
└─────────────────────────┘       │
         │                         │
         │ 1:N                     │ N:1
         │                         │
┌─────────────────────────┐       │
│       Account           │       │
├─────────────────────────┤       │
│ id: String (PK)         │       │
│ userId: String (FK)     ├───────┘
│ provider: String        │
│ providerAccountId: String
│ access_token: String?   │
│ refresh_token: String?  │
└─────────────────────────┘
         │
         │ unique constraint
         └─ (provider, providerAccountId)
```

## Authentication Decision Tree

```
User attempts login
  │
  ├─ OAuth Login (Google)
  │   │
  │   ├─ Has Account with provider?
  │   │   ├─ Yes → Return user + JWT
  │   │   └─ No → Check email
  │   │       ├─ Email exists?
  │   │       │   ├─ Yes → Link Account + Return user + JWT
  │   │       │   └─ No → Create User + Account + Student + Return JWT
  │   │
  │   └─ Sessions: Disabled (stateless JWT)
  │
  └─ Local Login (Email/Password)
      │
      ├─ User exists?
      │   ├─ No → Error: "Invalid credentials"
      │   └─ Yes → Check password
      │       │
      │       ├─ password == null?
      │       │   └─ Yes → Error: "Use OAuth authentication"
      │       │
      │       └─ password != null?
      │           ├─ Compare hash
      │           │   ├─ Valid → Return user + JWT
      │           │   └─ Invalid → Error: "Invalid credentials"
      │           │
      │           └─ Store refresh token in DB
```

## JWT Token Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Initial Login                         │
│                                                          │
│  OAuth Callback / Local Login                           │
│    ↓                                                     │
│  Generate Access Token (15m)                            │
│    ├─ Payload: { id, role }                            │
│    └─ Sign with ACCESS_TOKEN_SECRET                     │
│    ↓                                                     │
│  Generate Refresh Token (7d)                            │
│    ├─ Payload: { id, jti }                             │
│    ├─ Sign with REFRESH_TOKEN_SECRET                    │
│    └─ Store in database                                 │
│    ↓                                                     │
│  Return { user, accessToken, refreshToken }             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│               Authenticated Request                       │
│                                                          │
│  Client sends: Authorization: Bearer <accessToken>       │
│    ↓                                                     │
│  authMiddleware validates token                         │
│    ├─ Verify signature                                  │
│    ├─ Check expiration                                  │
│    └─ Attach user to req.user                          │
│    ↓                                                     │
│  Route handler processes request                         │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                Token Refresh Flow                         │
│                                                          │
│  Access token expired                                    │
│    ↓                                                     │
│  POST /auth/refresh { refreshToken }                    │
│    ↓                                                     │
│  Verify refresh token signature                         │
│    ↓                                                     │
│  Check token exists in database                         │
│    ↓                                                     │
│  Check expiration date                                  │
│    ↓                                                     │
│  Generate new access token                              │
│    ↓                                                     │
│  Return { accessToken, user }                           │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                   Logout Flow                            │
│                                                          │
│  POST /auth/logout { refreshToken }                     │
│    ↓                                                     │
│  Delete refresh token from database                      │
│    ↓                                                     │
│  Client discards both tokens                            │
│    ↓                                                     │
│  User logged out (stateless)                            │
└──────────────────────────────────────────────────────────┘
```

## Code Architecture

```
src/
│
├── app.js
│   ├─ Import passport configuration
│   ├─ Initialize passport middleware
│   └─ Mount routes
│
├── utils/
│   ├── passport.js
│   │   ├─ Configure GoogleStrategy
│   │   ├─ Call findOrCreateGoogleUser
│   │   └─ Export configured passport
│   │
│   ├── tokenUtils.js
│   │   ├─ generateAccessToken()
│   │   ├─ generateRefreshToken()
│   │   └─ verifyRefreshToken()
│   │
│   └── passwordUtils.js
│       ├─ hashPassword()
│       └─ comparePassword()
│
├── services/
│   └── authService.js
│       ├─ registerUser()
│       ├─ loginUser() ← Updated: Check null password
│       ├─ refreshAccessToken()
│       ├─ logoutUser()
│       ├─ getUserById()
│       └─ findOrCreateGoogleUser() ← New
│
├── routes/
│   └── auth.js
│       ├─ GET /google ← New
│       ├─ GET /google/callback ← New
│       ├─ POST /refresh
│       ├─ POST /logout
│       └─ GET /me
│
└── middlewares/
    └── authMiddleware.js
        └─ Validate JWT tokens
```

## Testing Architecture

```
tests/src/
│
├── services/
│   └── authService.test.js
│       ├─ findOrCreateGoogleUser()
│       │   ├─ Test: Existing account
│       │   ├─ Test: Link to existing email
│       │   └─ Test: Create new user
│       │
│       └─ loginUser()
│           ├─ Test: OAuth-only user protection
│           ├─ Test: Local user success
│           └─ Test: Invalid credentials
│
└── routes/
    └── authRoutes.test.js
        ├─ GET /auth/google
        ├─ GET /auth/google/callback
        ├─ POST /auth/refresh
        └─ POST /auth/logout
```

---

**Generated:** October 14, 2025
**Pattern:** Identity/Account Segregation
**Authentication:** Stateless JWT
