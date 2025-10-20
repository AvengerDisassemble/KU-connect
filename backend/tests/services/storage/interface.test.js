/**
 * @module tests/services/storage/interface.test
 * @description Test that all storage providers implement the required interface
 */

// Check if dependencies are available
let StorageProvider, LocalStorageProvider, S3StorageProvider
let depsAvailable = true

try {
  StorageProvider = require('../../../src/services/storage/storageProvider')
  LocalStorageProvider = require('../../../src/services/storage/localStorageProvider')
  S3StorageProvider = require('../../../src/services/storage/s3StorageProvider')
} catch (error) {
  console.warn('Skipping storage interface tests - dependencies not installed. Run: npm install uuid mime-types @aws-sdk/client-s3 @aws-sdk/s3-request-presigner')
  depsAvailable = false
}

const describeIfDepsAvailable = depsAvailable ? describe : describe.skip

describeIfDepsAvailable('Storage Provider Interface', () => {
  describe('Base StorageProvider', () => {
    const provider = new StorageProvider()

    test('should throw error on uploadFile', async () => {
      await expect(provider.uploadFile(Buffer.from('test'), 'test.txt', 'text/plain', 'user123'))
        .rejects
        .toThrow('uploadFile must be implemented by subclass')
    })

    test('should throw error on getFileUrl', async () => {
      await expect(provider.getFileUrl('test-key'))
        .rejects
        .toThrow('getFileUrl must be implemented by subclass')
    })

    test('should throw error on deleteFile', async () => {
      await expect(provider.deleteFile('test-key'))
        .rejects
        .toThrow('deleteFile must be implemented by subclass')
    })
  })

  describe('LocalStorageProvider', () => {
    const provider = new LocalStorageProvider()

    test('should implement uploadFile method', () => {
      expect(typeof provider.uploadFile).toBe('function')
    })

    test('should implement getFileUrl method', () => {
      expect(typeof provider.getFileUrl).toBe('function')
    })

    test('should implement deleteFile method', () => {
      expect(typeof provider.deleteFile).toBe('function')
    })

    test('should be instance of StorageProvider', () => {
      expect(provider).toBeInstanceOf(StorageProvider)
    })
  })

  describe('S3StorageProvider', () => {
    // Only test if env vars are set
    const hasS3Config = process.env.AWS_ACCESS_KEY_ID &&
                        process.env.AWS_SECRET_ACCESS_KEY &&
                        process.env.AWS_REGION &&
                        process.env.AWS_BUCKET_NAME

    if (!hasS3Config) {
      test.skip('S3 tests skipped - missing AWS environment variables', () => {})
      return
    }

    const provider = new S3StorageProvider()

    test('should implement uploadFile method', () => {
      expect(typeof provider.uploadFile).toBe('function')
    })

    test('should implement getFileUrl method', () => {
      expect(typeof provider.getFileUrl).toBe('function')
    })

    test('should implement deleteFile method', () => {
      expect(typeof provider.deleteFile).toBe('function')
    })

    test('should be instance of StorageProvider', () => {
      expect(provider).toBeInstanceOf(StorageProvider)
    })
  })
})

