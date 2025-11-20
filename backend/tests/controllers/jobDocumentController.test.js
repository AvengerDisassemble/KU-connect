/**
 * @module tests/controllers/jobDocumentController.test
 * @description Test job-specific resume uploads and management
 */

const request = require("supertest");
const app = require("../../src/app");
const prisma = require("../../src/models/prisma");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs-extra");

// Mock express-rate-limit to bypass rate limiting in tests
jest.mock("express-rate-limit", () => {
  return jest.fn(() => (req, res, next) => next());
});

// Mock storage provider to avoid actual file operations
jest.mock("../../src/services/storageFactory", () => ({
  uploadFile: jest.fn().mockResolvedValue("mock-job-resume-key-12345"),
  getFileUrl: jest.fn().mockResolvedValue("https://mock-url.com/job-resume"),
  deleteFile: jest.fn().mockResolvedValue(undefined),
  getReadStream: jest.fn().mockResolvedValue({
    stream: require("stream").Readable.from(
      Buffer.from("%PDF-1.4 mock job resume"),
    ),
    mimeType: "application/pdf",
    filename: "job-resume.pdf",
  }),
  getSignedDownloadUrl: jest.fn().mockResolvedValue(null), // Local storage returns null
}));

const storageProvider = require("../../src/services/storageFactory");

describe("Job Document Controller", () => {
  let studentToken, student2Token, hrToken, adminToken;
  let studentUserId, student2UserId, hrUserId, adminUserId;
  let studentId, student2Id, hrId;
  let jobId;

  beforeAll(async () => {
    try {
      // Clean up any existing test data first
      await prisma.resume.deleteMany({
        where: {
          student: {
            user: {
              email: {
                in: ["jobstudent@test.com", "jobstudent2@test.com"],
              },
            },
          },
        },
      });

      await prisma.job.deleteMany({
        where: {
          hr: {
            user: {
              email: "jobhr@test.com",
            },
          },
        },
      });

      await prisma.student.deleteMany({
        where: {
          user: {
            email: {
              in: ["jobstudent@test.com", "jobstudent2@test.com"],
            },
          },
        },
      });

      await prisma.hR.deleteMany({
        where: {
          user: {
            email: "jobhr@test.com",
          },
        },
      });

      await prisma.admin.deleteMany({
        where: {
          user: {
            email: "jobadmin@test.com",
          },
        },
      });

      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              "jobstudent@test.com",
              "jobstudent2@test.com",
              "jobhr@test.com",
              "jobadmin@test.com",
            ],
          },
        },
      });

      // Create or get a degreeType for testing
      let degreeType = await prisma.degreeType.findFirst();
      if (!degreeType) {
        degreeType = await prisma.degreeType.create({
          data: {
            name: "Computer Science",
          },
        });
      }

      // Create test users
      const student = await prisma.user.create({
        data: {
          name: "Test",
          surname: "Student",
          email: "jobstudent@test.com",
          username: "jobstudent",
          password: "hashedpass",
          role: "STUDENT",
          verified: true,
          student: {
            create: {
              degreeTypeId: degreeType.id,
              address: "123 Test St",
              resumeKey: "profile-resume-key-123",
            },
          },
        },
        include: { student: true },
      });

      const student2 = await prisma.user.create({
        data: {
          name: "Another",
          surname: "Student",
          email: "jobstudent2@test.com",
          username: "jobstudent2",
          password: "hashedpass",
          role: "STUDENT",
          verified: true,
          student: {
            create: {
              degreeTypeId: degreeType.id,
              address: "456 Test Ave",
              // No profile resume for this student
            },
          },
        },
        include: { student: true },
      });

      const hr = await prisma.user.create({
        data: {
          name: "Test",
          surname: "Employer",
          email: "jobhr@test.com",
          username: "jobhr",
          password: "hashedpass",
          role: "EMPLOYER",
          verified: true,
          hr: {
            create: {
              companyName: "Test Company",
              address: "789 Business Blvd",
              industry: "IT_SOFTWARE",
              companySize: "ELEVEN_TO_FIFTY",
              phoneNumber: "02-555-1234",
            },
          },
        },
        include: { hr: true },
      });

      const admin = await prisma.user.create({
        data: {
          name: "Test",
          surname: "Admin",
          email: "jobadmin@test.com",
          username: "jobadmin",
          password: "hashedpass",
          role: "ADMIN",
          verified: true,
          admin: {
            create: {},
          },
        },
      });

      // Create a test job
      const job = await prisma.job.create({
        data: {
          hrId: hr.hr.id,
          title: "Software Engineer",
          companyName: "Test Company Inc.",
          description: "Test job description",
          location: "Remote",
          jobType: "full-time",
          workArrangement: "remote",
          duration: "6-month",
          minSalary: 40000,
          maxSalary: 60000,
          application_deadline: new Date("2025-12-31"),
          email: "jobs@test.com",
          phone_number: "123-456-7890",
          other_contact_information: "LinkedIn",
        },
      });

      studentUserId = student.id;
      student2UserId = student2.id;
      hrUserId = hr.id;
      adminUserId = admin.id;
      studentId = student.student.id;
      student2Id = student2.student.id;
      hrId = hr.hr.id;
      jobId = job.id;

      // Generate tokens with the same secret as tokenUtils.js
      const secret =
        process.env.ACCESS_TOKEN_SECRET || "your-access-token-secret";
      studentToken = jwt.sign({ id: studentUserId, role: "STUDENT" }, secret, {
        expiresIn: "1h",
      });
      student2Token = jwt.sign(
        { id: student2UserId, role: "STUDENT" },
        secret,
        { expiresIn: "1h" },
      );
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
      // Clean up test data
      await prisma.resume.deleteMany({});
      await prisma.job.deleteMany({});
      await prisma.student.deleteMany({});
      await prisma.hR.deleteMany({});
      await prisma.admin.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.$disconnect();
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  beforeEach(() => {
    // Clear mock call history before each test
    jest.clearAllMocks();
  });

  describe("POST /api/jobs/:jobId/resume - Upsert job resume", () => {
    it("should upload a new resume for a job application", async () => {
      const response = await request(app)
        .post(`/api/jobs/${jobId}/resume`)
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("resume", Buffer.from("fake pdf content"), "resume.pdf");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toBe(jobId);
      expect(response.body.data.link).toBe("mock-job-resume-key-12345");
      expect(response.body.data.source).toBe("UPLOADED");
      expect(storageProvider.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        "resume.pdf",
        "application/pdf",
        { prefix: `resumes/job-applications/${jobId}` },
      );
    });

    it("should use profile resume when mode=profile", async () => {
      const response = await request(app)
        .post(`/api/jobs/${jobId}/resume`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ mode: "profile" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.link).toBe("profile-resume-key-123");
      expect(response.body.data.source).toBe("PROFILE");
      expect(storageProvider.uploadFile).not.toHaveBeenCalled();
    });

    it("should fail when mode=profile but no profile resume exists", async () => {
      const response = await request(app)
        .post(`/api/jobs/${jobId}/resume`)
        .set("Authorization", `Bearer ${student2Token}`)
        .send({ mode: "profile" });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("No profile resume found");
    });

    it("should replace existing uploaded resume", async () => {
      // First upload
      await request(app)
        .post(`/api/jobs/${jobId}/resume`)
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("resume", Buffer.from("first pdf"), "resume1.pdf");

      storageProvider.uploadFile.mockResolvedValueOnce(
        "mock-job-resume-key-67890",
      );

      // Second upload (should replace)
      const response = await request(app)
        .post(`/api/jobs/${jobId}/resume`)
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("resume", Buffer.from("second pdf"), "resume2.pdf");

      expect(response.status).toBe(200);
      expect(response.body.data.link).toBe("mock-job-resume-key-67890");
      expect(storageProvider.deleteFile).toHaveBeenCalledWith(
        "mock-job-resume-key-12345",
      );
    });

    it("should fail for non-student users", async () => {
      const response = await request(app)
        .post(`/api/jobs/${jobId}/resume`)
        .set("Authorization", `Bearer ${hrToken}`)
        .attach("resume", Buffer.from("fake pdf"), "resume.pdf");

      expect(response.status).toBe(403);
    });

    it("should fail for non-existent job", async () => {
      const response = await request(app)
        .post(`/api/jobs/99999/resume`)
        .set("Authorization", `Bearer ${studentToken}`)
        .attach("resume", Buffer.from("fake pdf"), "resume.pdf");

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("Job not found");
    });

    it("should fail without authentication", async () => {
      const response = await request(app)
        .post(`/api/jobs/${jobId}/resume`)
        .attach("resume", Buffer.from("fake pdf"), "resume.pdf");

      expect(response.status).toBe(401);
    });

    it("should fail with invalid mode", async () => {
      const response = await request(app)
        .post(`/api/jobs/${jobId}/resume`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ mode: "invalid" });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid mode");
    });
  });

  describe("DELETE /api/jobs/:jobId/resume - Delete job resume", () => {
    beforeEach(async () => {
      // Clean up first, then create a job resume for testing
      await prisma.resume.deleteMany({
        where: {
          studentId,
          jobId,
        },
      });

      await prisma.resume.create({
        data: {
          studentId,
          jobId,
          link: "deletable-job-resume-key",
          source: "UPLOADED",
        },
      });
    });

    afterEach(async () => {
      await prisma.resume.deleteMany({
        where: {
          studentId,
          jobId,
        },
      });
    });

    it("should allow student to delete their job resume", async () => {
      const response = await request(app)
        .delete(`/api/jobs/${jobId}/resume`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(storageProvider.deleteFile).toHaveBeenCalledWith(
        "deletable-job-resume-key",
      );

      // Verify it's deleted from database
      const resume = await prisma.resume.findUnique({
        where: {
          studentId_jobId: {
            studentId,
            jobId,
          },
        },
      });
      expect(resume).toBeNull();
    });

    it("should not delete profile resume file when deleting PROFILE source", async () => {
      // Update to use profile resume
      await prisma.resume.update({
        where: {
          studentId_jobId: {
            studentId,
            jobId,
          },
        },
        data: {
          link: "profile-resume-key-123",
          source: "PROFILE",
        },
      });

      const response = await request(app)
        .delete(`/api/jobs/${jobId}/resume`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(storageProvider.deleteFile).not.toHaveBeenCalledWith(
        "profile-resume-key-123",
      );
    });

    it("should return 404 when no resume exists", async () => {
      await prisma.resume.deleteMany({});

      const response = await request(app)
        .delete(`/api/jobs/${jobId}/resume`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("No resume found");
    });

    it("should deny access to non-student users", async () => {
      const response = await request(app)
        .delete(`/api/jobs/${jobId}/resume`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/jobs/:jobId/resume/:studentUserId/download - Download job resume", () => {
    beforeEach(async () => {
      // Ensure a resume exists for testing
      await prisma.application.deleteMany({
        where: { studentId: studentId, jobId: jobId },
      });

      await prisma.resume.deleteMany({
        where: { studentId: studentId, jobId: jobId },
      });

      const resume = await prisma.resume.create({
        data: {
          studentId: studentId,
          jobId: jobId,
          link: "job-resumes/test-job-resume.pdf",
          source: "UPLOADED",
        },
      });

      // Create an application so HR can access the resume
      await prisma.application.create({
        data: {
          studentId: studentId,
          jobId: jobId,
          resumeId: resume.id,
          status: "PENDING",
        },
      });
    });

    it("should allow student to download their own job resume", async () => {
      const response = await request(app)
        .get(`/api/jobs/${jobId}/resume/${studentUserId}/download`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toContain("inline");
      expect(response.headers["cache-control"]).toContain("no-store");
    });

    it("should allow job HR to download applicant resume", async () => {
      const response = await request(app)
        .get(`/api/jobs/${jobId}/resume/${studentUserId}/download`)
        .set("Authorization", `Bearer ${hrToken}`);

      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/pdf");
    });

    it("should allow admin to download any job resume", async () => {
      const response = await request(app)
        .get(`/api/jobs/${jobId}/resume/${studentUserId}/download`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it("should deny other students from downloading", async () => {
      const response = await request(app)
        .get(`/api/jobs/${jobId}/resume/${studentUserId}/download`)
        .set("Authorization", `Bearer ${student2Token}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Access denied");
    });

    it("should return 404 when no resume exists", async () => {
      // Delete the resume
      await prisma.resume.deleteMany({
        where: { studentId: studentId, jobId: jobId },
      });

      const response = await request(app)
        .get(`/api/jobs/${jobId}/resume/${studentUserId}/download`)
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain("No resume found");
    });

    afterEach(async () => {
      // Clean up applications created in tests
      await prisma.application.deleteMany({
        where: { studentId: studentId, jobId: jobId },
      });
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.application.deleteMany({});
    await prisma.$disconnect();
  });
});
