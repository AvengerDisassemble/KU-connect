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
      email: 'admin@kuconnect.local',
      role: 'ADMIN',
      status: 'APPROVED',
      verified: true,
      admin: { create: {} },
    },
  });
  console.log(`👑 Admin created: ${adminUser.email}`);

  // ----------------------------------------------------------
  // 3️⃣ Skip single HR user creation - will create 10 employers below
  // ----------------------------------------------------------
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr1@company.com' },
    update: {},
    create: {
      name: 'Harry',
      surname: 'Recruiter',
      username: 'hr1',
      password: password,
      email: 'hr1@company.com',
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName: 'Acme Corporation',
          description: 'Tech company hiring interns',
          address: 'Bangkok, Thailand',
          industry: 'IT_SOFTWARE',
          companySize: 'ELEVEN_TO_FIFTY',
          phoneNumber: '123-456-7890',
          website: 'https://acme.co'
        }
      }
    }
  })
  console.log(`🏢 HR created: ${hrUser.email}`)

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
      email: 'student1@ku.ac.th',
      role: 'STUDENT',
      status: 'APPROVED',
      verified: true,
      student: {
        create: {
          degreeTypeId: bachelor.id,
          address: "Kasetsart University, Bangkok",
          gpa: 3.25,
          expectedGraduationYear: 2026
        }
      }
    }
  })
  console.log(`🎓 Student created: ${studentUser.email}`)

  // ----------------------------------------------------------
  // 5️⃣ Seed 10 Employers with Diverse Industries
  // ----------------------------------------------------------
  const companies = [
    {
      email: 'hr1@company.com',
      username: 'hr_techcorp',
      name: 'Sarah',
      surname: 'Johnson',
      companyName: 'TechCorp Solutions',
      description: 'Leading software development company specializing in enterprise solutions',
      address: 'Chatuchak, Bangkok',
      industry: 'IT_SOFTWARE',
      companySize: 'TWO_HUNDRED_PLUS',
      website: 'https://techcorp.com',
      phoneNumber: '02-234-5678'
    },
    {
      email: 'hr2@company.com',
      username: 'hr_innovateai',
      name: 'David',
      surname: 'Park',
      companyName: 'InnovateAI Labs',
      description: 'Cutting-edge AI and machine learning research company',
      address: 'Rama IV, Bangkok',
      industry: 'EMERGING_TECH',
      companySize: 'ELEVEN_TO_FIFTY',
      website: 'https://innovateai.com',
      phoneNumber: '02-567-8901'
    },
    {
      email: 'hr3@company.com',
      username: 'hr_digitalwave',
      name: 'Michael',
      surname: 'Chen',
      companyName: 'Digital Wave Marketing',
      description: 'Full-service digital marketing and e-commerce agency',
      address: 'Sukhumvit, Bangkok',
      industry: 'E_COMMERCE',
      companySize: 'FIFTY_ONE_TO_TWO_HUNDRED',
      website: 'https://digitalwave.com',
      phoneNumber: '02-345-6789'
    },
    {
      email: 'hr4@company.com',
      username: 'hr_cloudnet',
      name: 'Emily',
      surname: 'Wang',
      companyName: 'CloudNet Services',
      description: 'Enterprise cloud infrastructure and network solutions provider',
      address: 'Silom, Bangkok',
      industry: 'NETWORK_SERVICES',
      companySize: 'ELEVEN_TO_FIFTY',
      website: 'https://cloudnet.com',
      phoneNumber: '02-456-7890'
    },
    {
      email: 'hr5@company.com',
      username: 'hr_hardware',
      name: 'James',
      surname: 'Wilson',
      companyName: 'TechHardware Pro',
      description: 'IT hardware distributor and systems integrator',
      address: 'Lat Phrao, Bangkok',
      industry: 'IT_HARDWARE_AND_DEVICES',
      companySize: 'TWO_HUNDRED_PLUS',
      website: 'https://techhardware.com',
      phoneNumber: '02-678-9012'
    },
    {
      email: 'hr6@company.com',
      username: 'hr_itservices',
      name: 'Lisa',
      surname: 'Anderson',
      companyName: 'Prime IT Services',
      description: 'Comprehensive IT consulting and managed services',
      address: 'Phra Khanong, Bangkok',
      industry: 'IT_SERVICES',
      companySize: 'FIFTY_ONE_TO_TWO_HUNDRED',
      website: 'https://primeit.com',
      phoneNumber: '02-789-0123'
    },
    {
      email: 'hr7@company.com',
      username: 'hr_shopmart',
      name: 'Rachel',
      surname: 'Martinez',
      companyName: 'ShopMart Online',
      description: 'Leading e-commerce platform for consumer goods',
      address: 'Thonglor, Bangkok',
      industry: 'E_COMMERCE',
      companySize: 'TWO_HUNDRED_PLUS',
      website: 'https://shopmart.com',
      phoneNumber: '02-890-1234'
    },
    {
      email: 'hr8@company.com',
      username: 'hr_startuplab',
      name: 'Alex',
      surname: 'Thompson',
      companyName: 'StartupLab Ventures',
      description: 'Technology incubator and startup accelerator',
      address: 'Ari, Bangkok',
      industry: 'EMERGING_TECH',
      companySize: 'ONE_TO_TEN',
      website: 'https://startuplab.com',
      phoneNumber: '02-901-2345'
    },
    {
      email: 'hr9@company.com',
      username: 'hr_datacore',
      name: 'Sophie',
      surname: 'Lee',
      companyName: 'DataCore Analytics',
      description: 'Big data analytics and business intelligence solutions',
      address: 'Asoke, Bangkok',
      industry: 'IT_SOFTWARE',
      companySize: 'ELEVEN_TO_FIFTY',
      website: 'https://datacore.com',
      phoneNumber: '02-012-3456'
    },
    {
      email: 'hr10@company.com',
      username: 'hr_globaltech',
      name: 'Marcus',
      surname: 'Brown',
      companyName: 'GlobalTech Consulting',
      description: 'International technology consulting and solutions',
      address: 'Sathorn, Bangkok',
      industry: 'IT_SERVICES',
      companySize: 'TWO_HUNDRED_PLUS',
      website: 'https://globaltech.com',
      phoneNumber: '02-123-4567'
    }
  ]

  const hrUsers = []
  for (const company of companies) {
    const { companyName, description, address, industry, companySize, website, phoneNumber, ...userData } = company
    const hr = await prisma.user.upsert({
    where: { email: userData.email },
    update: {},
    create: {
      ...userData,
      password: password,
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName,
          description,
          address,
          industry,
          companySize,
          website,
          phoneNumber
        }
      }
    }
  })
  hrUsers.push(hr)
  }

  console.log(`🏢 ${hrUsers.length} employers created`)

  // ----------------------------------------------------------
  // 6️⃣ Fetch HR data for all 10 companies
  // ----------------------------------------------------------
  const hrDataArray = []
  for (const hrUser of hrUsers) {
    const hrData = await prisma.hR.findUnique({ 
      where: { userId: hrUser.id },
      include: { user: true }
    })
    if (!hrData) {
      throw new Error(`Failed to find HR data for user ${hrUser.email}`)
    }
    hrDataArray.push(hrData)
  }

  // ----------------------------------------------------------
  // 7️⃣ Create 50 Jobs (5 per company) covering all preferences
  // ----------------------------------------------------------
  // Calculate dates
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  // Job templates - Realistic mix of job types, salaries, and work arrangements
  const jobTemplates = [
    // 1. Senior Full-time Hybrid (High salary)
    {
      title: 'Senior Software Engineer',
      description: 'Lead development of enterprise applications. Work with modern tech stack and mentor junior developers.',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Permanent',
      minSalary: 60000,
      maxSalary: 100000,
      deadline: in90Days,
      tags: ['Senior', 'Leadership', 'Full-stack', 'Architecture', 'Mentoring']
    },
    // 2. Mid-career Full-time Hybrid (Mid-high salary) ← NEW for your use case
    {
      title: 'Software Engineer',
      description: 'Develop and maintain software applications. Work in a collaborative hybrid environment with flexible schedule.',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Permanent',
      minSalary: 45000,
      maxSalary: 70000,
      deadline: in60Days,
      tags: ['Mid-level', 'Hybrid', 'Development', 'Full-time', 'Career Growth']
    },
    // 3. Mid-career Full-time Remote (Mid salary)
    {
      title: 'Remote Developer',
      description: 'Work remotely as a full-time developer. Build scalable applications and collaborate with distributed teams.',
      jobType: 'full-time',
      workArrangement: 'remote',
      duration: 'Permanent',
      minSalary: 42000,
      maxSalary: 65000,
      deadline: in60Days,
      tags: ['Mid-level', 'Remote', 'Full-time', 'Work from Home', 'Flexibility']
    },
    // 4. Junior Full-time On-site (Entry-mid salary)
    {
      title: 'Junior Developer',
      description: 'Start your career in software development. Learn from experienced team members in our office environment.',
      jobType: 'full-time',
      workArrangement: 'on-site',
      duration: 'Permanent',
      minSalary: 30000,
      maxSalary: 45000,
      deadline: in60Days,
      tags: ['Junior', 'Entry Level', 'On-site', 'Training', 'Career Start']
    },
    // 5. Internship Remote (Low salary)
    {
      title: 'Software Development Intern',
      description: 'Learn professional software development. Work on real projects with experienced mentors remotely.',
      jobType: 'internship',
      workArrangement: 'remote',
      duration: '3-6 months',
      minSalary: 10000,
      maxSalary: 18000,
      deadline: in45Days,
      tags: ['Internship', 'Entry Level', 'Learning', 'Remote', 'Student']
    },
    // 6. Internship Hybrid (Low salary)
    {
      title: 'Technical Intern',
      description: 'Hybrid internship combining office and remote work. Great for students looking for industry experience.',
      jobType: 'internship',
      workArrangement: 'hybrid',
      duration: '4-6 months',
      minSalary: 12000,
      maxSalary: 20000,
      deadline: in45Days,
      tags: ['Internship', 'Hybrid', 'Student', 'Learning', 'Experience']
    },
    // 7. Part-time Hybrid (Low-mid salary)
    {
      title: 'Part-Time Specialist',
      description: 'Flexible part-time role with hybrid work. Perfect for students or professionals seeking work-life balance.',
      jobType: 'part-time',
      workArrangement: 'hybrid',
      duration: 'Flexible',
      minSalary: 20000,
      maxSalary: 35000,
      deadline: in60Days,
      tags: ['Part-time', 'Flexible', 'Work-Life Balance', 'Students Welcome', 'Hybrid']
    },
    // 8. Part-time Remote (Low-mid salary)
    {
      title: 'Part-Time Remote Position',
      description: 'Work remotely on a part-time basis. Ideal for those seeking flexible work arrangements.',
      jobType: 'part-time',
      workArrangement: 'remote',
      duration: 'Flexible',
      minSalary: 18000,
      maxSalary: 30000,
      deadline: in60Days,
      tags: ['Part-time', 'Remote', 'Flexible Hours', 'Work from Home', 'Balance']
    },
    // 9. Contract Hybrid (Mid salary)
    {
      title: 'Contract Specialist',
      description: 'Fixed-term contract with hybrid arrangement. Gain experience on exciting projects.',
      jobType: 'contract',
      workArrangement: 'hybrid',
      duration: '1 year',
      minSalary: 38000,
      maxSalary: 58000,
      deadline: in30Days,
      tags: ['Contract', 'Hybrid', 'Project-based', 'Experience', 'Professional']
    },
    // 10. Contract On-site (Mid salary)
    {
      title: 'Contract On-site Role',
      description: 'On-site contract position. Work directly with the team on mission-critical projects.',
      jobType: 'contract',
      workArrangement: 'on-site',
      duration: '1 year',
      minSalary: 35000,
      maxSalary: 55000,
      deadline: in30Days,
      tags: ['Contract', 'On-site', 'Project-based', 'Team Collaboration', 'Experience']
    }
  ]

  const jobs = []
  
  // Create 5 jobs for each of the 10 companies
  for (let i = 0; i < hrDataArray.length; i++) {
    const hrData = hrDataArray[i]
    const companyName = hrData.companyName
    
    for (let j = 0; j < jobTemplates.length; j++) {
      const template = jobTemplates[j]
      
      // Customize job title based on industry
      let customTitle = template.title
      const industry = hrData.industry
      
      if (industry === 'IT_SOFTWARE' || industry === 'IT_SERVICES') {
        customTitle = template.title.replace('Specialist', 'Developer')
          .replace('Position', 'Software Engineer')
      } else if (industry === 'E_COMMERCE') {
        customTitle = template.title.replace('Developer', 'E-commerce Manager')
          .replace('Specialist', 'Marketing Specialist')
          .replace('Position', 'Digital Marketing Role')
      } else if (industry === 'NETWORK_SERVICES') {
        customTitle = template.title.replace('Developer', 'Network Engineer')
          .replace('Specialist', 'Systems Administrator')
          .replace('Position', 'Infrastructure Role')
      } else if (industry === 'EMERGING_TECH') {
        customTitle = template.title.replace('Developer', 'AI Engineer')
          .replace('Specialist', 'ML Specialist')
          .replace('Position', 'Research Role')
      } else if (industry === 'IT_HARDWARE_AND_DEVICES') {
        customTitle = template.title.replace('Developer', 'Hardware Technician')
          .replace('Specialist', 'Support Engineer')
          .replace('Position', 'Technical Role')
      }
      
      jobs.push({
        hrId: hrData.id,
        title: customTitle,
        companyName: companyName,
        description: template.description + ` Join ${companyName} and grow your career in ${industry.toLowerCase().replace(/_/g, ' ')}.`,
        location: 'Bangkok, Thailand (' + template.workArrangement.charAt(0).toUpperCase() + template.workArrangement.slice(1) + ')',
        jobType: template.jobType,
        workArrangement: template.workArrangement,
        duration: template.duration,
        minSalary: template.minSalary,
        maxSalary: template.maxSalary,
        application_deadline: template.deadline,
        email: hrData.user.email,
        phone_number: hrData.phoneNumber,
        requirements: [
          `Relevant degree or equivalent experience`,
          `Strong ${industry.includes('IT') ? 'technical' : 'professional'} skills`,
          `Good communication and teamwork`
        ],
        qualifications: [
          `Experience in ${industry.toLowerCase().replace(/_/g, ' ')} industry preferred`,
          `Problem-solving mindset`,
          `Passion for technology and innovation`
        ],
        responsibilities: [
          `Deliver high-quality work`,
          `Collaborate with team members`,
          `Contribute to project success`,
          `Continuous learning and improvement`
        ],
        benefits: [
          `Competitive salary`,
          `Health insurance`,
          `Professional development`,
          `Modern work environment`
        ],
        tags: template.tags
      })
    }
  }

  console.log(`📋 Prepared ${jobs.length} jobs`)

  // Create all jobs in database
  let jobCount = 0
  for (const jobData of jobs) {
    const { requirements, qualifications, responsibilities, benefits, tags, ...jobInfo } = jobData
    
    const job = await prisma.job.create({
      data: {
        ...jobInfo,
        requirements: {
          create: requirements.map(text => ({ text }))
        },
        qualifications: {
          create: qualifications.map(text => ({ text }))
        },
        responsibilities: {
          create: responsibilities.map(text => ({ text }))
        },
        benefits: {
          create: benefits.map(text => ({ text }))
        },
        tags: {
          connectOrCreate: tags.map(tagName => ({
            where: { name: tagName },
            create: { name: tagName }
          }))
        }
      }
    })
    jobCount++
  }

  console.log(`💼 ${jobCount} jobs created successfully`)

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
