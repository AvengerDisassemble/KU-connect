/**
 * Server entry point
 * @module server
 */
require('dotenv').config()
const app = require('./src/app')
const express = require('express')
const path = require('path')

const PORT = process.env.PORT || 3000

// Serve static files from uploads directory in development (for local storage provider)
if (process.env.STORAGE_PROVIDER === 'local' && process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
  console.info('Static file serving enabled for /uploads directory')
}

app.listen(PORT, () => {
  // Use console.info for startup logs (StandardJS allows)
  console.info(`Server running on port ${PORT}`)
})

