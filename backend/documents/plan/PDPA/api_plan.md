# API Endpoints Documentation (MINIMAL): PDPA Consent

**Document Version**: 1.0  
**Last Updated**: November 26, 2025  
**Base URL**: `http://localhost:3000` (development)

---

## Overview

This document describes the minimal API surface required for the reduced PDPA implementation: registration must include an explicit PDPA consent boolean, and users must be able to delete their account (right to erasure).

Important: The privacy policy is served as a static frontend page at `/privacy-policy`. There is no backend API for policy content or versioning in this minimal scope.

---

## Authentication

- Authentication remains cookie-based (existing project behavior).  
- The delete account endpoint requires the user to be authenticated via the project's existing auth middleware and authorized to delete the specified account (own account or admin-permitted).

---

## Endpoints (minimal)

1) Register (existing project endpoint)

- Method: POST
- Path: `/api/auth/register` (or the project's existing registration path such as `/api/register/alumni`)
- Authentication: public
- Purpose: Create a new user account and store minimal PDPA consent.

Request body (minimal example)
```json
{
  "name": "Jane",
  "email": "jane@example.com",
  "password": "...",
  // other existing fields
  "privacyConsent": {
    "dataProcessingConsent": true
  }
}
```
- As for the user creating their account via OAuth, it will be assumed that the user has already consented to the terms.

Validation
- `privacyConsent` must be present and `dataProcessingConsent` must be `true`. If not, return `400 Bad Request` with a message like: `"PDPA consent required"`.

Success Response
- 201 Created with standard registration payload (user object / tokens) used by the app.

Error Responses
- 400 Bad Request — missing or false PDPA consent
- 409 Conflict — if email already exists (existing project behavior)
- 500 Internal Server Error — server-side failure

Notes
- The backend will persist two fields on the `User` record: `dataProcessingConsent` (boolean) and `privacyPolicyAcceptedAt` (timestamp).

2) Delete account

- Method: DELETE
- Path: `/api/user/:id`
- Authentication: required (auth cookie)
- Purpose: Implement PDPA right to erasure by removing the user and related personal data.

Behavior
- Authorization: users may delete their own account; admins may delete others per existing policy. Return `403` if unauthorized.
- On success: remove dependent personal data (profiles, resumes, uploads) and the `User` row, and return `204 No Content`.
- If the project stores files (disk or cloud), delete or unlink those files as part of the process.

Responses
- 204 No Content — success
- 403 Forbidden — unauthorized
- 404 Not Found — user not found
- 500 Internal Server Error — deletion failed

Example curl (authenticated)
```bash
curl -X DELETE \
  -b 'authToken=<your_token>' \
  http://localhost:3000/api/user/cm3w8jz0l0000vvmd6y7qg123
```

---

## Static Privacy Policy

- The privacy policy is a static page at `/privacy-policy` in the frontend.  
- There is no `GET /api/privacy/policy` or similar endpoint in this minimal scope.

Content guidance for the static page
- Short sections: what we collect, why, user rights (access/correct/delete), contact email. Keep language clear and non-technical.

---

## Out-of-scope / Removed Endpoints (explicit)

The following features and endpoints are intentionally NOT implemented in this minimal PDPA scope. Do not reintroduce them accidentally.

- GET `/api/privacy/policy` — (removed) no backend policy API
- GET `/api/privacy/terms` — (removed)
- POST `/api/privacy/consent` — (removed) no separate consent-recording endpoint
- GET/PATCH `/api/privacy/consent/:userId` — (removed) no consent management endpoints
- GET `/api/privacy/consent/check/:userId` — (removed) no consent update checks
- Any admin endpoints for consent reporting (e.g., `/api/privacy/consent/outdated`) — (removed)

---

## Testing Recommendations

- Test registration without `privacyConsent` → expect 400 and proper message.
- Test registration with `privacyConsent.dataProcessingConsent = true` → expect successful creation and DB fields set.
- Test authenticated delete account → user and related data removed; follow-up GET returns 404.

---

## Notes

- If richer consent tracking is required later, create a separate plan to re-introduce versioning, history, and consent APIs. For now, this minimal surface keeps complexity low and meets a basic PDPA requirement.
