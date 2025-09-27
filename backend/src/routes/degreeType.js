/**
 * DegreeType API Routes
 * @module routes/degreeType
 */

const express = require('express')
const router = express.Router()
const prisma = require('../models/prisma')

/**
 * GET /degree-types
 * Fetch all available degree types.
 */
router.get('/degree-types', async (req, res) => {
  try {
    const degreeTypes = await prisma.degreeType.findMany()
    res.status(200).json(degreeTypes)
  } catch (error) {
    console.error('Error fetching degree types:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

/**
 * POST /degree-types
 * Create a new degree type.
 *
 * Request Body:
 * {
 *   "name": "Bachelor"
 * }
 */
router.post('/degree-types', async (req, res) => {
  const { name } = req.body
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name is required and must be a string' })
  }

  try {
    // Ensure uniqueness of degree type name
    const existing = await prisma.degreeType.findFirst({ where: { name } })
    if (existing) {
      return res.status(409).json({ error: 'Degree type already exists' })
    }

    const degreeType = await prisma.degreeType.create({
      data: { name }
    })

    res.status(201).json(degreeType)
  } catch (error) {
    console.error('Error creating degree type:', error)
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

module.exports = router
