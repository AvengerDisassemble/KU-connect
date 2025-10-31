/**
 * @fileoverview Unit tests for adminService - createProfessorUser function
 * @module tests/services/adminService.test
 */

const { PrismaClient } = require('../../src/generated/prisma')
const adminService = require('../../src/services/adminService')
const { hashPassword, generateSecurePassword } = require('../../src/utils/passwordUtils')
const { sendProfessorWelcomeEmail } = require('../../src/utils/emailUtils')

// Mock dependencies
jest.mock('../../src/utils/passwordUtils')
jest.mock('../../src/utils/emailUtils')
jest.mock('../../src/generated/prisma', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    professor: {
      create: jest.fn()
    },
    $transaction: jest.fn()
  }
  return {
    PrismaClient: jest.fn(() => mockPrismaClient)
  }
})

describe('AdminService - createProfessorUser', () => {
  let prisma

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Get prisma instance
    prisma = new PrismaClient()
    
    // Setup default mock implementations
    hashPassword.mockResolvedValue('$2b$12$hashedPassword')
    generateSecurePassword.mockReturnValue('TempPass123!')
    sendProfessorWelcomeEmail.mockResolvedValue(true)
  })

  describe('Success cases', () => {
    it('should create professor with all required fields', async () => {
      const professorData = {
        name: 'John',
        surname: 'Smith',
        email: 'john.smith@ku.ac.th',
        department: 'Computer Science',
        createdBy: 'admin-id-123'
      }

      prisma.user.findUnique.mockResolvedValue(null) // No existing user
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-123',
              name: 'John',
              surname: 'Smith',
              email: 'john.smith@ku.ac.th',
              role: 'PROFESSOR',
              status: 'APPROVED',
              verified: true,
              createdAt: new Date()
            })
          },
          professor: {
            create: jest.fn().mockResolvedValue({
              id: 'prof-123',
              userId: 'user-123',
              department: 'Computer Science',
              phoneNumber: null,
              officeLocation: null,
              title: null,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        })
      })

      const result = await adminService.createProfessorUser(professorData)

      expect(result.user).toBeDefined()
      expect(result.user.email).toBe('john.smith@ku.ac.th')
      expect(result.user.status).toBe('APPROVED')
      expect(result.user.verified).toBe(true)
      expect(result.professor).toBeDefined()
      expect(result.professor.department).toBe('Computer Science')
      expect(result.credentials.temporaryPassword).toBe('TempPass123!')
    })

    it('should create professor with all optional fields', async () => {
      const professorData = {
        name: 'Jane',
        surname: 'Doe',
        email: 'jane.doe@ku.ac.th',
        department: 'Mathematics',
        phoneNumber: '+66-123-456789',
        officeLocation: 'Building A, Room 301',
        title: 'Assistant Professor',
        createdBy: 'admin-id-123'
      }

      prisma.user.findUnique.mockResolvedValue(null)
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-456',
              name: 'Jane',
              surname: 'Doe',
              email: 'jane.doe@ku.ac.th',
              role: 'PROFESSOR',
              status: 'APPROVED',
              verified: true,
              createdAt: new Date()
            })
          },
          professor: {
            create: jest.fn().mockResolvedValue({
              id: 'prof-456',
              userId: 'user-456',
              department: 'Mathematics',
              phoneNumber: '+66-123-456789',
              officeLocation: 'Building A, Room 301',
              title: 'Assistant Professor',
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        })
      })

      const result = await adminService.createProfessorUser(professorData)

      expect(result.professor.phoneNumber).toBe('+66-123-456789')
      expect(result.professor.officeLocation).toBe('Building A, Room 301')
      expect(result.professor.title).toBe('Assistant Professor')
    })

    it('should auto-generate password when not provided', async () => {
      const professorData = {
        name: 'Test',
        surname: 'User',
        email: 'test@ku.ac.th',
        department: 'Test Dept',
        createdBy: 'admin-id-123'
      }

      prisma.user.findUnique.mockResolvedValue(null)
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-789',
              name: 'Test',
              surname: 'User',
              email: 'test@ku.ac.th',
              role: 'PROFESSOR',
              status: 'APPROVED',
              verified: true,
              createdAt: new Date()
            })
          },
          professor: {
            create: jest.fn().mockResolvedValue({
              id: 'prof-789',
              userId: 'user-789',
              department: 'Test Dept',
              phoneNumber: null,
              officeLocation: null,
              title: null,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        })
      })

      const result = await adminService.createProfessorUser(professorData)

      expect(generateSecurePassword).toHaveBeenCalled()
      expect(result.credentials).toBeDefined()
      expect(result.credentials.temporaryPassword).toBe('TempPass123!')
    })

    it('should use custom password when provided', async () => {
      const professorData = {
        name: 'Test',
        surname: 'User',
        email: 'test2@ku.ac.th',
        department: 'Test Dept',
        password: 'CustomPass123!',
        createdBy: 'admin-id-123'
      }

      prisma.user.findUnique.mockResolvedValue(null)
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-999',
              name: 'Test',
              surname: 'User',
              email: 'test2@ku.ac.th',
              role: 'PROFESSOR',
              status: 'APPROVED',
              verified: true,
              createdAt: new Date()
            })
          },
          professor: {
            create: jest.fn().mockResolvedValue({
              id: 'prof-999',
              userId: 'user-999',
              department: 'Test Dept',
              phoneNumber: null,
              officeLocation: null,
              title: null,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        })
      })

      const result = await adminService.createProfessorUser(professorData)

      expect(generateSecurePassword).not.toHaveBeenCalled()
      expect(result.credentials).toBeUndefined()
      expect(hashPassword).toHaveBeenCalledWith('CustomPass123!')
    })

    it('should hash password before storage', async () => {
      const professorData = {
        name: 'Test',
        surname: 'User',
        email: 'test3@ku.ac.th',
        department: 'Test Dept',
        password: 'MyPassword123!',
        createdBy: 'admin-id-123'
      }

      prisma.user.findUnique.mockResolvedValue(null)
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-111',
              name: 'Test',
              surname: 'User',
              email: 'test3@ku.ac.th',
              role: 'PROFESSOR',
              status: 'APPROVED',
              verified: true,
              createdAt: new Date()
            })
          },
          professor: {
            create: jest.fn().mockResolvedValue({
              id: 'prof-111',
              userId: 'user-111',
              department: 'Test Dept',
              phoneNumber: null,
              officeLocation: null,
              title: null,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        })
      })

      await adminService.createProfessorUser(professorData)

      expect(hashPassword).toHaveBeenCalledWith('MyPassword123!')
    })

    it('should set user status to APPROVED', async () => {
      const professorData = {
        name: 'Test',
        surname: 'User',
        email: 'test4@ku.ac.th',
        department: 'Test Dept',
        createdBy: 'admin-id-123'
      }

      let createdUser = null
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockImplementation((data) => {
              createdUser = {
                id: 'user-222',
                ...data.data,
                createdAt: new Date()
              }
              return Promise.resolve(createdUser)
            })
          },
          professor: {
            create: jest.fn().mockResolvedValue({
              id: 'prof-222',
              userId: 'user-222',
              department: 'Test Dept',
              phoneNumber: null,
              officeLocation: null,
              title: null,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        })
      })

      const result = await adminService.createProfessorUser(professorData)

      expect(result.user.status).toBe('APPROVED')
    })

    it('should set user verified to true', async () => {
      const professorData = {
        name: 'Test',
        surname: 'User',
        email: 'test5@ku.ac.th',
        department: 'Test Dept',
        createdBy: 'admin-id-123'
      }

      prisma.user.findUnique.mockResolvedValue(null)
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-333',
              name: 'Test',
              surname: 'User',
              email: 'test5@ku.ac.th',
              role: 'PROFESSOR',
              status: 'APPROVED',
              verified: true,
              createdAt: new Date()
            })
          },
          professor: {
            create: jest.fn().mockResolvedValue({
              id: 'prof-333',
              userId: 'user-333',
              department: 'Test Dept',
              phoneNumber: null,
              officeLocation: null,
              title: null,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        })
      })

      const result = await adminService.createProfessorUser(professorData)

      expect(result.user.verified).toBe(true)
    })

    it('should handle email sending failure gracefully', async () => {
      const professorData = {
        name: 'Test',
        surname: 'User',
        email: 'test6@ku.ac.th',
        department: 'Test Dept',
        createdBy: 'admin-id-123'
      }

      sendProfessorWelcomeEmail.mockRejectedValue(new Error('Email service unavailable'))
      
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-444',
              name: 'Test',
              surname: 'User',
              email: 'test6@ku.ac.th',
              role: 'PROFESSOR',
              status: 'APPROVED',
              verified: true,
              createdAt: new Date()
            })
          },
          professor: {
            create: jest.fn().mockResolvedValue({
              id: 'prof-444',
              userId: 'user-444',
              department: 'Test Dept',
              phoneNumber: null,
              officeLocation: null,
              title: null,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        })
      })

      // Should not throw error even if email fails
      const result = await adminService.createProfessorUser(professorData)

      expect(result).toBeDefined()
      expect(result.emailSent).toBe(false)
    })

    it('should return temporary password only if auto-generated', async () => {
      const professorDataWithPassword = {
        name: 'Test',
        surname: 'User',
        email: 'test7@ku.ac.th',
        department: 'Test Dept',
        password: 'CustomPass123!',
        createdBy: 'admin-id-123'
      }

      prisma.user.findUnique.mockResolvedValue(null)
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue({
              id: 'user-555',
              name: 'Test',
              surname: 'User',
              email: 'test7@ku.ac.th',
              role: 'PROFESSOR',
              status: 'APPROVED',
              verified: true,
              createdAt: new Date()
            })
          },
          professor: {
            create: jest.fn().mockResolvedValue({
              id: 'prof-555',
              userId: 'user-555',
              department: 'Test Dept',
              phoneNumber: null,
              officeLocation: null,
              title: null,
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        })
      })

      const result = await adminService.createProfessorUser(professorDataWithPassword)

      expect(result.credentials).toBeUndefined()
    })
  })

  describe('Error cases', () => {
    it('should throw error for duplicate email', async () => {
      const professorData = {
        name: 'Test',
        surname: 'User',
        email: 'duplicate@ku.ac.th',
        department: 'Test Dept',
        createdBy: 'admin-id-123'
      }

      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'duplicate@ku.ac.th'
      })

      await expect(adminService.createProfessorUser(professorData)).rejects.toThrow('Email already registered')
    })

    it('should throw error with status code 409 for duplicate email', async () => {
      const professorData = {
        name: 'Test',
        surname: 'User',
        email: 'duplicate2@ku.ac.th',
        department: 'Test Dept',
        createdBy: 'admin-id-123'
      }

      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user-2',
        email: 'duplicate2@ku.ac.th'
      })

      try {
        await adminService.createProfessorUser(professorData)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error.statusCode).toBe(409)
      }
    })
  })
})
