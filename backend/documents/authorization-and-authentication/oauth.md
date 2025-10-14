Your task is to implement the **Google OAuth 2.0 and JWT authentication** into the main application codebase, following the **Identity/Account Segregation Pattern**. You must strictly adhere to the project's file structure, stack, JavaScript Standard Style, and JSDoc conventions.

**Primary Objectives & Required Changes:**

1.  **Schema Update (`prisma/schema.prisma`):**
    * Modify the `User` model: make the `password` field **optional** (`String?`).
    * Add a new `Account` model to store provider-specific OAuth data (`userId`, `type`, `provider`, `providerAccountId`, etc.), ensuring `@@unique([provider, providerAccountId])` and a relation to `User` with `onDelete: Cascade`.
    * **CRUCIAL:** Create a new migration file and generate the Prisma Client.

2.  **Auth Service Update (`src/services/authService.js`):**
    * Implement the `findOrCreateGoogleUser` service function (as discussed) which performs an **upsert** (find or create) on the `User` and `Account` models based on the Google profile.
        * If the user exists by `providerAccountId`, return the user.
        * If the user exists by `email` but not by `providerAccountId`, create a new `Account` linked to the existing `User`.
        * Otherwise, create a new `User` (defaulting `role: 'STUDENT'`, setting `verified: true`, and **omitting a password**), a new linked `Account`, and a new associated `Student` record (provide placeholder data for mandatory fields like `address` and a hardcoded or default `degreeTypeId: 1`).
    * **UPDATE EXISTING LOGIC:** Modify the existing local login function (e.g., `verifyLocalCredentials`) to **check if `user.password` exists** before attempting a hash comparison. Throw an error if a password is not present (`null`), as this account is OAuth-only.

3.  **Passport & Route Configuration:**
    * In the Google Passport strategy, use the updated `findOrCreateGoogleUser` service in the verification callback to manage user data. **Ensure sessions are disabled** (`{ session: false }`) in all Passport authentication calls.
    * Configure the two required routes: `GET /auth/google` and `GET /auth/google/callback` to use Passport and issue a JWT upon successful callback.

4.  **Testing (`tests/services/authService.test.js` and `tests/routes/authRoutes.test.js`):**
    * Generate unit tests for the **`findOrCreateGoogleUser`** service function covering the three scenarios: (1) existing account, (2) existing email/user (link new account), and (3) completely new user (create user/account/student).
    * Generate unit tests for the **updated local login function** to ensure it throws an error when trying to log in an OAuth-only user (where `user.password` is `null`).
    * Generate an integration test for the Google OAuth routes that mocks Passport's success to verify a JWT is returned.

**Execution Order:**

1.  Update `prisma/schema.prisma` with the `Account` model and `User.password` change.
2.  Generate the migration files and run `prisma generate`.
3.  Update `src/services/authService.js`.
4.  Update Passport configuration in `src/utils/passport.js`.
5.  Update routes in `src/routes/authRoutes.js`.
6.  Generate test files in the `tests/` directory mirroring the `src/` structure.

**Start by showing the updated `prisma/schema.prisma` content.**






