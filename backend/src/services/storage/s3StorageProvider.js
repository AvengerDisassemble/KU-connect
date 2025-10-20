/**
 * @module services/storage/s3StorageProvider
 * @description AWS S3 storage provider implementation
 */

const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { v4: uuidv4 } = require('uuid')
const mime = require('mime-types')
const path = require('path')
const StorageProvider = require('./storageProvider')

/**
 * AWS S3 storage provider
 * Requires env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME
 */
class S3StorageProvider extends StorageProvider {
  constructor() {
    super()
    
    // Validate required environment variables
    const requiredEnvVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_BUCKET_NAME']
    const missing = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missing.length > 0) {
      throw new Error(`S3 provider missing required environment variables: ${missing.join(', ')}`)
    }
    
    this.bucketName = process.env.AWS_BUCKET_NAME
    this.client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    })
  }

  /**
   * Upload file to S3
   * @param {Buffer} buffer - File data buffer
   * @param {string} filename - Original filename
   * @param {string} mimeType - MIME type
   * @param {string} userId - User ID
   * @param {Object} options - Upload options
   * @param {string} [options.prefix='avatars'] - Storage prefix
   * @returns {Promise<string>} S3 object key
   */
  async uploadFile(buffer, filename, mimeType, userId, options = {}) {
    const prefix = options.prefix || 'avatars'
    
    // Derive extension from mime type
    let ext = mime.extension(mimeType)
    if (!ext) {
      ext = path.extname(filename).substring(1)
    }
    
    // Generate S3 key
    const uniqueFilename = `${uuidv4()}.${ext}`
    const key = `${prefix}/${uniqueFilename}`
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000' // 1 year cache
    })
    
    await this.client.send(command)
    
    return key
  }

  /**
   * Get signed URL for S3 object (valid for 5 minutes)
   * @param {string} fileKey - S3 object key
   * @returns {Promise<string>} Signed URL
   */
  async getFileUrl(fileKey) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey
    })
    
    // Generate signed URL valid for 300 seconds (5 minutes)
    const signedUrl = await getSignedUrl(this.client, command, { expiresIn: 300 })
    
    return signedUrl
  }

  /**
   * Delete file from S3
   * @param {string} fileKey - S3 object key
   * @returns {Promise<void>}
   */
  async deleteFile(fileKey) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey
    })
    
    await this.client.send(command)
  }
}

module.exports = S3StorageProvider

