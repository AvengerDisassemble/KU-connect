/**
 * @module tests/controllers/documentsController.test
 * @description Test documents controller with role-based access and file validation
 */

const request = require("supertest");
const app = require("../../src/app");
const prisma = require("../../src/models/prisma");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs-extra");

// Mock storage provider to avoid actual file operations
jest.mock("../../src/services/storageFactory", () => ({
  uploadFile: jest.fn().mockResolvedValue("mock-file-key-12345"),
  getFileUrl: jest.fn().mockResolvedValue("https://mock-url.com/file"),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  getReadStream: jest.fn().mockResolvedValue({
    stream: require("stream").Readable.from(Buffer.from("%PDF-1.4 mock pdf")),
    mimeType: "application/pdf",
    filename: "test-resume.pdf",
  }),
  getSignedDownloadUrl: jest.fn().mockResolvedValue(null), // Local storage returns null
}));

describe("Documents Controller", () => {
  let studentToken, hrToken, adminToken;
  let studentUserId, hrUserId, adminUserId;

  beforeAll(async () => {
    try {
      // Create or get a degreeType for testing
      let degreeType = await prisma.degreeType.findFirst();
      if (!degreeType) {
        degreeType = await prisma.degreeType.create({
          data: {
            name: "Test Degree for Upload Tests",
          },
        });
      }

      // Create test users
      const studentUser = await prisma.user.create({
        data: {
          name: "Test",
          surname: "Student",
          email: `student-${Date.now()}@test.com`,
          username: `teststudent-${Date.now()}`,
          password: "hashedpass",
          role: "STUDENT",
          verified: true,
        },
      });
      studentUserId = studentUser.id;

      // Create student profile
      await prisma.student.create({
        data: {
          userId: studentUserId,
          degreeTypeId: degreeType.id,
          address: "123 Test St",
        },
      });

      const hrUser = await prisma.user.create({
        data: {
          name: "Test",
          surname: "HR",
          email: `hr-${Date.now()}@test.com`,
          username: `testhr-${Date.now()}`,
          password: "hashedpass",
          role: "EMPLOYER",
          verified: true,
        },
      });
      hrUserId = hrUser.id;

      // Create HR profile
      await prisma.hR.create({
        data: {
          userId: hrUserId,
          companyName: "Test Company",
          address: "456 Business Ave",
          phoneNumber: "02-123-4567",
        },
      });

      const adminUser = await prisma.user.create({
        data: {
          name: "Test",
          surname: "Admin",
          email: `admin-${Date.now()}@test.com`,
          username: `testadmin-${Date.now()}`,
          password: "hashedpass",
          role: "ADMIN",
          verified: true,
        },
      });
      adminUserId = adminUser.id;

      await prisma.admin.create({
        data: { userId: adminUserId },
      });

      // Generate tokens using the same secret as the auth middleware
      const secret =
        process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret";
      studentToken = jwt.sign({ id: studentUserId, role: "STUDENT" }, secret, {
        expiresIn: "1h",
      });
      hrToken = jwt.sign({ id: hrUserId, role: "EMPLOYER" }, secret, {
        expiresIn: "1h",
      });
      adminToken = jwt.sign({ id: adminUserId, role: "ADMIN" }, secret, {
        expiresIn: "1h",
      });
    } catch (error) {
      console.error("Setup error:", error);
      throw error;
    }
  });

  afterAll(async () => {
    try {
      // Cleanup test data
      if (studentUserId) {
        await prisma.student.deleteMany({ where: { userId: studentUserId } });
      }
      if (hrUserId) {
        await prisma.hR.deleteMany({ where: { userId: hrUserId } });
      }
      if (adminUserId) {
        await prisma.admin.deleteMany({ where: { userId: adminUserId } });
      }

      const userIdsToDelete = [studentUserId, hrUserId, adminUserId].filter(
        (id) => id !== undefined,
      );
      if (userIdsToDelete.length > 0) {
        await prisma.user.deleteMany({
          where: {
            id: { in: userIdsToDelete },
          },
        });
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    } finally {
      await prisma.$disconnect();
    }
  });

  describe("POST /api/documents/resume", () => {
    test("should upload resume for student", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 fake pdf content");

      const response = await request(app)
        .post("/api/documents/resume")
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("resume", pdfBuffer, "resume.pdf");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fileKey).toBe("mock-file-key-12345");
    });

    test("should reject non-student users", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 fake pdf content");

      const response = await request(app)
        .post("/api/documents/resume")
        .set("Authorization", `Bearer ${hrToken}`)
        .attach("resume", pdfBuffer, "resume.pdf");

      expect(response.status).toBe(403);
    });

    test("should reject non-PDF files", async () => {
      const txtBuffer = Buffer.from("plain text");

      const response = await request(app)
        .post("/api/documents/resume")
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("resume", txtBuffer, "resume.txt");

      expect(response.status).toBe(400); // Multer error handled by errorHandler
      expect(response.body.message).toContain("PDF");
    });
  });

  describe("POST /api/documents/transcript", () => {
    test("should upload transcript for student", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 fake transcript");

      const response = await request(app)
        .post("/api/documents/transcript")
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("transcript", pdfBuffer, "transcript.pdf");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /api/documents/employer-verification", () => {
    test("should upload verification doc for HR", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 fake verification doc");

      const response = await request(app)
        .post("/api/documents/employer-verification")
        .set("Authorization", `Bearer ${hrToken}`)
        .attach("verification", pdfBuffer, "verification.pdf");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test("should reject non-HR users", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 fake doc");

      const response = await request(app)
        .post("/api/documents/employer-verification")
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("verification", pdfBuffer, "verification.pdf");

      expect(response.status).toBe(403);
    });

    test("should accept JPEG files", async () => {
      const jpegBuffer = Buffer.from("fake jpeg data");

      const response = await request(app)
        .post("/api/documents/employer-verification")
        .set("Authorization", `Bearer ${hrToken}`)
        .attach("verification", jpegBuffer, {
          filename: "verification.jpg",
          contentType: "image/jpeg",
        });

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/documents/resume/:userId/download", () => {
    beforeAll(async () => {
      // Ensure resume key is set
      await prisma.student.update({
        where: { userId: studentUserId },
        data: { resumeKey: "resumes/test-resume.pdf" },
      });
    });

    test("should allow student to download own resume", async () => {
      const response = await request(app)
        .get(`/api/documents/resume/${studentUserId}/download`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain("inline");
      expect(response.headers["cache-control"]).toContain("no-store");
    });

    test("should allow admin to download any student resume", async () => {
      const response = await request(app)
        .get(`/api/documents/resume/${studentUserId}/download`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    test("should deny other students from downloading", async () => {
      const response = await request(app)
        .get(`/api/documents/resume/${studentUserId}/download`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Access denied");
    });

    test("should return 404 when no resume exists", async () => {
      // Temporarily clear resume key
      await prisma.student.update({
        where: { userId: studentUserId },
        data: { resumeKey: null },
      });

      const response = await request(app)
        .get(`/api/documents/resume/${studentUserId}/download`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No resume found for this student");

      // Restore resume key
      await prisma.student.update({
        where: { userId: studentUserId },
        data: { resumeKey: "resumes/test-resume.pdf" },
      });
    });
  });

  describe("GET /api/documents/transcript/:userId/download", () => {
    beforeAll(async () => {
      // Set a transcript key
      await prisma.student.update({
        where: { userId: studentUserId },
        data: { transcriptKey: "transcripts/test-transcript.pdf" },
      });
    });

    test("should allow student to download own transcript", async () => {
      const response = await request(app)
        .get(`/api/documents/transcript/${studentUserId}/download`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    test("should deny other users from downloading", async () => {
      const response = await request(app)
        .get(`/api/documents/transcript/${studentUserId}/download`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/documents/employer-verification/:userId/download", () => {
    beforeAll(async () => {
      // Set a verification doc key
      await prisma.hR.update({
        where: { userId: hrUserId },
        data: { verificationDocKey: "employer-docs/test-verification.pdf" },
      });
    });

    test("should allow HR to download own verification document", async () => {
      const response = await request(app)
        .get(`/api/documents/employer-verification/${hrUserId}/download`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    test("should allow admin to download any verification document", async () => {
      const response = await request(app)
        .get(`/api/documents/employer-verification/${hrUserId}/download`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    test("should deny students from downloading", async () => {
      const response = await request(app)
        .get(`/api/documents/employer-verification/${hrUserId}/download`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });
});
