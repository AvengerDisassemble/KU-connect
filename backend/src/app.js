/**
 * Example of how to integrate profile routes into app.js
 */

// In your app.js file, add:

const express = require('express')
const app = express()
const profileRoutes = require('../src/routes/profile')
const degreeTypeRoutes = require('../src/routes/degreeType')  

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Mount profile routes
app.use('/', profileRoutes)
app.use('/', degreeTypeRoutes)

// Error handling middleware (should be last)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Something went wrong!' })
})

module.exports = app
