/**
 * @file tests/services/pdpaConsent.test.js
 * @description Jest tests for PDPA consent feature
 */

const authService = require('../../src/services/authService');
const userService = require('../../src/services/userService');
const prisma = require('../../src/models/prisma');
const { hashPassword } = require('../../src/utils/passwordUtils');

// Mock dependencies
jest.mock('../../src/utils/passwordUtils');

describe('PDPA Consent Feature', () => {
  let testDegreeType;

  beforeAll(async () => {
    // Clean up ALL data before starting tests
    await prisma.notification.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.jobReport.deleteMany({});
    await prisma.application.deleteMany({});
    await prisma.savedJob.deleteMany({});
    await prisma.studentInterest.deleteMany({});
    await prisma.studentPreference.deleteMany({});
    await prisma.resume.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.professor.deleteMany({});
    await prisma.admin.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.job.deleteMany({});
    await prisma.hR.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.degreeType.deleteMany({});

    // Create a test degree type
    testDegreeType = await prisma.degreeType.create({
      data: { name: 'Test Degree' }
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    hashPassword.mockResolvedValue('hashed_password');
  });

  afterEach(async () => {
    // Clean up test data - respect foreign key constraints
    await prisma.notification.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.jobReport.deleteMany({});
    await prisma.application.deleteMany({});
    await prisma.savedJob.deleteMany({});
    await prisma.studentInterest.deleteMany({});
    await prisma.studentPreference.deleteMany({});
    await prisma.resume.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.professor.deleteMany({});
    await prisma.admin.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.job.deleteMany({});
    await prisma.hR.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.degreeType.deleteMany({});
    await prisma.$disconnect();
  });

  describe('Registration with PDPA Consent', () => {
    it('should successfully register a student with valid PDPA consent', async () => {
      const userData = {
        name: 'Test',
        surname: 'Student',
        email: 'student@test.com',
        password: 'TestPass123!',
        role: 'STUDENT',
        privacyConsent: {
          dataProcessingConsent: true
        }
      };

      const roleData = {
        degreeTypeId: testDegreeType.id,
        address: '123 Test Street'
      };

      const result = await authService.registerUser(userData, roleData);

      expect(result).toBeDefined();
      expect(result.email).toBe('student@test.com');
      expect(result.role).toBe('STUDENT');

      // Verify consent was stored in database
      const user = await prisma.user.findUnique({
        where: { id: result.id }
      });

      expect(user.dataProcessingConsent).toBe(true);
      expect(user.privacyPolicyAcceptedAt).toBeInstanceOf(Date);
    });

    it('should successfully register an employer with valid PDPA consent', async () => {
      const userData = {
        name: 'Test',
        surname: 'Employer',
        email: 'employer@test.com',
        password: 'TestPass123!',
        role: 'EMPLOYER',
        privacyConsent: {
          dataProcessingConsent: true
        }
      };

      const roleData = {
        companyName: 'Test Company',
        address: '456 Business Ave',
        phoneNumber: '1234567890'
      };

      const result = await authService.registerUser(userData, roleData);

      expect(result).toBeDefined();
      expect(result.email).toBe('employer@test.com');
      expect(result.role).toBe('EMPLOYER');

      // Verify consent was stored
      const user = await prisma.user.findUnique({
        where: { id: result.id }
      });

      expect(user.dataProcessingConsent).toBe(true);
      expect(user.privacyPolicyAcceptedAt).toBeInstanceOf(Date);
    });

    it('should fail registration when privacyConsent is missing', async () => {
      const userData = {
        name: 'Test',
        surname: 'User',
        email: 'noconsent@test.com',
        password: 'TestPass123!',
        role: 'STUDENT'
        // privacyConsent is missing
      };

      const roleData = {
        degreeTypeId: testDegreeType.id,
        address: '123 Test Street'
      };

      await expect(authService.registerUser(userData, roleData))
        .rejects.toThrow('PDPA consent required');
    });

    it('should fail registration when dataProcessingConsent is false', async () => {
      const userData = {
        name: 'Test',
        surname: 'User',
        email: 'noconsent2@test.com',
        password: 'TestPass123!',
        role: 'STUDENT',
        privacyConsent: {
          dataProcessingConsent: false
        }
      };

      const roleData = {
        degreeTypeId: testDegreeType.id,
        address: '123 Test Street'
      };

      await expect(authService.registerUser(userData, roleData))
        .rejects.toThrow('PDPA consent required');
    });

    it('should fail registration when privacyConsent is not an object', async () => {
      const userData = {
        name: 'Test',
        surname: 'User',
        email: 'invalidconsent@test.com',
        password: 'TestPass123!',
        role: 'STUDENT',
        privacyConsent: true // Should be an object
      };

      const roleData = {
        degreeTypeId: testDegreeType.id,
        address: '123 Test Street'
      };

      await expect(authService.registerUser(userData, roleData))
        .rejects.toThrow('PDPA consent required');
    });
  });

  describe('Google OAuth User Creation with Consent', () => {
    it('should automatically set consent for new Google OAuth users', async () => {
      const googleProfile = {
        providerAccountId: 'google123',
        email: 'oauth@test.com',
        name: 'OAuth',
        surname: 'User',
        accessToken: 'access_token',
        refreshToken: 'refresh_token'
      };

      const result = await authService.findOrCreateGoogleUser(googleProfile);

      expect(result).toBeDefined();
      expect(result.email).toBe('oauth@test.com');

      // Verify consent was automatically set
      const user = await prisma.user.findUnique({
        where: { id: result.id }
      });

      expect(user.dataProcessingConsent).toBe(true);
      expect(user.privacyPolicyAcceptedAt).toBeInstanceOf(Date);
    });

    it('should not modify consent for existing Google OAuth users', async () => {
      // Create existing user
      const existingUser = await prisma.user.create({
        data: {
          name: 'Existing',
          surname: 'User',
          email: 'existing@test.com',
          password: null,
          role: 'STUDENT',
          status: 'APPROVED',
          verified: true,
          dataProcessingConsent: true,
          privacyPolicyAcceptedAt: new Date('2024-01-01')
        }
      });

      await prisma.student.create({
        data: {
          userId: existingUser.id,
          degreeTypeId: testDegreeType.id,
          address: 'Test Address'
        }
      });

      await prisma.account.create({
        data: {
          userId: existingUser.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: 'existing_google_id',
          token_type: 'Bearer'
        }
      });

      const googleProfile = {
        providerAccountId: 'existing_google_id',
        email: 'existing@test.com',
        name: 'Existing',
        surname: 'User'
      };

      const result = await authService.findOrCreateGoogleUser(googleProfile);

      expect(result.email).toBe('existing@test.com');
      expect(result.id).toBe(existingUser.id);

      // Original consent should remain unchanged
      const user = await prisma.user.findUnique({
        where: { id: result.id }
      });

      expect(user.dataProcessingConsent).toBe(true);
      expect(user.privacyPolicyAcceptedAt.toISOString()).toBe(
        new Date('2024-01-01').toISOString()
      );
    });
  });

  describe('Account Deletion (Right to Erasure)', () => {
    it('should allow users to delete their own account', async () => {
      // Create a test user
      const user = await prisma.user.create({
        data: {
          name: 'Delete',
          surname: 'Me',
          email: 'deleteme@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'APPROVED',
          dataProcessingConsent: true,
          privacyPolicyAcceptedAt: new Date()
        }
      });

      await prisma.student.create({
        data: {
          userId: user.id,
          degreeTypeId: testDegreeType.id,
          address: 'Test Address'
        }
      });

      // User deletes their own account
      await userService.deleteAccount(user.id, user.id);

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      expect(deletedUser).toBeNull();

      // Verify student record is deleted
      const deletedStudent = await prisma.student.findUnique({
        where: { userId: user.id }
      });

      expect(deletedStudent).toBeNull();
    });

    it('should allow admin to delete another user account', async () => {
      // Create admin user
      const admin = await prisma.user.create({
        data: {
          name: 'Admin',
          surname: 'User',
          email: 'admin@test.com',
          password: 'hashed',
          role: 'ADMIN',
          status: 'APPROVED',
          dataProcessingConsent: true,
          privacyPolicyAcceptedAt: new Date()
        }
      });

      await prisma.admin.create({
        data: { userId: admin.id }
      });

      // Create target user
      const targetUser = await prisma.user.create({
        data: {
          name: 'Target',
          surname: 'User',
          email: 'target@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'APPROVED',
          dataProcessingConsent: true,
          privacyPolicyAcceptedAt: new Date()
        }
      });

      await prisma.student.create({
        data: {
          userId: targetUser.id,
          degreeTypeId: testDegreeType.id,
          address: 'Test Address'
        }
      });

      // Admin deletes target user
      await userService.deleteAccount(targetUser.id, admin.id);

      // Verify target user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: targetUser.id }
      });

      expect(deletedUser).toBeNull();
    });

    it('should prevent non-admin users from deleting other accounts', async () => {
      // Create two regular users
      const user1 = await prisma.user.create({
        data: {
          name: 'User',
          surname: 'One',
          email: 'user1@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'APPROVED',
          dataProcessingConsent: true,
          privacyPolicyAcceptedAt: new Date()
        }
      });

      const user2 = await prisma.user.create({
        data: {
          name: 'User',
          surname: 'Two',
          email: 'user2@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'APPROVED',
          dataProcessingConsent: true,
          privacyPolicyAcceptedAt: new Date()
        }
      });

      // User1 tries to delete User2's account
      await expect(userService.deleteAccount(user2.id, user1.id))
        .rejects.toThrow('Unauthorized to delete this account');

      // Verify user2 still exists
      const stillExists = await prisma.user.findUnique({
        where: { id: user2.id }
      });

      expect(stillExists).not.toBeNull();
    });

    it('should delete all associated student data when account is deleted', async () => {
      // Create student with various associated data
      const student = await prisma.user.create({
        data: {
          name: 'Student',
          surname: 'WithData',
          email: 'studentdata@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'APPROVED',
          dataProcessingConsent: true,
          privacyPolicyAcceptedAt: new Date()
        }
      });

      const studentProfile = await prisma.student.create({
        data: {
          userId: student.id,
          degreeTypeId: testDegreeType.id,
          address: 'Test Address'
        }
      });

      // Create preferences
      await prisma.studentPreference.create({
        data: {
          studentId: studentProfile.id,
          desiredLocation: 'Bangkok'
        }
      });

      // Create saved job
      const employer = await prisma.user.create({
        data: {
          name: 'Employer',
          surname: 'Test',
          email: 'employer2@test.com',
          password: 'hashed',
          role: 'EMPLOYER',
          status: 'APPROVED',
          dataProcessingConsent: true,
          privacyPolicyAcceptedAt: new Date()
        }
      });

      const hr = await prisma.hR.create({
        data: {
          userId: employer.id,
          companyName: 'Test Company',
          address: 'Test Address',
          phoneNumber: '1234567890'
        }
      });

      const job = await prisma.job.create({
        data: {
          hrId: hr.id,
          title: 'Test Job',
          companyName: 'Test Company',
          description: 'Test Description',
          location: 'Bangkok',
          jobType: 'Full-time',
          workArrangement: 'On-site',
          duration: '1 year',
          minSalary: 30000,
          maxSalary: 50000,
          application_deadline: new Date('2025-12-31'),
          phone_number: '1234567890'
        }
      });

      await prisma.savedJob.create({
        data: {
          userId: student.id,
          jobId: job.id
        }
      });

      // Delete account
      await userService.deleteAccount(student.id, student.id);

      // Verify all related data is deleted
      expect(await prisma.user.findUnique({ where: { id: student.id } })).toBeNull();
      expect(await prisma.student.findUnique({ where: { userId: student.id } })).toBeNull();
      expect(await prisma.studentPreference.findUnique({ where: { studentId: studentProfile.id } })).toBeNull();
      expect(await prisma.savedJob.findFirst({ where: { userId: student.id } })).toBeNull();
    });

    it('should throw error when trying to delete non-existent user', async () => {
      const admin = await prisma.user.create({
        data: {
          name: 'Admin',
          surname: 'User',
          email: 'admin2@test.com',
          password: 'hashed',
          role: 'ADMIN',
          status: 'APPROVED',
          dataProcessingConsent: true,
          privacyPolicyAcceptedAt: new Date()
        }
      });

      await expect(userService.deleteAccount('nonexistent-id', admin.id))
        .rejects.toThrow('User not found');
    });
  });
});
