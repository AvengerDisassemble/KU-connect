# Backend Implementation Plan (MINIMAL): PDPA Consent

**Document Version**: 1.0  
**Last Updated**: November 26, 2025  
**Target Audience**: Backend Development Team  
**Estimated Effort**: 1-2 days (1 developer)

---

## Overview

Objective
- Implement a minimal PDPA-compliant backend surface that supports: storing a single required data-processing consent at registration and honoring the right to erasure via an account deletion endpoint.

Key constraints
- Keep the API surface small: no privacy/terms content endpoints, no consent management endpoints, no consent versioning, no audit trail fields.

---

## Architecture & File Structure (minimal additions)

Add or modify a few backend files to persist the minimal consent and support account deletion.

```
backend/
├── prisma/
│   └── schema.prisma         # modify User model (see DB changes)
├── src/
│   ├── controllers/
│   │   └── userController.js # modify registration, and findOrCreateGoogleUser add delete handler
│   ├── services/
│   │   └── userService.js    # add deleteAccount function and consent handling
│   └── routes/
│       └── user.js           # ensure DELETE /api/user/:id route exists
```

---

## Database Schema Changes (minimal)

Modify the `User` model in `backend/prisma/schema.prisma` to include two new columns:

- `dataProcessingConsent` Boolean NOT NULL DEFAULT false
- `privacyPolicyAcceptedAt` DateTime? (nullable)

Prisma example snippet:
```prisma
model User {
  id                          String   @id @default(cuid())
  email                       String   @unique
  // ... existing fields ...
  dataProcessingConsent       Boolean  @default(false)
  privacyPolicyAcceptedAt     DateTime?
}
```

Notes
- We intentionally do NOT add fields for IP, user agent, consent method, or policy version.

---

## Registration: validation & storage

What to change
- Registration endpoints (e.g. `POST /api/auth/register` or `POST /api/register/*`) must accept a small `privacyConsent` object in the request body and validate it.

Minimal request snippet (frontend will send):
```json
{
  // existing registration fields
  "privacyConsent": { "dataProcessingConsent": true }
}
```

Server-side behavior
- Validate that `privacyConsent` exists and `dataProcessingConsent === true`. If missing or false, return 400 Bad Request with an explanatory message.
- When creating the user, persist `dataProcessingConsent: true` and set `privacyPolicyAcceptedAt` to the current timestamp inside the same transaction that creates the User.

Example pseudo-code (service layer):
```js
if (!privacyConsent || privacyConsent.dataProcessingConsent !== true) {
  throw new BadRequestError('PDPA consent required');
}

const user = await prisma.$transaction(async (tx) => {
  return tx.user.create({ data: {
    // ...other fields
    dataProcessingConsent: true,
    privacyPolicyAcceptedAt: new Date()
  }});
});
```

---

## Delete account (Right to Erasure)

Endpoint
- `DELETE /api/user/:id` — authenticated endpoint that deletes the specified user and associated personal data.

Behavior and considerations
- Authorization: user can delete their own account; admins may delete accounts per existing authorization rules.
- Deletion semantics: perform a transaction that removes or anonymizes personal data stored in dependent tables (profiles, resumes, uploaded files). Concrete actions depend on existing schema:
  - Remove rows in `Profile`, `Resume`, `Upload` tables referencing `userId`.
  - Delete or unlink uploaded files from disk/cloud storage (if applicable).
  - Optionally anonymize audit/log records that must be retained for operational reasons (but prefer deletion for minimal scope).
- Ensure deletion is irreversible in this minimal implementation (no soft-delete) unless the project prefers soft-delete — document the chosen approach.

Example pseudo-code (service):
```js
await prisma.$transaction(async (tx) => {
  await tx.resume.deleteMany({ where: { userId } });
  await tx.upload.deleteMany({ where: { userId } });
  await tx.profile.deleteMany({ where: { userId } });
  await tx.user.delete({ where: { id: userId } });
});
// remove files from storage if needed
```

Response
- 204 No Content on success.
- 403 if user is not authorized to delete the target account.
- 404 if user not found.

---

## Routes & Controller Changes

1. Update registration controller
- Validate `privacyConsent` and persist consent fields when creating a user.

2. Add or update `userController.deleteAccount(req, res)` to handle DELETE `/api/user/:id`.

3. Do NOT add any dedicated `/api/privacy/...` routes — privacy policy is frontend-only in this minimal scope.

3. For the function `findOrCreateGoogleUser` in the `authService.js`, you must also add the consent is true to it.

---

## Validation

- New server-side validators should ensure `privacyConsent.dataProcessingConsent === true` for registration. Keep error messages clear so frontend can surface them.

---

## Testing Strategy (minimal)

Unit tests
- Service-level test: attempt to register without `privacyConsent` → expect validation error (400).  
- Service-level test: register with `privacyConsent.dataProcessingConsent = true` → user created and `privacyPolicyAcceptedAt` set.

Integration tests
- End-to-end test: simulate registration flow and assert DB user has `dataProcessingConsent: true` and `privacyPolicyAcceptedAt` is non-null.  
- End-to-end test: authenticated DELETE `/api/user/:id` removes the user and related data; subsequent GET returns 404.

Manual tests
- Try registering without consent: backend returns 400.  
- Register with consent and inspect DB for consent fields.  
- Delete account and verify personal records are removed.

---

## Security & Privacy Notes

- Keep `privacyPolicyAcceptedAt` as the only consent metadata stored.  
- Do not log consent payloads or sensitive user data to public logs.  
- Ensure delete endpoint requires authentication and CSRF protections (if applicable).

---

## Out of Scope (explicitly removed)

- No consent versioning or policy version numbers.  
- No consent history or audit trail (IP, user agent, consent method).  
- No marketing consent.  
- No dedicated `/api/privacy/*` endpoints for policy content or consent checks.  
- No admin dashboards for consent reporting.
