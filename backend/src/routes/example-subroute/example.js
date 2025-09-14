/**
 * Example subroute for demonstration purposes
 * @module routes/example-subroute/example
 */

const express = require('express')
const router = express.Router()

// Why: Demonstrates a GET endpoint in a subroute folder
router.get('/', (req, res) => {
	res.json({ message: 'This is an example subroute!' })
})

router.get('/yes', (req, res) => {
	res.json({ message: 'This is an example subsubroute!' })
})

module.exports = router
