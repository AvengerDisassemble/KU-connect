/**
 * Example subroute for database usage demonstration purposes
 * @module routes/example-database-usage/index
 */
const { PrismaClient } = require('../../generated/prisma')

const prisma = new PrismaClient()

const express = require('express')
const router = express.Router()

// Function to create an example professor type user in the database if not exists
async function createExampleProfessorUser() {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { username: 'prof.johndoe' }
        })
        if (!existingUser) {
            const user = await prisma.user.create({
                data: {
                    name: 'John',
                    surname: 'Doe',
                    username: 'prof.johndoe',
                    password: 'testpassword',
                    verified: false,
                    professor: {
                        create: {
                            department: 'Computer Science'
                        }
                    }
                },
                include: { professor: true }
            })
            console.log('Created professor user:', user)
        } else {
            console.log('Professor user already exists:', existingUser)
        }
    } catch (error) {
        console.error('Error creating professor user:', error)
        throw error
    }
}

// Why: Demonstrates a GET endpoint that interacts with the database
router.get('/', async (req, res) => {
    try {
        const users = await prisma.user.findMany()
        res.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

router.get('/create-professor', async (req, res) => {
    try {
        await createExampleProfessorUser()
        res.status(201).json({ message: 'Professor user created successfully' })
    } catch (error) {
        console.error('Error creating professor user:', error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
})

module.exports = router