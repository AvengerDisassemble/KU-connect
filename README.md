# KU-Connect

![In Development](https://img.shields.io/badge/Status-In%20Development-orange) ![Version: 1.0.0](https://img.shields.io/badge/version-1.0.0-yellow) ![Team Size: 5](https://img.shields.io/badge/Team%20Size-5%20Developers-green)

Professional hiring platform connecting Computer Engineering (CPE) and Software Engineering (SKE) students at Kasetsart University with industry opportunities.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Progress](#development-progress)
4. [Quick Start](#quick-start)
5. [API Documentation](#api-documentation)
6. [Contact](#contact)

---

## Project Overview

**Objective**: Bridge the gap between KU CPE/SKE students and technology employers in Thailand through a comprehensive hiring platform.

**Key Features**:
- Multi-role support (Students, Employers, Professors, Administrators)
- Job posting and application management
- Real-time notifications
- Analytics dashboard

**Current Phase**: Week 10 - Administrative Systems & Platform Monitoring

---

## Technology Stack

### Frontend
React 19.1.1 • TypeScript 5.8.3 • Vite 7.1.2 • Tailwind CSS 4.1.12 • React Query 5.90.2

### Backend
Node.js 18+ • Express.js 5.1.0 • Prisma 6.16.3 • PostgreSQL 14+ • JWT 9.0.2 • Passport.js 0.7.0

---

## Development Progress

### 14-Week Development Timeline (Completed)

| Week | Milestone | Status | Completion |
|------|-----------|--------|------------|
| 2 | Requirements & Architecture | ✅ Complete | 100% |
| 5 | Core System & Security | ✅ Complete | 100% |
| 6 | User Profile Management | ✅ Complete | 100% |
| 7 | Job Posting System | ✅ Complete | 100% |
| 8 | Application & Search | ✅ Complete | 100% |
| 9 | Authentication & Notifications | ✅ Complete | 100% |
| 10 | Admin & Professor Features | ✅ Complete | 100% |
| 12 | Platform Monitoring & Analytics | ✅ Complete | 100% |
| 14 | Testing, Launch & Handover | ✅ Complete | 100% |

**Legend**: ✅ Complete | 🚧 In Progress | 📝 Planned

### Current Status
- ✅ All planned milestones delivered.
- ✅ Platform ready for launch/hand-over.

### Feature Status

| Module | Feature | Status | Week |
|--------|---------|--------|------|
| **Authentication** | Login/Logout, OAuth 2.0, JWT | ✅ Complete | 5 |
| **User Management** | Multi-role Profiles | ✅ Complete | 6 |
| **User Management** | Profile Customization | ✅ Complete | 6 |
| **Job Management** | Job Creation & Listing | ✅ Complete | 7 |
| **Job Management** | Search & Filtering | ✅ Complete | 7 |
| **Applications** | Submit & Track | ✅ Complete | 8 |
| **Notifications** | Email & In-app | ✅ Complete | 9 |
| **Admin Tools** | User Approval System | ✅ Complete | 10 |
| **Admin Tools** | Job Moderation | ✅ Complete | 10 |
| **Professor Dashboard** | Student Insights | ✅ Complete | 10 |
| **Monitoring** | Activity Tracking | ✅ Complete | 12 |
| **Analytics** | Dashboard & Reports | ✅ Complete | 12 |

**[View Detailed Milestone](https://github.com/AvengerDisassemble/KU-connect/wiki/Project-Development-Plan)**

---

## Quick Start

### Installation & Run (Backend + Frontend)
1. Clone the repo and install dependencies
   ```bash
   git clone https://github.com/AvengerDisassemble/KU-connect.git
   cd KU-connect
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Configure environment (backend)
   ```bash
   cd ../backend
   cp .env.example .env
   # Fill in DB, JWT secrets, COOKIE_ENCRYPTION_KEY, storage/email configs
   ```
3. Prepare the database (PostgreSQL 14+ required)
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
4. Run dev servers
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run start
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```
5. Access the app
   - Frontend: http://localhost:5173  
   - API: http://localhost:3000

### Prerequisites
- Node.js 18.0+
- PostgreSQL 14.0+
- Git

---

## API Documentation

### Core Endpoints

**Authentication** (Week 5 - Complete)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/auth/google` - Google OAuth

**Job Management** (Week 7 - Complete)
- `POST /api/job/list` - List jobs with filters
- `GET /api/job/:id` - Get job details 
- `POST /api/job` - Create job posting 
- `PATCH /api/job/:id` - Update job posting 
- `DELETE /api/job/:id` - Delete job posting 

**User Management** (Week 6 - Complete)
- `GET /api/users/profile` - Get user profile 
- `PUT /api/users/profile` - Update user profile 
- `POST /api/users/upload-resume` - Upload resume 

**Applications** (Week 8 - Complete)
- `POST /api/job/:id/apply` - Apply to job 
- `GET /api/job/my-applications` - Application history 
- `GET /api/job/:id/applyer` - View applicants 
- `POST /api/job/:id/applyer` - Manage applicant status 

**Admin & Moderation** (Week 10 - In Progress)
- `GET /api/admin/pending-users` - View pending user approvals 
- `POST /api/admin/approve-user/:id` - Approve user registration 
- `GET /api/admin/pending-jobs` - View pending job postings 
- `POST /api/admin/approve-job/:id` - Approve job posting 
- `GET /api/professor/dashboard` - Professor analytics dashboard 

### Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**[Full API Documentation](https://github.com/AvengerDisassemble/KU-connect/wiki/API-endpoints)**

---


## Testing
```bash
# Backend tests
cd backend && npm test

# Test coverage
npm run test:coverage
```

---

## Contact

### Team

| Role | Responsibility |
|------|----------------|
| Project Lead | Full-stack, Architecture |
| Backend Developer | API, Database |
| Frontend Developer | UI/UX, React |

### Support
- **Bug Reports**: [Create GitHub Issue](https://github.com/your-org/KU-connect/issues) with `bug` label
- **Documentation**: [Project Wiki](https://github.com/your-org/KU-connect/wiki)

---

## Project Status

**Current Version**: v1.0.0 (Development)  
**Active Sprint**: Week 10 (Admin Systems & Professor Dashboard)  
**Next Milestone**: Week 12 - Platform Monitoring & Analytics  
**Target Launch**: Week 14   
**Repository**: [GitHub](https://github.com/AvengerDisassemble/KU-connect)

---

_Last Updated: October 30, 2025 | Maintained by AvengerDisassemble Team_
