/**
 * @module app
 * Main application setup with middleware and route mounting.
 */

// In your app.js file, add:

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
require('dotenv').config()

const app = express()
const routes = require('./routes')

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(cors())

// Mount all routes under /api
app.use('/api', routes)

// Error handling middleware (should be last)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

module.exports = app
