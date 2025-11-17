const {
  validateAnnouncementCreate,
  validateAnnouncementUpdate,
  validateUserListQuery,
  validateUserId,
  validateAnnouncementSearch,
  validateUserSearch,
  validateProfessorCreate
} = require('../../src/validators/adminValidator');

describe('AdminValidator - Enhanced Coverage', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('validateAnnouncementCreate', () => {
    it('should pass validation with valid data', () => {
      req.body = {
        title: 'Important Announcement',
        content: 'This is the announcement content',
        audience: 'ALL',
        priority: 'HIGH',
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };

      validateAnnouncementCreate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail if title is missing', () => {
      req.body = {
        content: 'Content',
        audience: 'ALL'
      };

      validateAnnouncementCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('Title is required')
          ])
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail if title exceeds 200 characters', () => {
      req.body = {
        title: 'a'.repeat(201),
        content: 'Content',
        audience: 'ALL'
      };

      validateAnnouncementCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('must not exceed 200 characters')
          ])
        })
      );
    });

    it('should fail if content is missing', () => {
      req.body = {
        title: 'Title',
        audience: 'ALL'
      };

      validateAnnouncementCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('Content is required')
          ])
        })
      );
    });

    it('should fail if content exceeds 5000 characters', () => {
      req.body = {
        title: 'Title',
        content: 'a'.repeat(5001),
        audience: 'ALL'
      };

      validateAnnouncementCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('must not exceed 5000 characters')
          ])
        })
      );
    });

    it('should fail if audience is invalid', () => {
      req.body = {
        title: 'Title',
        content: 'Content',
        audience: 'INVALID_AUDIENCE'
      };

      validateAnnouncementCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('Audience must be one of')
          ])
        })
      );
    });

    it('should fail if priority is invalid', () => {
      req.body = {
        title: 'Title',
        content: 'Content',
        audience: 'ALL',
        priority: 'INVALID'
      };

      validateAnnouncementCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('Priority must be one of')
          ])
        })
      );
    });

    it('should fail if expiresAt is in the past', () => {
      req.body = {
        title: 'Title',
        content: 'Content',
        audience: 'ALL',
        expiresAt: new Date(Date.now() - 86400000).toISOString()
      };

      validateAnnouncementCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('must be in the future')
          ])
        })
      );
    });

    it('should fail if expiresAt is invalid date', () => {
      req.body = {
        title: 'Title',
        content: 'Content',
        audience: 'ALL',
        expiresAt: 'invalid-date'
      };

      validateAnnouncementCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('must be a valid date')
          ])
        })
      );
    });

    it('should pass without optional fields', () => {
      req.body = {
        title: 'Title',
        content: 'Content',
        audience: 'STUDENTS'
      };

      validateAnnouncementCreate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('validateAnnouncementUpdate', () => {
    it('should pass with valid partial update', () => {
      req.body = {
        title: 'Updated Title'
      };

      validateAnnouncementUpdate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail if no fields provided', () => {
      req.body = {};

      validateAnnouncementUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'At least one field must be provided for update'
        })
      );
    });

    it('should fail if title is empty string', () => {
      req.body = {
        title: '   '
      };

      validateAnnouncementUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('non-empty string')
          ])
        })
      );
    });

    it('should pass when updating isActive to boolean', () => {
      req.body = {
        isActive: false
      };

      validateAnnouncementUpdate(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail if isActive is not boolean', () => {
      req.body = {
        isActive: 'true'
      };

      validateAnnouncementUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('must be a boolean')
          ])
        })
      );
    });

    it('should pass when setting expiresAt to null', () => {
      req.body = {
        expiresAt: null
      };

      validateAnnouncementUpdate(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail if expiresAt is invalid date', () => {
      req.body = {
        expiresAt: 'not-a-date'
      };

      validateAnnouncementUpdate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('valid date or null')
          ])
        })
      );
    });

    it('should pass with multiple valid fields', () => {
      req.body = {
        title: 'New Title',
        content: 'New Content',
        priority: 'LOW',
        isActive: true
      };

      validateAnnouncementUpdate(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateUserListQuery', () => {
    it('should pass with valid query parameters', () => {
      req.query = {
        status: 'PENDING',
        role: 'STUDENT',
        page: '1',
        limit: '10'
      };

      validateUserListQuery(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail if status is invalid', () => {
      req.query = {
        status: 'INVALID_STATUS'
      };

      validateUserListQuery(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('Status must be one of')
          ])
        })
      );
    });

    it('should fail if role is invalid', () => {
      req.query = {
        role: 'INVALID_ROLE'
      };

      validateUserListQuery(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('Role must be one of')
          ])
        })
      );
    });

    it('should fail if page is not positive integer', () => {
      req.query = {
        page: '0'
      };

      validateUserListQuery(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('must be a positive integer')
          ])
        })
      );
    });

    it('should fail if limit exceeds 100', () => {
      req.query = {
        limit: '101'
      };

      validateUserListQuery(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('between 1 and 100')
          ])
        })
      );
    });

    it('should pass with no query parameters', () => {
      req.query = {};

      validateUserListQuery(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should accept all valid statuses', () => {
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];
      
      validStatuses.forEach(status => {
        req.query = { status };
        next.mockClear();
        validateUserListQuery(req, res, next);
        expect(next).toHaveBeenCalled();
      });
    });

    it('should accept all valid roles', () => {
      const validRoles = ['STUDENT', 'PROFESSOR', 'EMPLOYER', 'ADMIN'];
      
      validRoles.forEach(role => {
        req.query = { role };
        next.mockClear();
        validateUserListQuery(req, res, next);
        expect(next).toHaveBeenCalled();
      });
    });
  });

  describe('validateUserId', () => {
    it('should pass with valid userId', () => {
      req.params = {
        userId: 'valid-user-id-123'
      };

      validateUserId(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail if userId is missing', () => {
      req.params = {};

      validateUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User ID is required'
        })
      );
    });

    it('should fail if userId is empty string', () => {
      req.params = {
        userId: '   '
      };

      validateUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail if userId is not a string', () => {
      req.params = {
        userId: 123
      };

      validateUserId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateAnnouncementSearch', () => {
    it('should pass with valid search parameters', () => {
      req.body = {
        search: 'test announcement',
        audience: 'ALL',
        isActive: true,
        page: 1,
        limit: 10
      };

      validateAnnouncementSearch(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail if audience is invalid', () => {
      req.body = {
        audience: 'INVALID'
      };

      validateAnnouncementSearch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('Audience must be one of')
          ])
        })
      );
    });

    it('should pass with no parameters', () => {
      req.body = {};

      validateAnnouncementSearch(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail if page is negative', () => {
      req.body = {
        page: -1
      };

      validateAnnouncementSearch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('positive integer')
          ])
        })
      );
    });

    it('should fail if isActive is not boolean', () => {
      req.body = {
        isActive: 'true'
      };

      validateAnnouncementSearch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('must be a boolean')
          ])
        })
      );
    });

    it('should fail if startDate is after endDate', () => {
      req.body = {
        startDate: '2025-12-31',
        endDate: '2025-01-01'
      };

      validateAnnouncementSearch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('before endDate')
          ])
        })
      );
    });
  });

  describe('validateUserSearch', () => {
    it('should pass with valid search parameters', () => {
      req.body = {
        search: 'john',
        role: 'STUDENT',
        status: 'APPROVED',
        page: 1,
        limit: 25
      };

      validateUserSearch(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail if role is invalid', () => {
      req.body = {
        role: 'INVALID_ROLE'
      };

      validateUserSearch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('Role must be one of')
          ])
        })
      );
    });

    it('should fail if status is invalid', () => {
      req.body = {
        status: 'INVALID_STATUS'
      };

      validateUserSearch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('Status must be one of')
          ])
        })
      );
    });

    it('should pass with empty body', () => {
      req.body = {};

      validateUserSearch(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail if limit exceeds 100', () => {
      req.body = {
        limit: 101
      };

      validateUserSearch(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('between 1 and 100')
          ])
        })
      );
    });
  });

  describe('validateProfessorCreate', () => {
    it('should pass with valid professor data', () => {
      req.body = {
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@ku.ac.th',
        department: 'Computer Science',
        phoneNumber: '0812345678'
      };

      validateProfessorCreate(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail if name is missing', () => {
      req.body = {
        surname: 'Doe',
        email: 'john.doe@ku.ac.th',
        department: 'Computer Science'
      };

      validateProfessorCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('Name is required')
          ])
        })
      );
    });

    it('should fail if email format is invalid', () => {
      req.body = {
        name: 'John',
        surname: 'Doe',
        email: 'invalid-email',
        department: 'Computer Science'
      };

      validateProfessorCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('valid email')
          ])
        })
      );
    });

    it('should fail if department is missing', () => {
      req.body = {
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@ku.ac.th'
      };

      validateProfessorCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('Department is required')
          ])
        })
      );
    });

    it('should pass with optional fields', () => {
      req.body = {
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@ku.ac.th',
        department: 'Computer Science',
        phoneNumber: '0812345678',
        officeLocation: 'Building A, Room 301',
        title: 'Associate Professor'
      };

      validateProfessorCreate(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail with phone number exceeding max length', () => {
      req.body = {
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@ku.ac.th',
        department: 'Computer Science',
        phoneNumber: '1'.repeat(21) // Exceeds 20 characters
      };

      validateProfessorCreate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.stringContaining('must not exceed 20 characters')
          ])
        })
      );
    });

    it('should pass with valid password when provided', () => {
      req.body = {
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@ku.ac.th',
        department: 'Computer Science',
        password: 'SecurePass123!'
      };

      validateProfessorCreate(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
