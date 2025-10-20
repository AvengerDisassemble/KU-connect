/**
 * @module services/storage/storageProvider
 * @description Abstract base class defining the storage provider interface
 */

/**
 * Abstract storage provider interface
 * Concrete implementations must override all async methods
 */
class StorageProvider {
  /**
   * Upload a file buffer to storage
   * @param {Buffer} buffer - File data buffer
   * @param {string} filename - Original filename
   * @param {string} mimeType - MIME type of the file
   * @param {string} userId - User ID for context/logging
   * @param {Object} options - Upload options
   * @param {string} [options.prefix='avatars'] - Prefix for file storage (avatars|resumes|transcripts|employer-docs)
   * @returns {Promise<string>} File key (provider-specific identifier)
   */
  async uploadFile(buffer, filename, mimeType, userId, options = {}) {
    throw new Error('uploadFile must be implemented by subclass')
  }

  /**
   * Get accessible URL for a file
   * @param {string} fileKey - File key returned from uploadFile
   * @returns {Promise<string>} Accessible URL (signed for S3, direct for local)
   */
  async getFileUrl(fileKey) {
    throw new Error('getFileUrl must be implemented by subclass')
  }

  /**
   * Delete a file by key
   * @param {string} fileKey - File key to delete
   * @returns {Promise<void>}
   */
  async deleteFile(fileKey) {
    throw new Error('deleteFile must be implemented by subclass')
  }
}

module.exports = StorageProvider

