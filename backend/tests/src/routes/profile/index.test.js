/**
 * @fileoverview Integration tests for Profile routes (Express + SQLite + Supertest)
 */

const request = require("supertest");
const prisma = require("../../../../src/models/prisma");
const app = require("../../../../src/app");
const {
  cleanupDatabase,
  createTestToken,
  TEST_DEGREE_TYPES,
} = require("../../utils/testHelpers");

jest.setTimeout(30000);

let degreeType;
let studentUser, hrUser, adminUser;
let studentToken, hrToken, adminToken;

beforeAll(async () => {
  process.env.ACCESS_TOKEN_SECRET =
    process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret";

  await cleanupDatabase(prisma, { logSuccess: false });

  // Create required DegreeType
  degreeType = await prisma.degreeType.create({
    data: {
      name: TEST_DEGREE_TYPES.BACHELOR,
    },
  });

  // Create test users with auth tokens
  adminUser = await prisma.user.create({
    data: {
      name: "Admin",
      surname: "User",
      email: "admin@test.com",
      password: "Pass",
      role: "ADMIN",
      admin: { create: {} },
    },
  });
  adminToken = createTestToken({ id: adminUser.id, role: "ADMIN" });

  studentUser = await prisma.user.create({
    data: {
      name: "Student",
      surname: "User",
      email: "student@test.com",
      password: "Pass",
      role: "STUDENT",
      student: {
        create: {
          degreeTypeId: degreeType.id,
          address: "Dorm",
          gpa: 3.4,
        },
      },
    },
    include: { student: true },
  });
  studentToken = createTestToken({ id: studentUser.id, role: "STUDENT" });

  hrUser = await prisma.user.create({
    data: {
      name: "HR",
      surname: "User",
      email: "hr@test.com",
      password: "Pass",
      role: "EMPLOYER",
      hr: {
        create: {
          companyName: "TestCorp",
          industry: "IT_SOFTWARE",
          companySize: "ONE_TO_TEN",
          address: "Office",
          phoneNumber: "02-123-4567",
        },
      },
    },
    include: { hr: true },
  });
  hrToken = createTestToken({ id: hrUser.id, role: "EMPLOYER" });
});

afterAll(async () => {
  await cleanupDatabase(prisma);
  await prisma.$disconnect();
});

describe("Profile routes (integration)", () => {
  describe("GET /api/profile/:userId", () => {
    it("should return 200 with correct profile", async () => {
      const res = await request(app)
        .get(`/api/profile/${studentUser.id}`)
        .set("Authorization", studentToken)
        .expect(200);
      expect(res.body.data).toEqual(
        expect.objectContaining({ id: studentUser.id }),
      );
    });

    it("should return 403 for non-privileged user accessing other profile", async () => {
      const res = await request(app)
        .get(`/api/profile/${hrUser.id}`)
        .set("Authorization", studentToken)
        .expect(403);
      expect(res.body.message).toMatch(/access denied|not authorized/i);
    });
  });

  describe("GET /api/profile", () => {
    it("should return 200 with list of profiles for admin", async () => {
      const res = await request(app)
        .get("/api/profile")
        .set("Authorization", adminToken)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2); // Should have student + hr
    });

    it("should return 403 for non-admin user", async () => {
      const res = await request(app)
        .get("/api/profile")
        .set("Authorization", studentToken)
        .expect(403);
      expect(res.body.message).toMatch(
        /forbidden|not authorized|access denied|required role/i,
      );
    });
  });

  describe("PATCH /api/profile", () => {
    it("should update student profile successfully", async () => {
      const res = await request(app)
        .patch("/api/profile")
        .set("Authorization", studentToken)
        .send({ role: "student", gpa: 3.8 })
        .expect(200);

      expect(res.body.data.student.gpa).toBe(3.8);
    });

    it("should update employer profile successfully", async () => {
      const res = await request(app)
        .patch("/api/profile")
        .set("Authorization", hrToken)
        .send({ role: "hr", companyName: "TestCorp Updated" })
        .expect(200);

      expect(res.body.data.hr.companyName).toBe("TestCorp Updated");
    });

    it("should update HR phone number successfully", async () => {
      const res = await request(app)
        .patch("/api/profile")
        .set("Authorization", hrToken)
        .send({ role: "hr", phoneNumber: "02-999-8888" })
        .expect(200);

      expect(res.body.data.hr.phoneNumber).toBe("02-999-8888");
    });

    it("should update HR description successfully", async () => {
      const res = await request(app)
        .patch("/api/profile")
        .set("Authorization", hrToken)
        .send({ role: "hr", description: "Updated company description" })
        .expect(200);

      expect(res.body.data.hr.description).toBe("Updated company description");
    });

    it("should return 400 for invalid payload", async () => {
      const res = await request(app)
        .patch("/api/profile")
        .set("Authorization", studentToken)
        .send({})
        .expect(400);
      expect(res.body.message).toMatch(/at least one field|required/i);
    });

    it("should return 400 when trying to update email", async () => {
      const res = await request(app)
        .patch("/api/profile")
        .set("Authorization", studentToken)
        .send({ email: "newemail@test.com", gpa: 3.9 })
        .expect(400);
      expect(res.body.message).toMatch(/email.*not allowed/i);
    });
  });
});
