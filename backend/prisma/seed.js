/**
 * @file prisma/seed.js
 * @description Seeds default admin, HR, student, and degree types for KU Connect
 */

const bcrypt = require("bcrypt");
const prisma = require("../src/models/prisma");

async function main() {
  console.log("🌱 Seeding base data...");

  // ----------------------------------------------------------
  // 1️⃣ Seed Degree Types
  // ----------------------------------------------------------
  const degreeNames = ["Bachelor", "Master", "Doctor"];
  for (const name of degreeNames) {
    await prisma.degreeType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("🎓 Degree types seeded");

  // ----------------------------------------------------------
  // 2️⃣ Seed Admin User
  // ----------------------------------------------------------
  const password = await bcrypt.hash("Password123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@kuconnect.local" },
    update: {},
    create: {
      name: "System",
      surname: "Administrator",
      username: "admin",
      password: password,
      email: "admin@kuconnect.local",
      role: "ADMIN",
      verified: true,
      admin: { create: {} },
    },
  });
  console.log(`👑 Admin created: ${adminUser.email}`);

  // ----------------------------------------------------------
  // 3️⃣ Seed HR User (Employer)
  // ----------------------------------------------------------
  const hrUser = await prisma.user.upsert({
    where: { email: "hr1@company.com" },
    update: {},
    create: {
      name: "Harry",
      surname: "Recruiter",
      username: "hr1",
      password: password,
      email: "hr1@company.com",
      role: "EMPLOYER",
      verified: true,
      hr: {
        create: {
          companyName: "Acme Corporation",
          description: "Tech company hiring interns",
          address: "Bangkok, Thailand",
          industry: "IT_SOFTWARE",
          companySize: "ELEVEN_TO_FIFTY",
          phoneNumber: "123-456-7890",
          website: "https://acme.co",
        },
      },
    },
  });
  console.log(`🏢 HR created: ${hrUser.email}`);

  // ----------------------------------------------------------
  // 4️⃣ Seed Student User
  // ----------------------------------------------------------
  const bachelor = await prisma.degreeType.findUnique({
    where: { name: "Bachelor" },
  });

  if (!bachelor) {
    throw new Error(
      "Bachelor degree type not found. Ensure degree types are seeded first.",
    );
  }

  const studentUser = await prisma.user.upsert({
    where: { email: "student1@ku.ac.th" },
    update: {},
    create: {
      name: "Student",
      surname: "Example",
      username: "student1",
      password: password,
      email: "student1@ku.ac.th",
      role: "STUDENT",
      verified: true,
      student: {
        create: {
          degreeTypeId: bachelor.id,
          address: "Kasetsart University, Bangkok",
          gpa: 3.25,
          expectedGraduationYear: 2026,
        },
      },
    },
  });
  console.log(`🎓 Student created: ${studentUser.email}`);

  console.log("\n✅ All seed data created successfully.");
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
