const userService = require('../../src/services/userService');
const prisma = require('../../src/models/prisma');

describe('UserService - Enhanced Coverage', () => {
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

  afterEach(async () => {
    await prisma.application.deleteMany({});
    await prisma.job.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.jobReport.deleteMany({});
    await prisma.hR.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.professor.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('listPendingUsers', () => {
    beforeEach(async () => {
      await prisma.user.createMany({
        data: [
          {
            name: 'Pending1',
            surname: 'User',
            email: 'pending1@test.com',
            password: 'hash',
            role: 'STUDENT',
            status: 'PENDING'
          },
          {
            name: 'Approved',
            surname: 'User',
            email: 'approved@test.com',
            password: 'hash',
            role: 'STUDENT',
            status: 'APPROVED'
          },
          {
            name: 'Pending2',
            surname: 'User',
            email: 'pending2@test.com',
            password: 'hash',
            role: 'EMPLOYER',
            status: 'PENDING'
          }
        ]
      });
    });

    it('should return only pending users', async () => {
      const result = await userService.listPendingUsers();

      expect(result.length).toBe(2);
      expect(result.every(u => u.status === 'PENDING')).toBe(true);
    });

    it('should order by creation date ascending', async () => {
      const result = await userService.listPendingUsers();

      expect(result[0].email).toBe('pending1@test.com');
    });
  });

  describe('updateUserStatus', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'User',
          email: 'test@example.com',
          password: 'hash',
          role: 'STUDENT',
          status: 'PENDING'
        }
      });
    });

    it('should update user status to APPROVED', async () => {
      const result = await userService.updateUserStatus(testUser.id, 'APPROVED');

      expect(result.status).toBe('APPROVED');
    });

    it('should throw error for invalid status', async () => {
      await expect(userService.updateUserStatus(testUser.id, 'INVALID'))
        .rejects.toThrow('Invalid status');
    });

    it('should throw error if user not found', async () => {
      await expect(userService.updateUserStatus('non-existent', 'APPROVED'))
        .rejects.toThrow('User not found');
    });

    it('should throw error if user already has that status', async () => {
      await expect(userService.updateUserStatus(testUser.id, 'PENDING'))
        .rejects.toThrow('User is already pending approval');
    });

    it('should prevent rejecting approved users', async () => {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { status: 'APPROVED' }
      });

      await expect(userService.updateUserStatus(testUser.id, 'REJECTED'))
        .rejects.toThrow('Cannot reject an already-approved user');
    });

    it('should allow suspending approved users', async () => {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { status: 'APPROVED' }
      });

      const result = await userService.updateUserStatus(testUser.id, 'SUSPENDED');

      expect(result.status).toBe('SUSPENDED');
    });
  });

  describe('suspendUser', () => {
    let testUser, adminUser;

    beforeEach(async () => {
      testUser = await prisma.user.create({
        data: {
          name: 'Test',
          surname: 'User',
          email: 'test@example.com',
          password: 'hash',
          role: 'STUDENT',
          status: 'APPROVED'
        }
      });

      adminUser = await prisma.user.create({
        data: {
          name: 'Admin',
          surname: 'User',
          email: 'admin@example.com',
          password: 'hash',
          role: 'ADMIN',
          status: 'APPROVED'
        }
      });
    });

    it('should suspend user successfully', async () => {
      const result = await userService.suspendUser(testUser.id);

      expect(result.status).toBe('SUSPENDED');
    });

    it('should prevent admin from suspending themselves', async () => {
      await expect(userService.suspendUser(adminUser.id, adminUser.id))
        .rejects.toThrow('Cannot suspend your own account');
    });

    it('should allow admin to suspend other users', async () => {
      const result = await userService.suspendUser(testUser.id, adminUser.id);

      expect(result.status).toBe('SUSPENDED');
    });
  });

  describe('activateUser', () => {
    it('should activate suspended user', async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Suspended',
          surname: 'User',
          email: 'suspended@test.com',
          password: 'hash',
          role: 'STUDENT',
          status: 'SUSPENDED'
        }
      });

      const result = await userService.activateUser(user.id);

      expect(result.status).toBe('APPROVED');
    });
  });

  describe('getDashboardStats', () => {
    beforeEach(async () => {
      // Create diverse test data
      const users = await prisma.user.createMany({
        data: [
          { name: 'Student1', surname: 'Test', email: 's1@test.com', password: 'hash', role: 'STUDENT', status: 'APPROVED' },
          { name: 'Student2', surname: 'Test', email: 's2@test.com', password: 'hash', role: 'STUDENT', status: 'PENDING' },
          { name: 'Employer1', surname: 'Test', email: 'e1@test.com', password: 'hash', role: 'EMPLOYER', status: 'APPROVED' }
        ]
      });
    });

    it('should return comprehensive dashboard statistics', async () => {
      const stats = await userService.getDashboardStats();

      expect(stats).toHaveProperty('users');
      expect(stats).toHaveProperty('jobs');
      expect(stats).toHaveProperty('applications');
      expect(stats).toHaveProperty('announcements');
      expect(stats).toHaveProperty('reports');
      expect(stats).toHaveProperty('trending');
      expect(stats).toHaveProperty('alerts');
      expect(stats).toHaveProperty('recentActivity');
    });

    it('should calculate user statistics correctly', async () => {
      const stats = await userService.getDashboardStats();

      expect(stats.users.total).toBeGreaterThan(0);
      expect(stats.users.byStatus).toHaveProperty('pending');
      expect(stats.users.byStatus).toHaveProperty('approved');
      expect(stats.users.byRole).toHaveProperty('student');
    });

    it('should include growth metrics', async () => {
      const stats = await userService.getDashboardStats();

      expect(stats.users.growth).toHaveProperty('thisWeek');
      expect(stats.users.growth).toHaveProperty('thisMonth');
    });

    it('should calculate percentage metrics', async () => {
      const stats = await userService.getDashboardStats();

      expect(stats.users.metrics).toHaveProperty('approvalRate');
      expect(stats.users.metrics).toHaveProperty('pendingRate');
      expect(stats.users.metrics).toHaveProperty('rejectionRate');
    });

    it('should include pending verifications count', async () => {
      const stats = await userService.getDashboardStats();

      expect(stats).toHaveProperty('pendingVerifications');
      expect(typeof stats.pendingVerifications).toBe('number');
    });

    it('should include user registration trend', async () => {
      const stats = await userService.getDashboardStats();

      expect(stats).toHaveProperty('userRegistrationTrend');
      expect(Array.isArray(stats.userRegistrationTrend)).toBe(true);
      expect(stats.userRegistrationTrend.length).toBe(7);
    });

    it('should include recent activity feed', async () => {
      const stats = await userService.getDashboardStats();

      expect(Array.isArray(stats.recentActivity)).toBe(true);
      expect(stats.recentActivity.length).toBeLessThanOrEqual(20);
    });
  });

  describe('getAllUsers', () => {
    beforeEach(async () => {
      await prisma.user.createMany({
        data: [
          { name: 'User1', surname: 'Test', email: 'user1@test.com', password: 'hash', role: 'STUDENT', status: 'APPROVED' },
          { name: 'User2', surname: 'Test', email: 'user2@test.com', password: 'hash', role: 'EMPLOYER', status: 'PENDING' },
          { name: 'User3', surname: 'Test', email: 'user3@test.com', password: 'hash', role: 'STUDENT', status: 'APPROVED' }
        ]
      });
    });

    it('should return all users without filters', async () => {
      const result = await userService.getAllUsers();

      expect(result.length).toBe(3);
    });

    it('should filter by role', async () => {
      const result = await userService.getAllUsers({ role: 'STUDENT' });

      expect(result.length).toBe(2);
      expect(result.every(u => u.role === 'STUDENT')).toBe(true);
    });

    it('should filter by status', async () => {
      const result = await userService.getAllUsers({ status: 'PENDING' });

      expect(result.length).toBe(1);
      expect(result[0].status).toBe('PENDING');
    });

    it('should combine role and status filters', async () => {
      const result = await userService.getAllUsers({ role: 'STUDENT', status: 'APPROVED' });

      expect(result.length).toBe(2);
      expect(result.every(u => u.role === 'STUDENT' && u.status === 'APPROVED')).toBe(true);
    });
  });

  describe('searchUsers', () => {
    beforeEach(async () => {
      await prisma.user.createMany({
        data: [
          { name: 'John', surname: 'Doe', email: 'john.doe@test.com', password: 'hash', role: 'STUDENT', status: 'APPROVED' },
          { name: 'Jane', surname: 'Smith', email: 'jane.smith@test.com', password: 'hash', role: 'EMPLOYER', status: 'PENDING' },
          { name: 'Bob', surname: 'Wilson', email: 'bob@test.com', password: 'hash', role: 'STUDENT', status: 'APPROVED' }
        ]
      });
    });

    it('should search by email', async () => {
      const result = await userService.searchUsers({ search: 'john.doe' });

      expect(result.users.length).toBe(1);
      expect(result.users[0].email).toBe('john.doe@test.com');
    });

    it('should search case-insensitively', async () => {
      const result = await userService.searchUsers({ search: 'JOHN.DOE' });

      expect(result.users.length).toBe(1);
    });

    it('should support pagination', async () => {
      const result = await userService.searchUsers({ page: 1, limit: 2 });

      expect(result.users.length).toBeLessThanOrEqual(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter by role and status', async () => {
      const result = await userService.searchUsers({
        role: 'STUDENT',
        status: 'APPROVED'
      });

      expect(result.users.length).toBe(2);
      expect(result.users.every(u => u.role === 'STUDENT' && u.status === 'APPROVED')).toBe(true);
    });

    it('should return pagination metadata', async () => {
      const result = await userService.searchUsers();

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('totalPages');
    });
  });
});
