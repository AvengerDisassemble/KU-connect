/**
 * @file prisma/seed.js
 * @description Seeds default admin, HR, student, and degree types for KU Connect
 */

const bcrypt = require('bcrypt')
const prisma = require('../src/models/prisma')

async function main() {
  console.log('🌱 Seeding base data...')

  // ----------------------------------------------------------
  // 1️⃣ Seed Degree Types
  // ----------------------------------------------------------
  const degreeNames = ['Bachelor', 'Master', 'Doctor']
  for (const name of degreeNames) {
    await prisma.degreeType.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }
  console.log('🎓 Degree types seeded')

  // ----------------------------------------------------------
  // 2️⃣ Seed Admin User
  // ----------------------------------------------------------
  const password = await bcrypt.hash('Password123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kuconnect.local' },
    update: {},
    create: {
      name: 'System',
      surname: 'Administrator',
      username: 'admin',
      password: password,
      email: 'admin@kuconnect.local',
      role: 'ADMIN',
      status: 'APPROVED',
      verified: true,
      admin: { create: {} }
    }
  })
  console.log(`👑 Admin created: ${adminUser.email}`)

  // ----------------------------------------------------------
  // 3️⃣ Seed HR User (Employer)
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
  const bachelor = await prisma.degreeType.findUnique({ where: { name: 'Bachelor' } })

  if (!bachelor) {
    throw new Error('Bachelor degree type not found. Ensure degree types are seeded first.')
  }

  const studentUser = await prisma.user.upsert({
    where: { email: 'student1@ku.ac.th' },
    update: {},
    create: {
      name: 'Student',
      surname: 'Example',
      username: 'student1',
      password: password,
      email: 'student1@ku.ac.th',
      role: 'STUDENT',
      status: 'APPROVED',
      verified: true,
      student: {
        create: {
          degreeTypeId: bachelor.id,
          address: 'Kasetsart University, Bangkok',
          gpa: 3.25,
          expectedGraduationYear: 2026
        }
      }
    }
  })
  console.log(`🎓 Student created: ${studentUser.email}`)

  // ----------------------------------------------------------
  // 5️⃣ Seed Additional HR Users for Job Variety
  // ----------------------------------------------------------
  const hrUsers = []
  
  const hr2 = await prisma.user.upsert({
    where: { email: 'hr2@techcorp.com' },
    update: {},
    create: {
      name: 'Sarah',
      surname: 'Johnson',
      username: 'hr2',
      password: password,
      email: 'hr2@techcorp.com',
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName: 'TechCorp Solutions',
          description: 'Leading software development company',
          address: 'Chatuchak, Bangkok',
          industry: 'IT_SOFTWARE',
          companySize: 'TWO_HUNDRED_PLUS',
          website: 'https://techcorp.com',
          phoneNumber: '02-234-5678'
        }
      }
    }
  })
  hrUsers.push(hr2)

  const hr3 = await prisma.user.upsert({
    where: { email: 'hr3@digitalwave.com' },
    update: {},
    create: {
      name: 'Michael',
      surname: 'Chen',
      username: 'hr3',
      password: password,
      email: 'hr3@digitalwave.com',
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName: 'Digital Wave Marketing',
          description: 'Digital marketing and e-commerce solutions',
          address: 'Sukhumvit, Bangkok',
          industry: 'E_COMMERCE',
          companySize: 'FIFTY_ONE_TO_TWO_HUNDRED',
          website: 'https://digitalwave.com',
          phoneNumber: '02-345-6789'
        }
      }
    }
  })
  hrUsers.push(hr3)

  const hr4 = await prisma.user.upsert({
    where: { email: 'hr4@cloudnet.com' },
    update: {},
    create: {
      name: 'Emily',
      surname: 'Wang',
      username: 'hr4',
      password: password,
      email: 'hr4@cloudnet.com',
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName: 'CloudNet Services',
          description: 'Cloud infrastructure and network solutions',
          address: 'Silom, Bangkok',
          industry: 'NETWORK_SERVICES',
          companySize: 'ELEVEN_TO_FIFTY',
          website: 'https://cloudnet.com',
          phoneNumber: '02-456-7890'
        }
      }
    }
  })
  hrUsers.push(hr4)

  const hr5 = await prisma.user.upsert({
    where: { email: 'hr5@innovateai.com' },
    update: {},
    create: {
      name: 'David',
      surname: 'Park',
      username: 'hr5',
      password: password,
      email: 'hr5@innovateai.com',
      role: 'EMPLOYER',
      status: 'APPROVED',
      verified: true,
      hr: {
        create: {
          companyName: 'InnovateAI Labs',
          description: 'Artificial intelligence and machine learning research',
          address: 'Rama IV, Bangkok',
          industry: 'EMERGING_TECH',
          companySize: 'ELEVEN_TO_FIFTY',
          website: 'https://innovateai.com',
          phoneNumber: '02-567-8901'
        }
      }
    }
  })
  hrUsers.push(hr5)

  console.log(`🏢 ${hrUsers.length + 1} HR users created`)

  // ----------------------------------------------------------
  // 6️⃣ Seed 15 Unique Jobs
  // ----------------------------------------------------------
  const hrData = await prisma.hR.findUnique({ where: { userId: hrUser.id } })
  const hr2Data = await prisma.hR.findUnique({ where: { userId: hr2.id } })
  const hr3Data = await prisma.hR.findUnique({ where: { userId: hr3.id } })
  const hr4Data = await prisma.hR.findUnique({ where: { userId: hr4.id } })
  const hr5Data = await prisma.hR.findUnique({ where: { userId: hr5.id } })

  // Calculate dates
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in45Days = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000)
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const jobs = [
    {
      hrId: hrData.id,
      title: 'Full-Stack Developer Intern',
      companyName: 'Acme Corporation',
      description: 'Join our dynamic team as a full-stack developer intern. Work on real-world projects using React, Node.js, and MongoDB. Perfect for students looking to gain hands-on experience in modern web development.',
      location: 'Bangkok, Thailand (Hybrid)',
      jobType: 'internship',
      workArrangement: 'hybrid',
      duration: '6 months',
      minSalary: 15000,
      maxSalary: 20000,
      application_deadline: in60Days,
      email: 'careers@acme.co',
      phone_number: '02-123-4567',
      requirements: ['Currently enrolled in Computer Science or related field', 'Basic knowledge of JavaScript', 'Familiarity with Git version control'],
      qualifications: ['Strong problem-solving skills', 'Good communication skills', 'Eager to learn new technologies'],
      responsibilities: ['Develop and maintain web applications', 'Collaborate with senior developers', 'Participate in code reviews', 'Write technical documentation'],
      benefits: ['Flexible working hours', 'Free lunch', 'Mentorship program', 'Potential for full-time offer'],
      tags: ['JavaScript', 'React', 'Node.js', 'Internship', 'Web Development']
    },
    {
      hrId: hr2Data.id,
      title: 'Mobile App Developer',
      companyName: 'TechCorp Solutions',
      description: 'We are seeking a talented mobile app developer to join our team. You will work on cutting-edge mobile applications for iOS and Android platforms using React Native and Flutter.',
      location: 'Bangkok, Thailand (On-site)',
      jobType: 'full-time',
      workArrangement: 'on-site',
      duration: 'Permanent',
      minSalary: 40000,
      maxSalary: 60000,
      application_deadline: in45Days,
      email: 'jobs@techcorp.com',
      phone_number: '02-234-5678',
      requirements: ['Bachelor\'s degree in Computer Science or related field', '2+ years of mobile development experience', 'Proficiency in React Native or Flutter'],
      qualifications: ['Experience with RESTful APIs', 'Knowledge of mobile UI/UX principles', 'Published apps on App Store or Play Store'],
      responsibilities: ['Design and develop mobile applications', 'Optimize app performance', 'Implement new features', 'Debug and fix issues'],
      benefits: ['Health insurance', 'Annual bonus', 'Training allowance', 'Modern office'],
      tags: ['React Native', 'Flutter', 'Mobile', 'iOS', 'Android']
    },
    {
      hrId: hr3Data.id,
      title: 'Digital Marketing Specialist',
      companyName: 'Digital Wave Marketing',
      description: 'Looking for a creative digital marketing specialist to manage our social media campaigns, SEO strategies, and content creation. Ideal for marketing graduates with a passion for digital trends.',
      location: 'Bangkok, Thailand (Remote)',
      jobType: 'contract',
      workArrangement: 'remote',
      duration: '1 year',
      minSalary: 25000,
      maxSalary: 35000,
      application_deadline: in30Days,
      email: 'hr@digitalwave.com',
      phone_number: '02-345-6789',
      requirements: ['Degree in Marketing, Communications, or related field', 'Experience with social media platforms', 'Basic understanding of SEO'],
      qualifications: ['Creative thinking', 'Excellent writing skills', 'Data analysis skills'],
      responsibilities: ['Manage social media accounts', 'Create engaging content', 'Analyze campaign performance', 'Optimize SEO strategies'],
      benefits: ['Work from home', 'Performance bonus', 'Professional development', 'Team outings'],
      tags: ['Marketing', 'SEO', 'Social Media', 'Content Creation', 'Remote']
    },
    {
      hrId: hr4Data.id,
      title: 'Cloud Infrastructure Engineer',
      companyName: 'CloudNet Services',
      description: 'Join our cloud infrastructure team to design, implement, and maintain scalable cloud solutions. Work with AWS, Azure, and Google Cloud Platform.',
      location: 'Bangkok, Thailand (Hybrid)',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Permanent',
      minSalary: 50000,
      maxSalary: 80000,
      application_deadline: in90Days,
      email: 'recruitment@cloudnet.com',
      phone_number: '02-456-7890',
      requirements: ['Bachelor\'s degree in Computer Engineering or related field', '3+ years of cloud infrastructure experience', 'AWS or Azure certification preferred'],
      qualifications: ['Strong knowledge of cloud architecture', 'Experience with Docker and Kubernetes', 'Scripting skills (Python, Bash)'],
      responsibilities: ['Design cloud infrastructure solutions', 'Monitor and optimize cloud resources', 'Implement security best practices', 'Provide technical support'],
      benefits: ['Competitive salary', 'Health and life insurance', 'Certification support', 'Annual company trip'],
      tags: ['AWS', 'Azure', 'Cloud', 'DevOps', 'Infrastructure']
    },
    {
      hrId: hr5Data.id,
      title: 'AI Research Intern',
      companyName: 'InnovateAI Labs',
      description: 'Exciting opportunity for students passionate about artificial intelligence and machine learning. Work on cutting-edge AI projects and research papers.',
      location: 'Bangkok, Thailand (On-site)',
      jobType: 'internship',
      workArrangement: 'on-site',
      duration: '6 months',
      minSalary: 18000,
      maxSalary: 25000,
      application_deadline: in60Days,
      email: 'research@innovateai.com',
      phone_number: '02-567-8901',
      requirements: ['Currently pursuing Master\'s or PhD in Computer Science, AI, or related field', 'Strong foundation in machine learning', 'Experience with Python and TensorFlow/PyTorch'],
      qualifications: ['Published research papers (preferred)', 'Strong mathematical background', 'Excellent analytical skills'],
      responsibilities: ['Conduct AI research', 'Develop machine learning models', 'Write research papers', 'Present findings to the team'],
      benefits: ['Research environment', 'Access to powerful GPUs', 'Mentorship from PhDs', 'Publication opportunities'],
      tags: ['AI', 'Machine Learning', 'Research', 'Python', 'Deep Learning']
    },
    {
      hrId: hrData.id,
      title: 'Frontend Developer',
      companyName: 'Acme Corporation',
      description: 'We need a skilled frontend developer to create beautiful and responsive user interfaces. Work with modern frameworks and design systems.',
      location: 'Bangkok, Thailand (On-site)',
      jobType: 'full-time',
      workArrangement: 'on-site',
      duration: 'Permanent',
      minSalary: 35000,
      maxSalary: 50000,
      application_deadline: in45Days,
      email: 'careers@acme.co',
      phone_number: '02-123-4567',
      requirements: ['Bachelor\'s degree or equivalent experience', '2+ years of frontend development', 'Expert in HTML, CSS, JavaScript'],
      qualifications: ['Experience with React or Vue.js', 'Understanding of responsive design', 'Familiarity with design tools (Figma, Adobe XD)'],
      responsibilities: ['Build responsive web applications', 'Collaborate with designers', 'Optimize for performance', 'Ensure cross-browser compatibility'],
      benefits: ['Health insurance', 'Flexible hours', 'Modern workspace', 'Annual bonus'],
      tags: ['Frontend', 'React', 'CSS', 'UI/UX', 'JavaScript']
    },
    {
      hrId: hr2Data.id,
      title: 'Data Analyst',
      companyName: 'TechCorp Solutions',
      description: 'Analyze data to drive business decisions. Work with large datasets, create visualizations, and provide actionable insights.',
      location: 'Bangkok, Thailand (Hybrid)',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Permanent',
      minSalary: 35000,
      maxSalary: 50000,
      application_deadline: in60Days,
      email: 'jobs@techcorp.com',
      phone_number: '02-234-5678',
      requirements: ['Bachelor\'s degree in Statistics, Mathematics, or related field', 'Proficiency in SQL', 'Experience with data visualization tools'],
      qualifications: ['Strong analytical skills', 'Knowledge of Python or R', 'Experience with Tableau or Power BI'],
      responsibilities: ['Analyze business data', 'Create reports and dashboards', 'Identify trends and patterns', 'Present findings to stakeholders'],
      benefits: ['Health insurance', 'Training programs', 'Performance bonus', 'Career growth'],
      tags: ['Data Analysis', 'SQL', 'Python', 'Tableau', 'Business Intelligence']
    },
    {
      hrId: hr3Data.id,
      title: 'Content Writer',
      companyName: 'Digital Wave Marketing',
      description: 'Creative content writer needed to produce engaging blogs, articles, and marketing copy. Perfect for English majors with a flair for writing.',
      location: 'Bangkok, Thailand (Remote)',
      jobType: 'part-time',
      workArrangement: 'remote',
      duration: 'Flexible',
      minSalary: 15000,
      maxSalary: 25000,
      application_deadline: in30Days,
      email: 'hr@digitalwave.com',
      phone_number: '02-345-6789',
      requirements: ['Degree in English, Journalism, or related field', 'Excellent writing skills', 'Portfolio of published work'],
      qualifications: ['SEO knowledge', 'Research skills', 'Ability to meet deadlines'],
      responsibilities: ['Write blog posts and articles', 'Create marketing content', 'Edit and proofread', 'Optimize content for SEO'],
      benefits: ['Flexible schedule', 'Work from home', 'Per-article payment', 'Byline credit'],
      tags: ['Content Writing', 'Copywriting', 'SEO', 'Blogging', 'Remote']
    },
    {
      hrId: hr4Data.id,
      title: 'Network Security Engineer',
      companyName: 'CloudNet Services',
      description: 'Protect our clients\' network infrastructure from cyber threats. Implement security protocols and monitor for vulnerabilities.',
      location: 'Bangkok, Thailand (On-site)',
      jobType: 'full-time',
      workArrangement: 'on-site',
      duration: 'Permanent',
      minSalary: 45000,
      maxSalary: 70000,
      application_deadline: in90Days,
      email: 'recruitment@cloudnet.com',
      phone_number: '02-456-7890',
      requirements: ['Bachelor\'s degree in Computer Science or Cybersecurity', '3+ years in network security', 'Security certifications (CEH, CISSP)'],
      qualifications: ['Deep understanding of network protocols', 'Experience with firewalls and IDS/IPS', 'Incident response skills'],
      responsibilities: ['Monitor network security', 'Implement security measures', 'Conduct vulnerability assessments', 'Respond to security incidents'],
      benefits: ['Competitive salary', 'Certification support', 'Health insurance', 'Annual leave'],
      tags: ['Cybersecurity', 'Network Security', 'Firewall', 'Security', 'IT']
    },
    {
      hrId: hr5Data.id,
      title: 'Machine Learning Engineer',
      companyName: 'InnovateAI Labs',
      description: 'Build and deploy machine learning models to solve real-world problems. Work with state-of-the-art ML technologies.',
      location: 'Bangkok, Thailand (Hybrid)',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Permanent',
      minSalary: 60000,
      maxSalary: 100000,
      application_deadline: in60Days,
      email: 'research@innovateai.com',
      phone_number: '02-567-8901',
      requirements: ['Master\'s degree in Computer Science or related field', '3+ years of ML experience', 'Strong programming skills in Python'],
      qualifications: ['Experience with TensorFlow or PyTorch', 'Knowledge of NLP or Computer Vision', 'Understanding of ML pipelines'],
      responsibilities: ['Develop ML models', 'Train and optimize algorithms', 'Deploy models to production', 'Collaborate with data scientists'],
      benefits: ['High salary', 'Stock options', 'GPU access', 'Conference attendance'],
      tags: ['Machine Learning', 'AI', 'Python', 'TensorFlow', 'Data Science']
    },
    {
      hrId: hrData.id,
      title: 'UI/UX Designer Intern',
      companyName: 'Acme Corporation',
      description: 'Learn UI/UX design in a professional environment. Create wireframes, prototypes, and user interfaces for web and mobile apps.',
      location: 'Bangkok, Thailand (Hybrid)',
      jobType: 'internship',
      workArrangement: 'hybrid',
      duration: '4 months',
      minSalary: 12000,
      maxSalary: 18000,
      application_deadline: in45Days,
      email: 'careers@acme.co',
      phone_number: '02-123-4567',
      requirements: ['Currently studying Design, HCI, or related field', 'Basic knowledge of Figma or Adobe XD', 'Portfolio of design work'],
      qualifications: ['Creative thinking', 'Attention to detail', 'Understanding of design principles'],
      responsibilities: ['Create wireframes and mockups', 'Design user interfaces', 'Conduct user research', 'Collaborate with developers'],
      benefits: ['Mentorship', 'Real project experience', 'Flexible hours', 'Design software licenses'],
      tags: ['UI/UX', 'Design', 'Figma', 'Prototyping', 'Internship']
    },
    {
      hrId: hr2Data.id,
      title: 'Backend Developer',
      companyName: 'TechCorp Solutions',
      description: 'Develop robust backend systems and APIs. Work with microservices architecture and cloud technologies.',
      location: 'Bangkok, Thailand (On-site)',
      jobType: 'full-time',
      workArrangement: 'on-site',
      duration: 'Permanent',
      minSalary: 40000,
      maxSalary: 65000,
      application_deadline: in60Days,
      email: 'jobs@techcorp.com',
      phone_number: '02-234-5678',
      requirements: ['Bachelor\'s degree in Computer Science', '2+ years backend development', 'Proficiency in Java, Python, or Node.js'],
      qualifications: ['Experience with RESTful API design', 'Knowledge of databases (SQL, NoSQL)', 'Understanding of microservices'],
      responsibilities: ['Design and develop APIs', 'Optimize database queries', 'Implement security measures', 'Write unit tests'],
      benefits: ['Competitive salary', 'Health insurance', 'Learning budget', 'Team building'],
      tags: ['Backend', 'API', 'Node.js', 'Database', 'Microservices']
    },
    {
      hrId: hr3Data.id,
      title: 'E-commerce Manager',
      companyName: 'Digital Wave Marketing',
      description: 'Manage our clients\' e-commerce operations. Oversee online stores, optimize conversions, and analyze sales data.',
      location: 'Bangkok, Thailand (Hybrid)',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Permanent',
      minSalary: 35000,
      maxSalary: 50000,
      application_deadline: in45Days,
      email: 'hr@digitalwave.com',
      phone_number: '02-345-6789',
      requirements: ['Degree in Business, Marketing, or related field', '2+ years in e-commerce', 'Experience with online platforms (Shopify, WooCommerce)'],
      qualifications: ['Understanding of digital marketing', 'Data analysis skills', 'Project management experience'],
      responsibilities: ['Manage online stores', 'Optimize product listings', 'Analyze sales metrics', 'Coordinate with marketing team'],
      benefits: ['Performance bonus', 'Health insurance', 'Flexible hours', 'Career advancement'],
      tags: ['E-commerce', 'Shopify', 'Digital Marketing', 'Sales', 'Analytics']
    },
    {
      hrId: hr4Data.id,
      title: 'DevOps Engineer',
      companyName: 'CloudNet Services',
      description: 'Automate and streamline our development and deployment processes. Build CI/CD pipelines and manage infrastructure as code.',
      location: 'Bangkok, Thailand (Hybrid)',
      jobType: 'full-time',
      workArrangement: 'hybrid',
      duration: 'Permanent',
      minSalary: 50000,
      maxSalary: 75000,
      application_deadline: in90Days,
      email: 'recruitment@cloudnet.com',
      phone_number: '02-456-7890',
      requirements: ['Bachelor\'s degree in Computer Engineering', '2+ years of DevOps experience', 'Experience with CI/CD tools (Jenkins, GitLab CI)'],
      qualifications: ['Strong scripting skills', 'Knowledge of containerization (Docker, Kubernetes)', 'Cloud platform experience'],
      responsibilities: ['Build and maintain CI/CD pipelines', 'Automate infrastructure provisioning', 'Monitor system performance', 'Troubleshoot deployment issues'],
      benefits: ['Competitive salary', 'Certification support', 'Remote work options', 'Modern tools'],
      tags: ['DevOps', 'CI/CD', 'Docker', 'Kubernetes', 'Automation']
    },
    {
      hrId: hr5Data.id,
      title: 'Computer Vision Engineer',
      companyName: 'InnovateAI Labs',
      description: 'Work on cutting-edge computer vision projects. Develop image recognition, object detection, and video analysis systems.',
      location: 'Bangkok, Thailand (On-site)',
      jobType: 'full-time',
      workArrangement: 'on-site',
      duration: 'Permanent',
      minSalary: 55000,
      maxSalary: 90000,
      application_deadline: in60Days,
      email: 'research@innovateai.com',
      phone_number: '02-567-8901',
      requirements: ['Master\'s degree in Computer Science or related field', '2+ years in computer vision', 'Strong background in deep learning'],
      qualifications: ['Experience with OpenCV, TensorFlow', 'Knowledge of CNNs and image processing', 'Published research (preferred)'],
      responsibilities: ['Develop computer vision models', 'Optimize model performance', 'Implement real-time processing', 'Collaborate on research projects'],
      benefits: ['High salary', 'Research environment', 'GPU infrastructure', 'Publication support'],
      tags: ['Computer Vision', 'Deep Learning', 'OpenCV', 'AI', 'Image Processing']
    }
  ]

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

  console.log('\n✅ All seed data created successfully.')
}

main()
  .catch((err) => {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
