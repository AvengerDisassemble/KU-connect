/**
 * @module services/storageFactory
 * @description Factory for creating storage provider instances based on environment configuration
 */

const LocalStorageProvider = require('./storage/localStorageProvider')
const S3StorageProvider = require('./storage/s3StorageProvider')

/**
 * Create and return storage provider instance
 * Reads STORAGE_PROVIDER env variable ('local' | 's3')
 * Defaults to 'local' if not set
 * @returns {StorageProvider} Storage provider instance
 */
function createStorageProvider() {
  const providerType = process.env.STORAGE_PROVIDER || 'local'
  
  switch (providerType.toLowerCase()) {
    case 's3':
      console.info('Using S3 storage provider')
      return new S3StorageProvider()
    case 'local':
    default:
      console.info('Using local file system storage provider')
      return new LocalStorageProvider()
  }
}

// Export singleton instance
module.exports = createStorageProvider()

