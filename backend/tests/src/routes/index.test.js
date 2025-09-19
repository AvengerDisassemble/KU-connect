/**
 * Tests for the main routing system
 * @module tests/routes/index
 */

const request = require('supertest')
const express = require('express')
const path = require('path')
const fs = require('fs-extra')
const { expect } = require('chai')

// Create a temporary test app for each test
let app

describe('Router Registration System', () => {
  beforeEach(() => {
    // Create fresh Express app for each test
    app = express()
    
    // Get the router from the main routes file
    const mainRouter = require('../../../src/routes')
    app.use('/api', mainRouter)
  })

  describe('Basic Route Functionality', () => {
    it('should respond to example route', async () => {
      const response = await request(app)
        .get('/api/example')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).to.have.property('message')
      expect(response.body.message).to.equal('This is an example route!')
    })

    it('should return 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/non-existent-route')
        .expect(404)
    })
  })

  describe('Route Registration', () => {
    let routesDir
    let registeredRoutes = []

    before(() => {
      routesDir = path.join(__dirname, '../../../src/routes')
      
      // Capture all registered routes by walking the directory
      function captureRoutes(dir, baseRoute = '') {
        fs.readdirSync(dir).forEach(file => {
          const fullPath = path.join(dir, file)
          const stat = fs.statSync(fullPath)
          
          if (stat.isDirectory()) {
            captureRoutes(fullPath, `${baseRoute}/${file}`)
          } else if (file.endsWith('.js') && file !== 'index.js') {
            const routeName = path.basename(file, '.js')
            registeredRoutes.push(`${baseRoute}/${routeName}`)
          }
        })
      }

      captureRoutes(routesDir)
    })

    it('should register all routes in the routes directory', async () => {
      // Test each registered route
      for (const route of registeredRoutes) {
        const response = await request(app)
          .get(`/api${route}`)
          .expect('Content-Type', /json/)
          
        expect(response.status).to.be.oneOf([200, 404, 401], 
          `Route ${route} should return a valid status code`)
      }
    })

    it('should properly handle nested routes', async () => {
      // Test the example-subroute endpoint if it exists
      const response = await request(app)
        .get('/api/example-subroute/example')
        .expect('Content-Type', /json/)
        
      expect(response.status).to.be.oneOf([200, 404, 401],
        'Nested route should return a valid status code')
    })
  })

  describe('Database Example Routes', () => {
    it('should handle database example routes', async () => {
      const response = await request(app)
        .get('/api/example-database-usage')
        .expect('Content-Type', /json/)
        
      expect(response.status).to.be.oneOf([200, 404, 401],
        'Database example route should return a valid status code')
    })
  })
})
