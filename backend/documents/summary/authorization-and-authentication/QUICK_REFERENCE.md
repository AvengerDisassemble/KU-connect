# 🔧 KU Connect - Quick Reference Card

## 🚀 Import Middleware

```javascript
const {
  authMiddleware,
  optionalAuthMiddleware,
} = require("../middlewares/authMiddleware");
const {
  roleMiddleware,
  verifiedUserMiddleware,
  ownerOrAdminMiddleware,
} = require("../middlewares/roleMiddleware");
```

## 🔐 Common Route Patterns

### Public Routes (No authentication)

```javascript
router.get("/public-endpoint", controller);
```

### Login Required

```javascript
router.get("/private-endpoint", authMiddleware, controller);
```

### Role-Specific Access

```javascript
// Single role
router.post(
  "/student-only",
  authMiddleware,
  roleMiddleware("STUDENT"),
  controller,
);
router.post(
  "/employer-only",
  authMiddleware,
  roleMiddleware("EMPLOYER"),
  controller,
);
router.get("/admin-only", authMiddleware, roleMiddleware("ADMIN"), controller);

// Multiple roles
router.get(
  "/multi-role",
  authMiddleware,
  roleMiddleware(["STUDENT", "PROFESSOR"]),
  controller,
);
```

### Verification Required

```javascript
router.post(
  "/verified-only",
  authMiddleware,
  verifiedUserMiddleware,
  controller,
);
```

### Owner or Admin Access

```javascript
router.put(
  "/users/:userId/data",
  authMiddleware,
  ownerOrAdminMiddleware("userId"),
  controller,
);
```

## 👥 Role Permissions Matrix

| Action                | STUDENT | PROFESSOR | EMPLOYER | ADMIN |
| --------------------- | ------- | --------- | -------- | ----- |
| View jobs             | ✅      | ✅        | ✅       | ✅    |
| Apply to jobs         | ✅      | ❌        | ❌       | ❌    |
| Create jobs           | ❌      | ❌        | ✅       | ❌    |
| View student insights | ❌      | ✅        | ❌       | ✅    |
| Moderate content      | ❌      | ❌        | ❌       | ✅    |
| Manage all users      | ❌      | ❌        | ❌       | ✅    |

## 📝 Controller Access Patterns

```javascript
const controller = (req, res) => {
  // Available user data
  const userId = req.user.id;
  const userRole = req.user.role;
  const isVerified = req.user.verified;
  const userEmail = req.user.email;
  const userName = req.user.name;

  // Role-based logic
  switch (userRole) {
    case "STUDENT":
      // Student logic
      break;
    case "EMPLOYER":
      // Employer logic
      break;
    case "PROFESSOR":
      // Professor logic
      break;
    case "ADMIN":
      // Admin logic
      break;
  }
};
```

## ❌ Error Responses

- `401` - Authentication required / Invalid token
- `403` - Access denied / Insufficient permissions
- `400` - Validation errors
- `409` - Duplicate data (email exists)

## 🧪 Testing Protected Routes

```javascript
// Get token from login
const loginResponse = await request(app)
  .post("/api/login")
  .send({ email: "test@example.com", password: "password" });

const token = loginResponse.headers["set-cookie"]
  .find((cookie) => cookie.includes("accessToken"))
  ?.split("=")[1]
  ?.split(";")[0];

// Use in protected requests
const response = await request(app)
  .get("/api/protected-route")
  .set("Cookie", [`accessToken=${token}`])
  .expect(200);
```

## 📱 Frontend Integration

```javascript
// No manual token management needed!
// Cookies are automatically sent with requests

// Login
fetch("/api/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include", // Important: Include cookies
  body: JSON.stringify({ email, password }),
});

// Protected requests
fetch("/api/protected-route", {
  credentials: "include", // Cookies sent automatically
});

// Logout
fetch("/api/logout", {
  method: "POST",
  credentials: "include",
});
```

---

**📚 For detailed examples and complete implementation guide, see `DEVELOPMENT_GUIDE.md`**
