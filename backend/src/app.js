/**
 * @module app
 */
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const path = require('path')
const routes = require('./routes')
const { errorHandler } = require('./middlewares/errorHandler')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// Mount API routes
app.use('/api', routes)

// Global error handler (must be last)
app.use(errorHandler)

module.exports = app
