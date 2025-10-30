/**
 * @module tests/services/storage/localStorageProvider.test
 * @description Test local file system storage provider
 */

const fs = require('fs-extra')
const path = require('path')

// Check if required dependencies are available
let LocalStorageProvider
try {
  LocalStorageProvider = require('../../../src/services/storage/localStorageProvider')
} catch (error) {
  console.warn('Skipping LocalStorageProvider tests - dependencies not installed. Run: npm install uuid mime-types')
}

const describeIfDepsAvailable = LocalStorageProvider ? describe : describe.skip

describeIfDepsAvailable('LocalStorageProvider', () => {
  let provider
  const testDir = path.join(process.cwd(), 'uploads-test')
  const originalCwd = process.cwd

  beforeAll(() => {
    // Mock process.cwd to use test directory
    process.cwd = () => path.dirname(testDir)
    provider = new LocalStorageProvider()
    // Override baseDir for testing
    provider.baseDir = testDir
  })

  afterAll(() => {
    process.cwd = originalCwd
  })

  afterEach(async () => {
    // Clean up test directory
    await fs.remove(testDir)
  })

  describe('uploadFile', () => {
    test('should upload file and return fileKey with prefix', async () => {
      const buffer = Buffer.from('test content')
      const fileKey = await provider.uploadFile(buffer, 'test.txt', 'text/plain', { prefix: 'avatars' })

      expect(fileKey).toMatch(/^avatars\/[a-f0-9-]+\.txt$/)
      
      // Verify file exists
      const fullPath = path.join(testDir, fileKey)
      const exists = await fs.pathExists(fullPath)
      expect(exists).toBe(true)

      // Verify content
      const content = await fs.readFile(fullPath, 'utf8')
      expect(content).toBe('test content')
    })

    test('should use default avatars prefix if not specified', async () => {
      const buffer = Buffer.from('avatar data')
      const fileKey = await provider.uploadFile(buffer, 'avatar.png', 'image/png')

      expect(fileKey).toMatch(/^avatars\/[a-f0-9-]+\.png$/)
    })

    test('should handle different prefixes', async () => {
      const buffer = Buffer.from('resume content')
      const fileKey = await provider.uploadFile(buffer, 'resume.pdf', 'application/pdf', { prefix: 'resumes' })

      expect(fileKey).toMatch(/^resumes\/[a-f0-9-]+\.pdf$/)
    })

    test('should derive extension from mime type', async () => {
      const buffer = Buffer.from('image data')
      const fileKey = await provider.uploadFile(buffer, 'unknown', 'image/jpeg', { prefix: 'avatars' })

      // mime-types library returns .jpg for image/jpeg
      expect(fileKey).toMatch(/^avatars\/[a-f0-9-]+\.(jpg|jpeg)$/)
    })
  })

  describe('getFileUrl', () => {
    test('should return correct URL path', async () => {
      const fileKey = 'avatars/test-uuid.png'
      const url = await provider.getFileUrl(fileKey)

      expect(url).toBe('/uploads/avatars/test-uuid.png')
    })
  })

  describe('deleteFile', () => {
    test('should delete existing file', async () => {
      const buffer = Buffer.from('to be deleted')
      const fileKey = await provider.uploadFile(buffer, 'delete-me.txt', 'text/plain', 'user202', { prefix: 'test' })

      const fullPath = path.join(testDir, fileKey)
      let exists = await fs.pathExists(fullPath)
      expect(exists).toBe(true)

      await provider.deleteFile(fileKey)

      exists = await fs.pathExists(fullPath)
      expect(exists).toBe(false)
    })

    test('should not throw error if file does not exist', async () => {
      await expect(provider.deleteFile('non-existent/file.txt')).resolves.not.toThrow()
    })
  })
})

