# 🔒 KU Connect Authentication & Authorization Plan

This document describes how to implement secure authentication and role-based authorization in KU Connect. It focuses on storing user credentials safely, issuing tokens, verifying users, and assigning permissions based on their roles (STUDENT, PROFESSOR, EMPLOYER, ADMIN).

---

## 1. Password Storage

* **Hashing Algorithm**: Use **bcrypt** (preferred) or **Argon2id** if available.
* **Hashing Parameters**: Use bcrypt with a cost factor (salt rounds) between **10–12**.
* **Storage**: Store **only the hash**, never the plain-text password.

---

## 2. Token-Based Authentication

We will use **JWT (JSON Web Tokens)** for session management, split into two types of tokens:

* **Access Token**: Short-lived (≈15 minutes), includes `{ id, role }`. Stored in HTTP-only, Secure cookies. Verified per request, no DB lookup required.
* **Refresh Token**: Long-lived (≈7 days), includes `{ id, jti }`. Stored in cookie and DB. Used to issue new access tokens. Supports revocation.

---

## 3. Database Schema Additions

New table for refresh tokens:

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
```

---

## 4. Authentication Flow

1. **Signup**: Hash password, store user with role.
2. **Login**: Verify password → generate access & refresh tokens → save refresh token to DB → send in cookies.
3. **Accessing APIs**: Verify access token with `authMiddleware` → attach `{ id, role }` to `req.user`.
4. **Refreshing Tokens**: Validate refresh token against DB → issue new access token (and optionally rotate refresh token).
5. **Logout**: Delete refresh token from DB → clear cookies.

---

## 5. Middleware

* **authMiddleware.js**: Verifies JWT, attaches `req.user`.
* **roleMiddleware.js**: Ensures user role matches required permissions.
* **errorHandler.js**: Centralized error formatting.

---

## 6. Role Permission Matrix

Define which actions each role can perform. This will guide `roleMiddleware` and endpoint design.

| Action / Resource              | STUDENT | PROFESSOR | EMPLOYER | ADMIN |
| ------------------------------ | :-----: | :-------: | :------: | :---: |
| Create account / Login         |    ✅    |     ✅     |     ✅    |   ✅   |
| Manage own profile             |    ✅    |     ✅     |     ✅    |   ✅   |
| View job postings              |    ✅    |     ✅     |     ✅    |   ✅   |
| Apply to job postings          |    ✅    |     ❌     |     ❌    |   ❌   |
| Manage own applications        |    ✅    |     ❌     |     ❌    |   ❌   |
| Create job postings            |    ❌    |     ❌     |     ✅    |   ❌   |
| Manage own job postings        |    ❌    |     ❌     |     ✅    |   ❌   |
| View insights on students      |    ❌    |     ✅     |     ❌    |   ✅   |
| Moderate content (jobs, users) |    ❌    |     ❌     |     ❌    |   ✅   |
| Manage roles & permissions     |    ❌    |     ❌     |     ❌    |   ✅   |

* ✅ = Allowed
* ❌ = Forbidden

---

## 7. Security Best Practices

* Store tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
* Keep access tokens short-lived.
* Refresh tokens stored in DB allow revocation.
* If scaling horizontally, use Redis to store refresh tokens for faster lookups.

---

## 8. Project Structure

```
/src
├── /controllers
│   └── authController.js     # Handles login, signup, refresh, logout
├── /middlewares
│   ├── authMiddleware.js     # Verifies access token
│   ├── roleMiddleware.js     # Enforces role-based access
│   └── errorHandler.js       # Centralized error handling
├── /services
│   ├── authService.js        # Core auth logic (login, refresh, logout)
│   ├── tokenService.js       # Token creation and verification
│   └── userService.js        # User lookup and management
├── /utils
│   └── passwordUtils.js      # Password hashing and comparison
├── /validators
│   └── authValidator.js      # Input validation (signup/login)
```

---

## 9. Testing Plan

### Unit Tests

* Password hashing & comparison.
* Token creation, expiration, and verification.
* Role-based checks.

### Integration Tests

* Signup → login → access protected route → refresh → logout flow.
* Verify STUDENT cannot create job postings.
* Verify EMPLOYER cannot view insights.
* Verify ADMIN has full access.
* Test revoked refresh tokens cannot generate new access tokens.