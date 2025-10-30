# Postman Collection Guide - Job Resume API

This document provides complete instructions for testing the job-specific resume upload/selection API using Postman.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Authentication Setup](#authentication-setup)
3. [Environment Variables](#environment-variables)
4. [API Endpoints](#api-endpoints)
5. [Test Scenarios](#test-scenarios)
6. [Postman Collection JSON](#postman-collection-json)

---

## Prerequisites

Before testing these endpoints, ensure:
1. The backend server is running (`npm run dev`)
2. Database is migrated and seeded with at least:
   - One student user with a profile resume
   - One student user without a profile resume
   - One employer/HR user
   - One admin user
   - At least one job posting

---

## Authentication Setup

All endpoints require JWT authentication. You'll need access tokens for different user roles.

### Step 1: Register/Login Users

Use the existing auth endpoints to get tokens:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

Save the `accessToken` for subsequent requests.

---

## Environment Variables

Set up Postman environment variables for easier testing:

| Variable | Description | Example |
|----------|-------------|---------|
| `base_url` | API base URL | `http://localhost:3000/api` |
| `student_token` | Student access token | `eyJhbGciOiJIUz...` |
| `student2_token` | Another student token | `eyJhbGciOiJIUz...` |
| `hr_token` | HR/Employer token | `eyJhbGciOiJIUz...` |
| `admin_token` | Admin token | `eyJhbGciOiJIUz...` |
| `student_user_id` | Student user ID (CUID) | `clxxx...` |
| `job_id` | Test job ID | `1` |

---

## API Endpoints

### 1. Upload Job-Specific Resume (Upload Mode)

**Endpoint:** `POST /api/jobs/:jobId/resume`  
**Auth:** Student only  
**Content-Type:** `multipart/form-data`

#### Request

```http
POST {{base_url}}/jobs/{{job_id}}/resume
Authorization: Bearer {{student_token}}
Content-Type: multipart/form-data

Body (form-data):
- resume: [PDF file]
```

#### Postman Setup
1. Select **POST** method
2. URL: `{{base_url}}/jobs/{{job_id}}/resume`
3. **Headers** tab:
   - Key: `Authorization`, Value: `Bearer {{student_token}}`
4. **Body** tab:
   - Select **form-data**
   - Key: `resume`, Type: **File**, Value: [Select a PDF file]

#### Success Response (200)
```json
{
  "success": true,
  "message": "Job resume saved successfully",
  "data": {
    "jobId": 1,
    "link": "resumes/job-applications/1/abc123-def456.pdf",
    "source": "UPLOADED"
  }
}
```

---

### 2. Use Profile Resume (Profile Mode)

**Endpoint:** `POST /api/jobs/:jobId/resume`  
**Auth:** Student only  
**Content-Type:** `application/json`

#### Request

```http
POST {{base_url}}/jobs/{{job_id}}/resume
Authorization: Bearer {{student_token}}
Content-Type: application/json

{
  "mode": "profile"
}
```

#### Postman Setup
1. Select **POST** method
2. URL: `{{base_url}}/jobs/{{job_id}}/resume`
3. **Headers** tab:
   - Key: `Authorization`, Value: `Bearer {{student_token}}`
   - Key: `Content-Type`, Value: `application/json`
4. **Body** tab:
   - Select **raw** and **JSON**
   - Content: `{ "mode": "profile" }`

#### Success Response (200)
```json
{
  "success": true,
  "message": "Job resume saved successfully",
  "data": {
    "jobId": 1,
    "link": "resumes/abc123-profile.pdf",
    "source": "PROFILE"
  }
}
```

#### Error Response - No Profile Resume (400)
```json
{
  "success": false,
  "message": "No profile resume found. Please upload a profile resume first or upload a resume for this job"
}
```

---

### 3. Get Job Resume URL (Specific Student)

**Endpoint:** `GET /api/jobs/:jobId/resume/:studentUserId`  
**Auth:** Student (owner), HR (job owner), or Admin

#### Request

```http
GET {{base_url}}/jobs/{{job_id}}/resume/{{student_user_id}}
Authorization: Bearer {{student_token}}
```

#### Postman Setup
1. Select **GET** method
2. URL: `{{base_url}}/jobs/{{job_id}}/resume/{{student_user_id}}`
3. **Headers** tab:
   - Key: `Authorization`, Value: `Bearer {{student_token}}`

#### Success Response (200)
```json
{
  "success": true,
  "message": "Job resume URL retrieved successfully",
  "data": {
    "url": "http://localhost:3000/uploads/resumes/job-applications/1/abc123.pdf",
    "source": "UPLOADED"
  }
}
```

#### Error Response - Access Denied (403)
```json
{
  "success": false,
  "message": "Access denied"
}
```

---

### 4. Get Own Job Resume URL (Convenience Endpoint)

**Endpoint:** `GET /api/jobs/:jobId/resume/self`  
**Auth:** Student only

#### Request

```http
GET {{base_url}}/jobs/{{job_id}}/resume/self
Authorization: Bearer {{student_token}}
```

#### Postman Setup
1. Select **GET** method
2. URL: `{{base_url}}/jobs/{{job_id}}/resume/self`
3. **Headers** tab:
   - Key: `Authorization`, Value: `Bearer {{student_token}}`

#### Response
Same as endpoint #3.

---

### 5. Delete Job Resume

**Endpoint:** `DELETE /api/jobs/:jobId/resume`  
**Auth:** Student (owner) only

#### Request

```http
DELETE {{base_url}}/jobs/{{job_id}}/resume
Authorization: Bearer {{student_token}}
```

#### Postman Setup
1. Select **DELETE** method
2. URL: `{{base_url}}/jobs/{{job_id}}/resume`
3. **Headers** tab:
   - Key: `Authorization`, Value: `Bearer {{student_token}}`

#### Success Response (200)
```json
{
  "success": true,
  "message": "Job resume deleted successfully"
}
```

#### Error Response - Not Found (404)
```json
{
  "success": false,
  "message": "No resume found for this job application"
}
```

---

## Test Scenarios

### Scenario 1: Complete Application Flow (Upload Mode)

**Goal:** Student applies to a job with a custom resume

1. **Login as Student**
   ```
   POST /api/auth/login
   Save: student_token, student_user_id
   ```

2. **Upload Resume for Job**
   ```
   POST /api/jobs/1/resume
   Headers: Authorization: Bearer {{student_token}}
   Body (form-data): resume = [PDF file]
   
   Expected: 200 OK, source = "UPLOADED"
   ```

3. **Verify Resume Upload**
   ```
   GET /api/jobs/1/resume/self
   Headers: Authorization: Bearer {{student_token}}
   
   Expected: 200 OK, url returned, source = "UPLOADED"
   ```

4. **Update Resume (Replace)**
   ```
   POST /api/jobs/1/resume
   Headers: Authorization: Bearer {{student_token}}
   Body (form-data): resume = [Different PDF file]
   
   Expected: 200 OK, new link returned
   Note: Old file should be deleted automatically
   ```

---

### Scenario 2: Use Profile Resume

**Goal:** Student applies to a job using their existing profile resume

1. **Ensure Profile Resume Exists**
   ```
   POST /api/documents/resume
   Headers: Authorization: Bearer {{student_token}}
   Body (form-data): resume = [PDF file]
   
   Expected: 200 OK
   ```

2. **Apply with Profile Resume**
   ```
   POST /api/jobs/1/resume
   Headers: Authorization: Bearer {{student_token}}
   Body (JSON): { "mode": "profile" }
   
   Expected: 200 OK, source = "PROFILE"
   ```

3. **Verify Profile Resume is Used**
   ```
   GET /api/jobs/1/resume/self
   Headers: Authorization: Bearer {{student_token}}
   
   Expected: 200 OK, source = "PROFILE"
   ```

---

### Scenario 3: Switch Between Modes

**Goal:** Student switches from uploaded resume to profile resume and vice versa

1. **Upload Custom Resume**
   ```
   POST /api/jobs/1/resume
   Body (form-data): resume = [PDF file]
   Expected: 200 OK, source = "UPLOADED"
   ```

2. **Switch to Profile Resume**
   ```
   POST /api/jobs/1/resume
   Body (JSON): { "mode": "profile" }
   Expected: 200 OK, source = "PROFILE"
   Note: Custom resume file should be deleted
   ```

3. **Switch Back to Upload**
   ```
   POST /api/jobs/1/resume
   Body (form-data): resume = [New PDF file]
   Expected: 200 OK, source = "UPLOADED"
   Note: Profile resume is NOT deleted, only dereferenced
   ```

---

### Scenario 4: HR Views Applicant Resumes

**Goal:** Employer views resumes of students who applied to their job

1. **Login as HR**
   ```
   POST /api/auth/login
   Body: HR credentials
   Save: hr_token
   ```

2. **View Applicant Resume**
   ```
   GET /api/jobs/1/resume/{{student_user_id}}
   Headers: Authorization: Bearer {{hr_token}}
   
   Expected: 200 OK, url returned
   Note: Only works if HR owns job ID 1
   ```

3. **Try to View Another Job's Resume (Not Owned)**
   ```
   GET /api/jobs/999/resume/{{student_user_id}}
   Headers: Authorization: Bearer {{hr_token}}
   
   Expected: 403 Forbidden (if HR doesn't own job 999)
   ```

---

### Scenario 5: Admin Access

**Goal:** Admin can view any student's job resume

1. **Login as Admin**
   ```
   POST /api/auth/login
   Body: Admin credentials
   Save: admin_token
   ```

2. **View Any Student's Resume**
   ```
   GET /api/jobs/1/resume/{{student_user_id}}
   Headers: Authorization: Bearer {{admin_token}}
   
   Expected: 200 OK
   ```

---

### Scenario 6: Access Control Tests

**Goal:** Verify authorization rules are enforced

1. **Student A Tries to View Student B's Resume**
   ```
   GET /api/jobs/1/resume/{{student2_user_id}}
   Headers: Authorization: Bearer {{student_token}}
   
   Expected: 403 Forbidden
   ```

2. **Unauthenticated Request**
   ```
   GET /api/jobs/1/resume/self
   No Authorization header
   
   Expected: 401 Unauthorized
   ```

3. **HR Tries to Upload Resume (Wrong Role)**
   ```
   POST /api/jobs/1/resume
   Headers: Authorization: Bearer {{hr_token}}
   Body (form-data): resume = [PDF]
   
   Expected: 403 Forbidden
   ```

---

### Scenario 7: Error Handling

**Goal:** Test validation and error responses

1. **Missing Profile Resume**
   ```
   POST /api/jobs/1/resume
   Headers: Authorization: Bearer {{student2_token}}
   Body (JSON): { "mode": "profile" }
   
   Expected: 400 Bad Request
   Message: "No profile resume found..."
   ```

2. **Invalid Mode**
   ```
   POST /api/jobs/1/resume
   Body (JSON): { "mode": "invalid" }
   
   Expected: 400 Bad Request
   Message: "Invalid mode..."
   ```

3. **Non-Existent Job**
   ```
   POST /api/jobs/99999/resume
   Body (form-data): resume = [PDF]
   
   Expected: 404 Not Found
   Message: "Job not found"
   ```

4. **Non-PDF File**
   ```
   POST /api/jobs/1/resume
   Body (form-data): resume = [.txt or .jpg file]
   
   Expected: 500 or 400 (Multer validation)
   ```

5. **File Too Large (>10MB)**
   ```
   POST /api/jobs/1/resume
   Body (form-data): resume = [PDF > 10MB]
   
   Expected: 413 Payload Too Large (from Multer)
   ```

---

### Scenario 8: Delete Resume

**Goal:** Test resume deletion and cleanup

1. **Upload Resume**
   ```
   POST /api/jobs/1/resume
   Body (form-data): resume = [PDF]
   Expected: 200 OK
   ```

2. **Delete Resume**
   ```
   DELETE /api/jobs/1/resume
   Headers: Authorization: Bearer {{student_token}}
   
   Expected: 200 OK
   ```

3. **Verify Deletion**
   ```
   GET /api/jobs/1/resume/self
   Headers: Authorization: Bearer {{student_token}}
   
   Expected: 404 Not Found
   ```

4. **Delete Non-Existent Resume**
   ```
   DELETE /api/jobs/1/resume
   Expected: 404 Not Found
   ```

---

## Postman Collection JSON

Copy this JSON to import the complete collection into Postman:

```json
{
  "info": {
    "name": "KU-Connect Job Resume API",
    "description": "Job-specific resume upload and management endpoints",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000/api",
      "type": "string"
    },
    {
      "key": "student_token",
      "value": "",
      "type": "string"
    },
    {
      "key": "student2_token",
      "value": "",
      "type": "string"
    },
    {
      "key": "hr_token",
      "value": "",
      "type": "string"
    },
    {
      "key": "admin_token",
      "value": "",
      "type": "string"
    },
    {
      "key": "student_user_id",
      "value": "",
      "type": "string"
    },
    {
      "key": "student2_user_id",
      "value": "",
      "type": "string"
    },
    {
      "key": "job_id",
      "value": "1",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login as Student",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('student_token', response.data.accessToken);",
                  "    pm.environment.set('student_user_id', response.data.user.id);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"student@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Login as HR",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('hr_token', response.data.accessToken);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"hr@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Login as Admin",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "if (pm.response.code === 200) {",
                  "    const response = pm.response.json();",
                  "    pm.environment.set('admin_token', response.data.accessToken);",
                  "}"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/auth/login",
              "host": ["{{base_url}}"],
              "path": ["auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Job Resume",
      "item": [
        {
          "name": "Upload Job Resume (Upload Mode)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{student_token}}"
              }
            ],
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "resume",
                  "type": "file",
                  "src": [],
                  "description": "Select a PDF file"
                }
              ]
            },
            "url": {
              "raw": "{{base_url}}/jobs/{{job_id}}/resume",
              "host": ["{{base_url}}"],
              "path": ["jobs", "{{job_id}}", "resume"]
            }
          }
        },
        {
          "name": "Use Profile Resume (Profile Mode)",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{student_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"mode\": \"profile\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/jobs/{{job_id}}/resume",
              "host": ["{{base_url}}"],
              "path": ["jobs", "{{job_id}}", "resume"]
            }
          }
        },
        {
          "name": "Get Job Resume URL (Specific Student)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{student_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/jobs/{{job_id}}/resume/{{student_user_id}}",
              "host": ["{{base_url}}"],
              "path": ["jobs", "{{job_id}}", "resume", "{{student_user_id}}"]
            }
          }
        },
        {
          "name": "Get Own Job Resume URL (Convenience)",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{student_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/jobs/{{job_id}}/resume/self",
              "host": ["{{base_url}}"],
              "path": ["jobs", "{{job_id}}", "resume", "self"]
            }
          }
        },
        {
          "name": "Delete Job Resume",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{student_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/jobs/{{job_id}}/resume",
              "host": ["{{base_url}}"],
              "path": ["jobs", "{{job_id}}", "resume"]
            }
          }
        }
      ]
    },
    {
      "name": "Test Scenarios",
      "item": [
        {
          "name": "Access Control - Different Student",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{student2_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/jobs/{{job_id}}/resume/{{student_user_id}}",
              "host": ["{{base_url}}"],
              "path": ["jobs", "{{job_id}}", "resume", "{{student_user_id}}"]
            }
          }
        },
        {
          "name": "Access Control - HR Views Resume",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{hr_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/jobs/{{job_id}}/resume/{{student_user_id}}",
              "host": ["{{base_url}}"],
              "path": ["jobs", "{{job_id}}", "resume", "{{student_user_id}}"]
            }
          }
        },
        {
          "name": "Access Control - Admin Views Resume",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{admin_token}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/jobs/{{job_id}}/resume/{{student_user_id}}",
              "host": ["{{base_url}}"],
              "path": ["jobs", "{{job_id}}", "resume", "{{student_user_id}}"]
            }
          }
        },
        {
          "name": "Error - Invalid Mode",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{student_token}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"mode\": \"invalid\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/jobs/{{job_id}}/resume",
              "host": ["{{base_url}}"],
              "path": ["jobs", "{{job_id}}", "resume"]
            }
          }
        },
        {
          "name": "Error - Non-Existent Job",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{student_token}}"
              }
            ],
            "body": {
              "mode": "formdata",
              "formdata": [
                {
                  "key": "resume",
                  "type": "file",
                  "src": []
                }
              ]
            },
            "url": {
              "raw": "{{base_url}}/jobs/99999/resume",
              "host": ["{{base_url}}"],
              "path": ["jobs", "99999", "resume"]
            }
          }
        },
        {
          "name": "Error - No Authentication",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{base_url}}/jobs/{{job_id}}/resume/self",
              "host": ["{{base_url}}"],
              "path": ["jobs", "{{job_id}}", "resume", "self"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## Tips for Testing

1. **Create Test Data First:**
   - Register test users for each role
   - Upload a profile resume for the main test student
   - Create at least one test job posting

2. **Use Postman Tests Tab:**
   - Add scripts to automatically save tokens to environment variables
   - Example:
     ```javascript
     if (pm.response.code === 200) {
         const response = pm.response.json();
         pm.environment.set('student_token', response.data.accessToken);
     }
     ```

3. **Test File Preparation:**
   - Keep a small test PDF (< 1 MB) for quick testing
   - Prepare a large PDF (> 10 MB) to test file size limits
   - Prepare a non-PDF file to test format validation

4. **Monitor Server Logs:**
   - Watch console for file cleanup messages
   - Verify old files are deleted when switching modes

5. **Check File System:**
   - Navigate to `backend/uploads/resumes/job-applications/`
   - Verify files are created and deleted appropriately

6. **Test Sequence:**
   - Always start with authentication
   - Test happy paths first
   - Then test error scenarios
   - Finally test edge cases and access control

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check if token is valid and not expired. Re-login if needed. |
| 403 Forbidden | Verify user has correct role for the endpoint. |
| 404 Job not found | Ensure job ID exists in database. |
| 400 No profile resume | Upload profile resume first via `/api/documents/resume`. |
| 413 Payload too large | Reduce file size to under 10 MB. |
| Multer error | Ensure file is PDF format and form-data key is `resume`. |

---

## Next Steps

After testing these endpoints:
1. Integrate with frontend upload components
2. Test with S3 storage provider (set `STORAGE_PROVIDER=s3`)
3. Add additional validation (e.g., file content checking)
4. Implement resume versioning if needed
5. Add analytics tracking for application submissions

---

**Last Updated:** October 21, 2025  
**API Version:** 1.0  
**Author:** KU-Connect Development Team
