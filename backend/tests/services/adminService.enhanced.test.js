const adminService = require('../../src/services/adminService');
const prisma = require('../../src/models/prisma');
const { hashPassword } = require('../../src/utils/passwordUtils');

// Mock dependencies
jest.mock('../../src/utils/passwordUtils');
jest.mock('../../src/utils/emailUtils', () => ({
  sendProfessorWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

describe('AdminService - Enhanced Coverage', () => {
  beforeAll(async () => {
    // Clean up ALL data before starting these tests
    await prisma.notification.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.jobReport.deleteMany({});
    await prisma.application.deleteMany({});
    await prisma.savedJob.deleteMany({});
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test data - respect foreign key constraints
    await prisma.notification.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.jobReport.deleteMany({});
    await prisma.application.deleteMany({});
    await prisma.savedJob.deleteMany({});
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

  describe('approveUser', () => {
    it('should approve a pending user successfully', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'User',
          email: 'approve@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'PENDING'
        }
      });

      const result = await adminService.approveUser(user.id);

      expect(result.status).toBe('APPROVED');
      expect(result.email).toBe('approve@test.com');
    });

    it('should throw 404 error if user not found', async () => {
      await expect(adminService.approveUser('non-existent-id'))
        .rejects.toThrow('User not found');
    });

    it('should throw 400 error if user is already approved', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Already',
          surname: 'Approved',
          email: 'already@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'APPROVED'
        }
      });

      await expect(adminService.approveUser(user.id))
        .rejects.toThrow('User is already approved');
    });
  });

  describe('rejectUser', () => {
    it('should reject a pending user successfully', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'Reject',
          email: 'reject@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'PENDING'
        }
      });

      const result = await adminService.rejectUser(user.id);

      expect(result.status).toBe('REJECTED');
    });

    it('should throw error if user not found', async () => {
      await expect(adminService.rejectUser('non-existent-id'))
        .rejects.toThrow('User not found');
    });
  });

  describe('suspendUser', () => {
    it('should suspend an approved user successfully', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'Suspend',
          email: 'suspend@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'APPROVED'
        }
      });

      const result = await adminService.suspendUser(user.id);

      expect(result.status).toBe('SUSPENDED');
    });

    it('should throw 404 error if user not found', async () => {
      await expect(adminService.suspendUser('non-existent-id'))
        .rejects.toThrow('User not found');
    });

    it('should throw 400 error if trying to suspend an admin', async () => {
      const admin = await prisma.user.create({
        data: {
          name: 'Admin',
          surname: 'User',
          email: 'admin@test.com',
          password: 'hashed',
          role: 'ADMIN',
          status: 'APPROVED'
        }
      });

      await expect(adminService.suspendUser(admin.id))
        .rejects.toThrow('Cannot suspend admin users');
    });

    it('should throw 400 error if user is already suspended', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Already',
          surname: 'Suspended',
          email: 'suspended@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'SUSPENDED'
        }
      });

      await expect(adminService.suspendUser(user.id))
        .rejects.toThrow('User is already suspended');
    });
  });

  describe('activateUser', () => {
    it('should activate a suspended user successfully', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'Activate',
          email: 'activate@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'SUSPENDED'
        }
      });

      const result = await adminService.activateUser(user.id);

      expect(result.status).toBe('APPROVED');
    });

    it('should throw error if user not found', async () => {
      await expect(adminService.activateUser('non-existent-id'))
        .rejects.toThrow('User not found');
    });

    it('should throw error if user is already active', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Already',
          surname: 'Active',
          email: 'active@test.com',
          password: 'hashed',
          role: 'STUDENT',
          status: 'APPROVED'
        }
      });

      await expect(adminService.activateUser(user.id))
        .rejects.toThrow('User is already active');
    });
  });

  describe('listUsers', () => {
    beforeEach(async () => {
      // Clean up before creating to avoid conflicts
      await prisma.user.deleteMany({
        where: {
          email: {
            in: ['list1@test.com', 'list2@test.com', 'list3@test.com']
          }
        }
      });
      // Create test users with unique emails
      await prisma.user.createMany({
        data: [
          { name: 'User1', surname: 'Test', email: 'list1@test.com', password: 'hash', role: 'STUDENT', status: 'APPROVED' },
          { name: 'User2', surname: 'Test', email: 'list2@test.com', password: 'hash', role: 'STUDENT', status: 'PENDING' },
          { name: 'User3', surname: 'Test', email: 'list3@test.com', password: 'hash', role: 'EMPLOYER', status: 'APPROVED' }
        ]
      });
    });

    it('should list all users without filters', async () => {
      const result = await adminService.listUsers();

      expect(result.users).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter users by status', async () => {
      const result = await adminService.listUsers({ status: 'PENDING' });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].status).toBe('PENDING');
    });

    it('should filter users by role', async () => {
      const result = await adminService.listUsers({ role: 'EMPLOYER' });

      expect(result.users).toHaveLength(1);
      expect(result.users[0].role).toBe('EMPLOYER');
    });

    it('should support pagination', async () => {
      const result = await adminService.listUsers({ page: 1, limit: 2 });

      expect(result.users).toHaveLength(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  describe('getDashboardStats', () => {
    beforeEach(async () => {
      // Clean up before creating
      await prisma.user.deleteMany({
        where: {
          email: {
            in: ['dashpending@test.com', 'dashapproved@test.com', 'dashsuspended@test.com']
          }
        }
      });
      // Create test data
      await prisma.user.createMany({
        data: [
          { name: 'Pending', surname: 'User', email: 'dashpending@test.com', password: 'hash', role: 'STUDENT', status: 'PENDING' },
          { name: 'Approved', surname: 'User', email: 'dashapproved@test.com', password: 'hash', role: 'STUDENT', status: 'APPROVED' },
          { name: 'Suspended', surname: 'User', email: 'dashsuspended@test.com', password: 'hash', role: 'STUDENT', status: 'SUSPENDED' }
        ]
      });
    });

    it('should return comprehensive dashboard statistics', async () => {
      const stats = await adminService.getDashboardStats();

      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('usersByStatus');
      expect(stats).toHaveProperty('usersByRole');
      expect(stats).toHaveProperty('totalJobs');
      expect(stats).toHaveProperty('totalApplications');
      expect(stats).toHaveProperty('recentUsers');

      expect(stats.totalUsers).toBe(3);
      expect(stats.usersByStatus.pending).toBe(1);
      expect(stats.usersByStatus.approved).toBe(1);
      expect(stats.usersByStatus.suspended).toBe(1);
    });

    it('should include recent users', async () => {
      const stats = await adminService.getDashboardStats();

      expect(Array.isArray(stats.recentUsers)).toBe(true);
      expect(stats.recentUsers.length).toBeGreaterThan(0);
    });
  });

  describe('createProfessorUser', () => {
    beforeEach(() => {
      hashPassword.mockResolvedValue('hashed-password');
    });

    it('should create professor with auto-generated password', async () => {
      const data = {
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@test.com',
        department: 'Computer Science',
        createdBy: 'admin-id'
      };

      const result = await adminService.createProfessorUser(data);

      expect(result.user.role).toBe('PROFESSOR');
      expect(result.user.status).toBe('APPROVED');
      expect(result.user.verified).toBe(true);
      expect(result.professor.department).toBe('Computer Science');
      expect(result.credentials).toHaveProperty('temporaryPassword');
    });

    it('should create professor with custom password', async () => {
      const data = {
        name: 'Jane',
        surname: 'Smith',
        email: 'jane.smith@test.com',
        department: 'Mathematics',
        password: 'CustomPass123!',
        createdBy: 'admin-id'
      };

      const result = await adminService.createProfessorUser(data);

      expect(result.user.role).toBe('PROFESSOR');
      expect(result.credentials).toBeUndefined();
    });

    it('should throw 409 error if email already exists', async () => {
      await prisma.user.create({
        data: {
          name: 'Existing',
          surname: 'User',
          email: 'existing@test.com',
          password: 'hash',
          role: 'STUDENT',
          status: 'APPROVED'
        }
      });

      const data = {
        name: 'New',
        surname: 'Prof',
        email: 'existing@test.com',
        department: 'Physics',
        createdBy: 'admin-id'
      };

      await expect(adminService.createProfessorUser(data))
        .rejects.toThrow('Email already registered');
    });

    it('should create professor with optional fields', async () => {
      const data = {
        name: 'Bob',
        surname: 'Johnson',
        email: 'bob.johnson@test.com',
        department: 'Engineering',
        phoneNumber: '123-456-7890',
        officeLocation: 'Building A, Room 101',
        title: 'Assistant Professor',
        createdBy: 'admin-id'
      };

      const result = await adminService.createProfessorUser(data);

      expect(result.professor.phoneNumber).toBe('123-456-7890');
      expect(result.professor.officeLocation).toBe('Building A, Room 101');
      expect(result.professor.title).toBe('Assistant Professor');
    });

    it('should handle email sending failure gracefully', async () => {
      const emailUtils = require('../../src/utils/emailUtils');
      emailUtils.sendProfessorWelcomeEmail.mockRejectedValueOnce(new Error('Email service down'));

      const data = {
        name: 'Test',
        surname: 'Prof',
        email: 'test.prof@test.com',
        department: 'Biology',
        sendWelcomeEmail: true,
        createdBy: 'admin-id'
      };

      const result = await adminService.createProfessorUser(data);

      expect(result.user).toBeDefined();
      expect(result.emailSent).toBe(false);
    });

    it('should not send email when sendWelcomeEmail is false', async () => {
      const emailUtils = require('../../src/utils/emailUtils');
      emailUtils.sendProfessorWelcomeEmail.mockClear();

      const data = {
        name: 'No',
        surname: 'Email',
        email: 'no.email@test.com',
        department: 'Chemistry',
        sendWelcomeEmail: false,
        createdBy: 'admin-id'
      };

      const result = await adminService.createProfessorUser(data);

      expect(result.emailSent).toBe(false);
      expect(emailUtils.sendProfessorWelcomeEmail).not.toHaveBeenCalled();
    });
  });
});
