/**
 * Example of how to integrate profile routes into app.js
 */

// In your app.js file, add:

const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
require('dotenv').config()

const app = express()
const profileRoutes = require('../src/routes/profile.routes')
const degreeTypeRoutes = require('../src/routes/degreeType.routes')  

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))
app.use(cors())

// Mount profile routes

app.use('/api/', profileRoutes)
app.use('/api/', degreeTypeRoutes)

// Error handling middleware (should be last)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

module.exports = app
