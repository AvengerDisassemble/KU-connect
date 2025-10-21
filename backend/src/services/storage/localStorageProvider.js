/**
 * @module services/storage/localStorageProvider
 * @description Local file system storage provider implementation
 */

const fs = require('fs-extra')
const path = require('path')
const { v4: uuidv4 } = require('uuid')
const mime = require('mime-types')
const StorageProvider = require('./storageProvider')

/**
 * Local file system storage provider
 * Stores files in <project>/uploads/<prefix>/
 */
class LocalStorageProvider extends StorageProvider {
  constructor() {
    super()
    this.baseDir = path.join(process.cwd(), 'uploads')
  }

  /**
   * Upload file to local file system
   * @param {Buffer} buffer - File data buffer
   * @param {string} filename - Original filename
   * @param {string} mimeType - MIME type
   * @param {string} userId - User ID
   * @param {Object} options - Upload options
   * @param {string} [options.prefix='avatars'] - Storage prefix
   * @returns {Promise<string>} File key (includes prefix)
   */
  async uploadFile(buffer, filename, mimeType, userId, options = {}) {
    const prefix = options.prefix || 'avatars'
    
    // Derive extension from mime type (more secure than trusting filename)
    let ext = mime.extension(mimeType)
    if (!ext) {
      // Fallback to filename extension if mime lookup fails
      ext = path.extname(filename).substring(1)
    }
    
    // Generate unique filename
    const uniqueFilename = `${uuidv4()}.${ext}`
    const fileKey = `${prefix}/${uniqueFilename}`
    const fullPath = path.join(this.baseDir, fileKey)
    
    // Ensure directory exists
    await fs.ensureDir(path.dirname(fullPath))
    
    // Write file
    await fs.writeFile(fullPath, buffer)
    
    return fileKey
  }

  /**
   * Get URL for local file (assumes static serving is configured)
   * @param {string} fileKey - File key with prefix
   * @returns {Promise<string>} URL path
   */
  async getFileUrl(fileKey) {
    return `/uploads/${fileKey}`
  }

  /**
   * Get a readable stream for a file
   * @param {string} fileKey - File key to read
   * @returns {Promise<{stream: ReadableStream, mimeType: string, filename: string}>}
   */
  async getReadStream(fileKey) {
    const fullPath = path.join(this.baseDir, fileKey)
    
    // Check if file exists
    const exists = await fs.pathExists(fullPath)
    if (!exists) {
      throw new Error(`File not found: ${fileKey}`)
    }

    // Extract filename from path
    const filename = path.basename(fileKey)
    
    // Detect MIME type from extension
    const mimeType = mime.lookup(fullPath) || 'application/octet-stream'
    
    // Create read stream
    const stream = fs.createReadStream(fullPath)
    
    return { stream, mimeType, filename }
  }

  /**
   * Get signed download URL - not supported for local storage
   * @returns {Promise<null>}
   */
  async getSignedDownloadUrl(fileKey, expiresIn = 300) {
    // Local storage doesn't support signed URLs; files will be streamed
    return null
  }

  /**
   * Delete file from local storage
   * @param {string} fileKey - File key to delete
   * @returns {Promise<void>}
   */
  async deleteFile(fileKey) {
    const fullPath = path.join(this.baseDir, fileKey)
    // Don't throw if file doesn't exist
    await fs.remove(fullPath)
  }
}

module.exports = LocalStorageProvider

