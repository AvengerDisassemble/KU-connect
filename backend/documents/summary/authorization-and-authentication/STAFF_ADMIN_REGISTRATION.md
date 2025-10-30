# University Staff and Admin Registration Implementation

## Overview
This implementation adds the ability to register university staff (professors) and admin users to the KU Connect platform. Previously, the system only supported registration for enterprise users and alumni.

## Changes Made

### 1. Controller Functions (authController.js)
Added two new registration controller functions:

#### `registerStaff`
- **Route**: `POST /api/register/staff`
- **Purpose**: Register university staff members (professors)
- **Required Fields**:
  - `name`: Staff member's first name
  - `surname`: Staff member's last name
  - `email`: Staff member's email address
  - `password`: Password (must meet security requirements)
  - `department`: Academic department (e.g., "Computer Science")
- **Role**: Creates user with `PROFESSOR` role
- **Database**: Creates user record and associated professor record

#### `registerAdmin`
- **Route**: `POST /api/register/admin`
- **Purpose**: Register administrative users
- **Required Fields**:
  - `name`: Admin's first name
  - `surname`: Admin's last name
  - `email`: Admin's email address
  - `password`: Password (must meet security requirements)
- **Role**: Creates user with `ADMIN` role
- **Database**: Creates user record and associated admin record
- **Note**: Admin accounts are pre-verified (`verified: true`)

### 2. Validation Functions (authValidator.js)
Added two new validation middleware functions:

#### `validateStaffRegistration`
- Validates all required fields for staff registration
- Ensures department is at least 2 characters long
- Applies standard password security rules
- Validates email format

#### `validateAdminRegistration`
- Validates all required fields for admin registration
- Applies standard password security rules
- Validates email format
- No additional role-specific fields required

### 3. Route Files
Created two new route files in `/routes/register/`:

#### `staff.js`
- Handles `POST /register/staff` endpoint
- Uses `validateStaffRegistration` middleware
- Calls `registerStaff` controller

#### `admin.js`
- Handles `POST /register/admin` endpoint
- Uses `validateAdminRegistration` middleware
- Calls `registerAdmin` controller

## API Endpoints

### Register University Staff
```http
POST /api/register/staff
Content-Type: application/json

{
  "name": "John",
  "surname": "Professor",
  "email": "john.professor@university.edu",
  "password": "SecurePass123",
  "department": "Computer Science"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "University staff registration successful",
  "data": {
    "user": {
      "id": "user_id_here",
      "name": "John",
      "surname": "Professor",
      "email": "john.professor@university.edu",
      "role": "PROFESSOR",
      "verified": false,
      "createdAt": "2025-10-08T..."
    }
  }
}
```

### Register Admin
```http
POST /api/register/admin
Content-Type: application/json

{
  "name": "Jane",
  "surname": "Admin",
  "email": "jane.admin@university.edu",
  "password": "AdminPass123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Admin registration successful",
  "data": {
    "user": {
      "id": "user_id_here",
      "name": "Jane",
      "surname": "Admin",
      "email": "jane.admin@university.edu",
      "role": "ADMIN",
      "verified": true,
      "createdAt": "2025-10-08T..."
    }
  }
}
```

## Database Schema Support

The implementation leverages the existing Prisma schema which already includes:

- `Role` enum with `PROFESSOR` and `ADMIN` values
- `Professor` model for staff-specific data (department)
- `Admin` model for admin-specific data
- Proper foreign key relationships

## Validation Rules

### Common Validation (All User Types)
- Name: minimum 2 characters
- Surname: minimum 2 characters
- Email: valid email format
- Password: minimum 8 characters, must contain:
  - At least one lowercase letter
  - At least one uppercase letter
  - At least one number

### Staff-Specific Validation
- Department: minimum 2 characters

### Admin-Specific Validation
- No additional fields required beyond common validation

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Department must be at least 2 characters long"
  ]
}
```

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt
2. **Email Uniqueness**: Prevents duplicate email registrations
3. **Input Validation**: Comprehensive validation for all input fields
4. **Admin Pre-verification**: Admin accounts are automatically verified
5. **Role-based Access**: Proper role assignment for authorization

## Integration with Existing System

This implementation integrates seamlessly with the existing authentication system:

- Uses the same `authService.registerUser()` function
- Compatible with existing JWT authentication
- Follows the same route organization pattern
- Uses consistent validation patterns
- Maintains the same error handling approach

## Testing

The routes have been successfully registered and are ready for testing. You can test the endpoints using:

1. **Postman** or similar API testing tools
2. **curl** commands
3. **Frontend integration**
4. **Automated tests** (following the project's testing structure)

## Files Modified/Created

### Modified Files:
- `src/controllers/authController.js` - Added `registerStaff` and `registerAdmin` functions
- `src/validators/authValidator.js` - Added validation functions

### Created Files:
- `src/routes/register/staff.js` - Staff registration route
- `src/routes/register/admin.js` - Admin registration route

## Next Steps

1. **Frontend Integration**: Update the frontend to include staff and admin registration forms
2. **Testing**: Add comprehensive unit and integration tests
3. **Documentation**: Update API documentation
4. **Role-based Features**: Implement role-specific features for professors and admins