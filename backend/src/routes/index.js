/**
 * Main API router
 * @module routes/index
 */
const express = require('express')
const fs = require('fs')
const path = require('path')

const router = express.Router()

// Why: Automatically register all routes in this folder and subfolders
const routesDir = __dirname

/**
 * Recursively registers all route files in the given directory and its subdirectories.
 * Each .js file (except index.js) is mounted as an Express router at /api/<folder>/<file>.
 * Why: Enables automatic folder-based routing for modular route organization.
 * @param {string} dir - Directory to scan for route files
 * @param {string} [baseRoute] - Base route path for nested folders
 */
function registerRoutes(dir, baseRoute = '') {
	fs.readdirSync(dir).forEach(file => {
		const fullPath = path.join(dir, file)
		const stat = fs.statSync(fullPath)
		if (stat.isDirectory()) {
			registerRoutes(fullPath, baseRoute + '/' + file)
		} else if (file !== 'index.js' && file.endsWith('.js')) {
			// Why: Remove .js extension for route path
			const routeName = path.basename(file, '.js')
			router.use(baseRoute + '/' + routeName, require(fullPath))
		}
	})
}

registerRoutes(routesDir)

module.exports = router
