const { PrismaClient } = require('../src/generated/prisma')

const prisma = new PrismaClient()

async function seedDegreeTypes () {
  try {
    // Create sample degree types
    const degreeTypes = [
      { name: 'Computer Science' },
      { name: 'Information Technology' },
      { name: 'Software Engineering' },
      { name: 'Business Administration' },
      { name: 'Marketing' },
      { name: 'Finance' },
      { name: 'Mechanical Engineering' },
      { name: 'Electrical Engineering' },
      { name: 'Civil Engineering' },
      { name: 'Psychology' },
      { name: 'Communications' },
      { name: 'Graphic Design' }
    ]

    for (const degreeType of degreeTypes) {
      // Check if degree type already exists
      const existing = await prisma.degreeType.findFirst({
        where: { name: degreeType.name }
      })

      if (!existing) {
        await prisma.degreeType.create({
          data: degreeType
        })
        console.log(`Created degree type: ${degreeType.name}`)
      } else {
        console.log(`Degree type already exists: ${degreeType.name}`)
      }
    }

    console.log('✅ Degree types seeded successfully')
  } catch (error) {
    console.error('❌ Error seeding degree types:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDegreeTypes()