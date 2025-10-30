# Task
Implement a file storage abstraction layer for handling user profile picture uploads in an Express + Prisma backend.
The implementation must follow the Storage Provider Interface pattern so that the backend can switch between local storage, AWS S3, or other providers without changing the API endpoints or the frontend.

# Project Context
- Stack: Express.js, JavaScript (ES Modules), Prisma ORM, PostgreSQL
- Project structure matches: /src/controllers, /src/services, /src/routes, etc.
- Auth via JWT; routes already use `req.user.id` for authenticated user IDs.
- Goal: Allow each user to upload a single profile picture ("avatar").

# Requirements
1. **Create a unified interface**
   - File: `/src/services/storage/storageProvider.js`
   - Define an abstract base class `StorageProvider` with these async methods:
     - `uploadFile(buffer, filename, mimeType, userId)` → returns a file key
     - `getFileUrl(fileKey)` → returns an accessible URL (signed or direct)
     - `deleteFile(fileKey)` → deletes a file by key

2. **Implement concrete providers**
   - `/src/services/storage/localStorageProvider.js`
     - Stores files under `/uploads/avatars/`
     - Returns local URL like `/uploads/avatars/<fileKey>`
   - `/src/services/storage/s3StorageProvider.js`
     - Uploads to S3 using AWS SDK v2 or v3
     - Returns a signed URL valid for 5 minutes
     - Uses environment variables:
       ```
       AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME
       ```
   - Ensure both providers implement the same interface contract.

3. **Create a factory**
   - `/src/services/storageFactory.js`
   - Reads `.env` variable `STORAGE_PROVIDER` (`'local'` or `'s3'`)
   - Returns the corresponding instance of `StorageProvider`

4. **Integrate with controller**
   - `/src/controllers/profileController.js`
   - Use `multer.memoryStorage()` to read uploaded image buffers.
   - Validate file type (only images) and size (<2 MB).
   - On upload:
     - Call `storageProvider.uploadFile()`
     - Save returned `fileKey` in `User.avatarKey` field (Prisma)
   - On retrieval:
     - Use `storageProvider.getFileUrl()` to return `{ url }` to the client.
   - Endpoints:
     - `POST /api/profile/avatar` → upload
     - `GET /api/profile/avatar/:userId` → fetch avatar URL

5. **Server setup**
   - Serve `/uploads` statically only in development for local storage.
   - Add configuration in `server.js`:
     ```js
     app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
     ```

6. **Security and standards**
   - Follow JavaScript Standard Style (no semicolons, single quotes, etc.).
   - Follow JSDoc for docstrings.
   - Ensure proper error handling and small helper comments explaining *why*.

7. **Optional test stubs**
   - Under `/tests/services/storage/`, create test skeletons verifying that:
     - Each provider implements all interface methods.
     - Uploads and deletions behave correctly.

# Expected Outcome
After implementation:
- The frontend can call `/api/profile/avatar/:userId` to get a JSON `{ url }` response.
- Switching `.env: STORAGE_PROVIDER=local` → `s3` changes only backend behavior, not frontend.
- The system works with both local and AWS S3 seamlessly.

