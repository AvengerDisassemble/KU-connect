const request = require("supertest");
const app = require("../../../src/app");

describe("Staff Registration", () => {
  describe("POST /api/register/staff", () => {
    it("should register staff with valid data", async () => {
      const staffData = {
        name: "John",
        surname: "Professor",
        email: `john.professor.${Date.now()}@university.edu`,
        password: "SecurePass123",
        department: "Computer Science",
      };

      const response = await request(app)
        .post("/api/register/staff")
        .send(staffData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "University staff registration successful",
      );
      expect(response.body.data.user.role).toBe("PROFESSOR");
      expect(response.body.data.user.email).toBe(staffData.email);
      expect(response.body.data.user.name).toBe(staffData.name);
      expect(response.body.data.user.surname).toBe(staffData.surname);
      expect(response.body.data.user).not.toHaveProperty("password");
    });

    it("should reject staff registration with missing department", async () => {
      const staffData = {
        name: "John",
        surname: "Professor",
        email: `john.invalid.${Date.now()}@university.edu`,
        password: "SecurePass123",
        // department missing
      };

      const response = await request(app)
        .post("/api/register/staff")
        .send(staffData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toContain(
        "All fields are required: name, surname, email, password, department",
      );
    });

    it("should reject staff registration with short department", async () => {
      const staffData = {
        name: "John",
        surname: "Professor",
        email: `john.invalid2.${Date.now()}@university.edu`,
        password: "SecurePass123",
        department: "A", // too short
      };

      const response = await request(app)
        .post("/api/register/staff")
        .send(staffData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        "Department must be at least 2 characters long",
      );
    });

    it("should reject staff registration with weak password", async () => {
      const staffData = {
        name: "John",
        surname: "Professor",
        email: `john.weak.${Date.now()}@university.edu`,
        password: "weak",
        department: "Computer Science",
      };

      const response = await request(app)
        .post("/api/register/staff")
        .send(staffData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        "Password must be at least 8 characters long",
      );
    });

    it("should reject staff registration with duplicate email", async () => {
      const email = `john.duplicate.${Date.now()}@university.edu`;
      const staffData = {
        name: "John",
        surname: "Professor",
        email: email,
        password: "SecurePass123",
        department: "Computer Science",
      };

      // First registration should succeed
      await request(app)
        .post("/api/register/staff")
        .send(staffData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app)
        .post("/api/register/staff")
        .send(staffData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Email already registered");
    });
  });
});

describe("Admin Registration", () => {
  describe("POST /api/register/admin", () => {
    it("should register admin with valid data", async () => {
      const adminData = {
        name: "Jane",
        surname: "Admin",
        email: `jane.admin.${Date.now()}@university.edu`,
        password: "AdminPass123",
      };

      const response = await request(app)
        .post("/api/register/admin")
        .send(adminData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Admin registration successful");
      expect(response.body.data.user.role).toBe("ADMIN");
      expect(response.body.data.user.email).toBe(adminData.email);
      expect(response.body.data.user.name).toBe(adminData.name);
      expect(response.body.data.user.surname).toBe(adminData.surname);
      expect(response.body.data.user.verified).toBe(true); // Admins are pre-verified
      expect(response.body.data.user).not.toHaveProperty("password");
    });

    it("should reject admin registration with missing name", async () => {
      const adminData = {
        // name missing
        surname: "Admin",
        email: `jane.invalid.${Date.now()}@university.edu`,
        password: "AdminPass123",
      };

      const response = await request(app)
        .post("/api/register/admin")
        .send(adminData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Validation failed");
      expect(response.body.errors).toContain(
        "All fields are required: name, surname, email, password",
      );
    });

    it("should reject admin registration with invalid email", async () => {
      const adminData = {
        name: "Jane",
        surname: "Admin",
        email: "invalid-email",
        password: "AdminPass123",
      };

      const response = await request(app)
        .post("/api/register/admin")
        .send(adminData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain("Invalid email format");
    });

    it("should reject admin registration with weak password", async () => {
      const adminData = {
        name: "Jane",
        surname: "Admin",
        email: `jane.weak.${Date.now()}@university.edu`,
        password: "weak",
      };

      const response = await request(app)
        .post("/api/register/admin")
        .send(adminData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContain(
        "Password must be at least 8 characters long",
      );
    });

    it("should reject admin registration with duplicate email", async () => {
      const email = `jane.duplicate.${Date.now()}@university.edu`;
      const adminData = {
        name: "Jane",
        surname: "Admin",
        email: email,
        password: "AdminPass123",
      };

      // First registration should succeed
      await request(app)
        .post("/api/register/admin")
        .send(adminData)
        .expect(201);

      // Second registration with same email should fail
      const response = await request(app)
        .post("/api/register/admin")
        .send(adminData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Email already registered");
    });
  });
});
