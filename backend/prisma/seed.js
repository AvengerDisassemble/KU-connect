/**
 * @file prisma/seed.js
 * @description Seeds default admin, HR, student, and degree types
 */

const prisma = require("../src/models/prisma")

async function main () {
  console.log('🌱 Seeding base data...')

  // Degree Types
  const degreeTypes = ['Bachelor', 'Master', 'Doctor']
  for (const name of degreeTypes) {
    await prisma.degreeType.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  // Admin
  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123', // 🔒 replace with bcrypt if you have password hashing
      name: 'System',
      surname: 'Administrator',
      email: 'admin@kuconnect.local',
      verified: true,
      admin: { create: {} }
    }
  })

  // HR
  const hrUser = await prisma.user.upsert({
    where: { username: 'hr1' },
    update: {},
    create: {
      username: 'hr1',
      password: 'hr123',
      name: 'Harry',
      surname: 'Recruiter',
      email: 'hr1@company.com',
      verified: true,
      hr: {
        create: {
          companyName: 'Acme Corporation',
          description: 'Tech company hiring interns',
          address: 'Bangkok',
          industry: 'IT_SOFTWARE',
          companySize: 'ELEVEN_TO_FIFTY',
          website: 'https://acme.co'
        }
      }
    }
  })

  // Student
  const degree = await prisma.degreeType.findFirst({ where: { name: 'Bachelor' } })
  await prisma.user.upsert({
    where: { username: 'student1' },
    update: {},
    create: {
      username: 'student1',
      password: 'student123',
      name: 'Student',
      surname: 'Example',
      email: 'student1@ku.ac.th',
      verified: true,
      student: {
        create: {
          degreeTypeId: degree.id,
          address: 'Kasetsart University',
          gpa: 3.25,
          expectedGraduationYear: 2026
        }
      }
    }
  })

  console.log('✅ Seeding completed successfully.')
}

main()
  .catch(err => {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
