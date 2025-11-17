const announcementService = require('../../src/services/announcementService');
const prisma = require('../../src/models/prisma');

describe('AnnouncementService - Enhanced Coverage', () => {
  let adminUser;
  let studentUser;
  let employerUser;

  beforeAll(async () => {
    // Clean up ALL data before starting these tests
    await prisma.userNotification.deleteMany({});
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

  beforeEach(async () => {
    // Create test users
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin',
        surname: 'User',
        email: 'admin@test.com',
        password: 'hashed',
        role: 'ADMIN',
        status: 'APPROVED'
      }
    });

    studentUser = await prisma.user.create({
      data: {
        name: 'Student',
        surname: 'User',
        email: 'student@test.com',
        password: 'hashed',
        role: 'STUDENT',
        status: 'APPROVED'
      }
    });

    employerUser = await prisma.user.create({
      data: {
        name: 'Employer',
        surname: 'User',
        email: 'employer@test.com',
        password: 'hashed',
        role: 'EMPLOYER',
        status: 'APPROVED'
      }
    });
  });

  afterEach(async () => {
    await prisma.userNotification.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.announcement.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('createAnnouncement', () => {
    it('should create announcement for ALL audience', async () => {
      const data = {
        title: 'General Announcement',
        content: 'This is for everyone',
        audience: 'ALL',
        priority: 'HIGH',
        createdBy: adminUser.id
      };

      const result = await announcementService.createAnnouncement(data);

      expect(result.title).toBe('General Announcement');
      expect(result.audience).toBe('ALL');
      expect(result.priority).toBe('HIGH');
      expect(result.creator).toBeDefined();
    });

    it('should create announcement for STUDENTS only', async () => {
      const data = {
        title: 'Student Notice',
        content: 'Only for students',
        audience: 'STUDENTS',
        priority: 'MEDIUM',
        createdBy: adminUser.id
      };

      const result = await announcementService.createAnnouncement(data);

      expect(result.audience).toBe('STUDENTS');
    });

    it('should create notifications for targeted audience', async () => {
      const data = {
        title: 'Student Alert',
        content: 'Important for students',
        audience: 'STUDENTS',
        createdBy: adminUser.id
      };

      await announcementService.createAnnouncement(data);

      const notifications = await prisma.notification.findMany({
        where: { userId: studentUser.id }
      });

      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should set default priority to MEDIUM if not provided', async () => {
      const data = {
        title: 'Default Priority',
        content: 'Testing default',
        audience: 'ALL',
        createdBy: adminUser.id
      };

      const result = await announcementService.createAnnouncement(data);

      expect(result.priority).toBe('MEDIUM');
    });

    it('should support optional expiration date', async () => {
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const data = {
        title: 'Temporary Notice',
        content: 'Expires soon',
        audience: 'ALL',
        createdBy: adminUser.id,
        expiresAt: expiryDate
      };

      const result = await announcementService.createAnnouncement(data);

      expect(result.expiresAt).toBeDefined();
    });
  });

  describe('getAllAnnouncements', () => {
    beforeEach(async () => {
      // Create test announcements
      await prisma.announcement.createMany({
        data: [
          {
            title: 'Active General',
            content: 'Active announcement',
            audience: 'ALL',
            priority: 'HIGH',
            createdBy: adminUser.id,
            isActive: true
          },
          {
            title: 'Inactive Announcement',
            content: 'Not active',
            audience: 'ALL',
            priority: 'LOW',
            createdBy: adminUser.id,
            isActive: false
          },
          {
            title: 'Student Only',
            content: 'For students',
            audience: 'STUDENTS',
            priority: 'MEDIUM',
            createdBy: adminUser.id,
            isActive: true
          }
        ]
      });
    });

    it('should get all announcements without filters', async () => {
      const result = await announcementService.getAllAnnouncements();

      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter by active status', async () => {
      const result = await announcementService.getAllAnnouncements({ isActive: true });

      expect(result.every(a => a.isActive === true)).toBe(true);
    });

    it('should filter by audience', async () => {
      const result = await announcementService.getAllAnnouncements({ audience: 'STUDENTS' });

      expect(result.every(a => a.audience === 'STUDENTS')).toBe(true);
    });

    it('should filter by user role', async () => {
      const result = await announcementService.getAllAnnouncements({ userRole: 'STUDENT' });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every(a => ['ALL', 'STUDENTS'].includes(a.audience))).toBe(true);
    });

    it('should order by priority and creation date', async () => {
      const result = await announcementService.getAllAnnouncements({ isActive: true });

      // Check that HIGH priority comes before others
      const priorities = result.map(a => a.priority);
      const highIndex = priorities.indexOf('HIGH');
      const lowIndex = priorities.indexOf('LOW');
      
      if (highIndex !== -1 && lowIndex !== -1) {
        expect(highIndex).toBeLessThan(lowIndex);
      }
    });
  });

  describe('getAnnouncementById', () => {
    it('should get announcement by ID with creator info', async () => {
      const announcement = await prisma.announcement.create({
        data: {
          title: 'Test Announcement',
          content: 'Test content',
          audience: 'ALL',
          createdBy: adminUser.id
        }
      });

      const result = await announcementService.getAnnouncementById(announcement.id);

      expect(result.id).toBe(announcement.id);
      expect(result.title).toBe('Test Announcement');
      expect(result.creator).toBeDefined();
      expect(result.creator.name).toBe('Admin');
    });

    it('should throw error if announcement not found', async () => {
      await expect(announcementService.getAnnouncementById('non-existent-id'))
        .rejects.toThrow('Announcement not found');
    });

    it('should include notifications in response', async () => {
      const announcement = await prisma.announcement.create({
        data: {
          title: 'With Notifications',
          content: 'Test',
          audience: 'ALL',
          createdBy: adminUser.id
        }
      });

      await prisma.notification.create({
        data: {
          announcementId: announcement.id,
          userId: studentUser.id
        }
      });

      const result = await announcementService.getAnnouncementById(announcement.id);

      expect(result.notifications).toBeDefined();
      expect(Array.isArray(result.notifications)).toBe(true);
    });
  });

  describe('updateAnnouncement', () => {
    it('should update announcement successfully', async () => {
      const announcement = await prisma.announcement.create({
        data: {
          title: 'Original Title',
          content: 'Original content',
          audience: 'ALL',
          createdBy: adminUser.id
        }
      });

      const result = await announcementService.updateAnnouncement(announcement.id, {
        title: 'Updated Title',
        content: 'Updated content'
      });

      expect(result.title).toBe('Updated Title');
      expect(result.content).toBe('Updated content');
    });

    it('should update priority', async () => {
      const announcement = await prisma.announcement.create({
        data: {
          title: 'Test',
          content: 'Test',
          audience: 'ALL',
          priority: 'LOW',
          createdBy: adminUser.id
        }
      });

      const result = await announcementService.updateAnnouncement(announcement.id, {
        priority: 'HIGH'
      });

      expect(result.priority).toBe('HIGH');
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delete announcement successfully', async () => {
      const announcement = await prisma.announcement.create({
        data: {
          title: 'To Delete',
          content: 'Will be deleted',
          audience: 'ALL',
          createdBy: adminUser.id
        }
      });

      const result = await announcementService.deleteAnnouncement(announcement.id);

      expect(result.id).toBe(announcement.id);

      const found = await prisma.announcement.findUnique({
        where: { id: announcement.id }
      });

      expect(found).toBeNull();
    });
  });

  describe('searchAnnouncements', () => {
    beforeEach(async () => {
      await prisma.announcement.createMany({
        data: [
          {
            title: 'Summer Internship',
            content: 'Apply now',
            audience: 'STUDENTS',
            createdBy: adminUser.id,
            isActive: true
          },
          {
            title: 'Holiday Notice',
            content: 'Office closed',
            audience: 'ALL',
            createdBy: adminUser.id,
            isActive: true
          },
          {
            title: 'Archived Post',
            content: 'Old news',
            audience: 'ALL',
            createdBy: adminUser.id,
            isActive: false
          }
        ]
      });
    });

    it('should search with text query', async () => {
      const result = await announcementService.searchAnnouncements({ search: 'Summer' });

      expect(result.announcements.some(a => a.title.includes('Summer'))).toBe(true);
    });

    it('should filter by active status', async () => {
      const result = await announcementService.searchAnnouncements({ isActive: true });

      expect(result.announcements.every(a => a.isActive === true)).toBe(true);
    });

    it('should support pagination', async () => {
      const result = await announcementService.searchAnnouncements({ page: 1, limit: 2 });

      expect(result.announcements.length).toBeLessThanOrEqual(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
    });

    it('should return pagination metadata', async () => {
      const result = await announcementService.searchAnnouncements();

      expect(result).toHaveProperty('announcements');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('total');
      expect(result.pagination).toHaveProperty('totalPages');
    });
  });

  describe('getAnnouncementsForRole', () => {
    beforeEach(async () => {
      // Clean up existing announcements first
      await prisma.announcement.deleteMany({});
      
      await prisma.announcement.createMany({
        data: [
          {
            title: 'For All',
            content: 'Everyone can see',
            audience: 'ALL',
            createdBy: adminUser.id,
            isActive: true
          },
          {
            title: 'Students Only',
            content: 'Student content',
            audience: 'STUDENTS',
            createdBy: adminUser.id,
            isActive: true
          },
          {
            title: 'Employers Only',
            content: 'Employer content',
            audience: 'EMPLOYERS',
            createdBy: adminUser.id,
            isActive: true
          }
        ]
      });
    });

    it('should show ALL audience for non-logged in users', async () => {
      const result = await announcementService.getAnnouncementsForRole(null);

      expect(result.every(a => a.audience === 'ALL')).toBe(true);
    });

    it('should show ALL + role-specific for students', async () => {
      const result = await announcementService.getAnnouncementsForRole('STUDENT');

      expect(result.some(a => a.audience === 'ALL')).toBe(true);
      expect(result.some(a => a.audience === 'STUDENTS')).toBe(true);
      expect(result.every(a => !a.audience.includes('EMPLOYER'))).toBe(true);
    });

    it('should only show active announcements', async () => {
      // Add an inactive announcement
      await prisma.announcement.create({
        data: {
          title: 'Inactive Announcement',
          content: 'Should not appear',
          audience: 'ALL',
          createdBy: adminUser.id,
          isActive: false
        }
      });

      const result = await announcementService.getAnnouncementsForRole('STUDENT');

      // Should only return the 2 active student-related ones (ALL + STUDENTS)
      expect(result.length).toBe(2);
      expect(result.every(a => a.title !== 'Inactive Announcement')).toBe(true);
    });
  });
});
