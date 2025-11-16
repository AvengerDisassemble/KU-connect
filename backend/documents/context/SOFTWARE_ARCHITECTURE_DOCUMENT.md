Based on your request, I have combined the most essential elements of the **"Concise Edition"** (v1.1) and the **"Full detailed version"** (v1.0) into a single, balanced Software Architecture Document (SAD) for **KU-Connect**.

This resulting version maintains the comprehensive structure of the detailed document while prioritizing the quick-reference tables and key diagrams to be "not too short and not too long."

***

# KU-Connect Software Architecture — Balanced Edition

**Version:** 1.2 (Derived)
**Date:** 2025-11-13
**Maintainer:** Architecture Team

---

## 1. Introduction

This document provides the architectural blueprint for **KU-Connect**, a hiring platform for CPE/SKE students at Kasetsart University.

| Stakeholders | Concerns |
|:-------------|:----------------------------------------------------------------|
| **Students** | Job discovery, application tracking |
| **Employers** | Job posting, candidate access, verification |
| **Admins** | User verification, moderation, monitoring |
| **Developers** | Maintainability, testing, deployment |
| **University IT** | Security, compliance, reliability |

| Goals (Quality Attributes) | Target |
|:-----------------------------|:-------------------------------------------|
| **Security** (Critical) | Bcrypt passwords, encrypted JWT cookies, RBAC, TLS |
| **Reliability** (Critical) | 99.5% uptime; daily DB backups (30d) |
| **Performance** (High) | API p95 < 500ms; page p95 < 2s |
| **Maintainability** (High) | Modular monolith; tests > 80% (goal) |
| **Scalability** (Medium) | Stateless API; pagination; S3 for files |

---

## 2. Goals & Constraints

### Technology Stack Constraints

| Category | Choice | Version | Justification (Summary) |
|:----------|:-----------|:---------|:------------------------------------------|
| **Backend** | Node.js + Express.js | 18+, 5.1+ | Lightweight, mature, async I/O |
| **Database** | PostgreSQL (Prod), SQLite (Dev/Test) | 14+, 3.x | ACID compliance, mature tooling, fast test execution |
| **ORM** | Prisma | 6.16+ | Type-safe, migration system |
| **Frontend** | React + TypeScript | 19+, 5.8+ | Component reusability, type safety |
| **Storage** | AWS S3 (Prod), Local FS (Dev) | - | Scalable object storage with local dev fallback |
| **Auth** | JWT + Google OAuth 2.0 | - | Stateless, industry standard |

### Key Architectural Decisions (ADRs)

* **ADR-001: Modular Monolith**: Chosen for simpler ops and lower cost, while maintaining strict module boundaries for future scaling.
* **ADR-002: Encrypted JWT Cookies**: Ensures stateless auth and protection against XSS.
* **ADR-005: RBAC (4 roles + status)**: Provides clear permissions and enforces quality control via an admin verification step.

---

## 3. System Overview & Context

### Core Capabilities

| Actors | Capabilities | External Systems |
|:--------|:-------------|:-----------------|
| **All Users** | Auth/verification | Google OAuth (SSO) |
| **Student** | Jobs (search/apply); profile/docs | SMTP (email) |
| **Employer** | Jobs (post/review applicants) | AWS S3 (files) |
| **Admin** | User/Content moderation; announcements | - |

### System Context Diagram

The platform integrates several external systems for core functionality, as seen below:

---

## 4. Logical Architecture (Structural View)

### Architecture Pattern

**Pattern:** Layered Architecture with MVC (Model-View-Controller)

| Layer | Responsibilities |
|:------|:-------------------|
| **Frontend** | Pages, components, route guards, API client |
| **API** | Routes, middleware (auth/role/rate-limit), controllers |
| **Business** | Services, validation, domain rules |
| **Data** | Prisma models, PostgreSQL/SQLite, S3/Local storage |

### Logical Architecture Diagram

The logical flow follows the layered pattern from the Presentation to the Data Access Layer:

---

## 5. Process Architecture (Behavioral View)

### Key Process Summaries

| Flow | Critical Steps |
|:------|:----------------|
| **Registration** | Submit → user PENDING → email sent |
| **Login** | Verify credentials → check status → set encrypted cookies |
| **Apply Job** | Auth + status check (must be **APPROVED**) → upload resume (S3) → create application |
| **Admin Verify** | Admin reviews docs → updates status to **APPROVED/REJECTED/SUSPENDED** |

### User Login Flow (Sequence Diagram)

The login flow involves checking credentials, retrieving user status, and generating/encrypting JWT tokens:

### Admin Verification Workflow (State Diagram)

User status transitions are managed by the admin through a specific workflow:

---

## 6. Deployment / Physical Architecture

The application is deployed across three environments, using different technologies for persistence and storage based on the environment needs.

| Env | Frontend | Backend | DB | Storage |
|:----|:----------|:---------|:----|:---------|
| **Dev** | Vite localhost | Node localhost | SQLite | Local FS |
| **Staging** | Staging domain | Staging API | PostgreSQL | S3 (dev bucket) |
| **Prod** | Public domain | API domain | PostgreSQL (HA) | S3 (prod bucket) |

---

## 7. Data Architecture

### Key Data Entities

| Entity | Notes |
|:--------|:-------|
| **User** | id, email (unique), role, status |
| **Student** | degreeTypeId, gpa, resumeKey, transcriptKey |
| **Employer** | companyName, industry, verificationDocKey |
| **Job** | title, location, salary range, deadline |
| **Application** | jobId, studentId, resumeId, status |

**Sensitive Data:** Passwords (bcrypt), tokens (encrypted), documents (S3 SSE).

### Simplified Domain Model (ER Diagram)


---

## 8. Security Architecture

### Security Controls

| Control | Status |
|:---------|:--------|
| **Bcrypt passwords** | Implemented |
| **Encrypted JWT cookies** | Implemented |
| **RBAC + status verification** | Implemented |
| **Rate limiting** | Implemented |
| **Input validation** | Implemented |
| **Security headers (Helmet)** | Planned (Technical Debt) |
| **Penetration testing** | Planned |

**Security Best Practice:** Never log passwords, JWTs, keys, or OAuth secrets.

---

## 9. API Architecture

The API is **RESTful** using **JSON** responses, with pagination.

* **Status Codes:** Uses standard codes, including 200/201 (OK), 400/401/403/404 (Client errors), 409 (Conflict), 429 (Rate limit), and 500 (Server error).
* **Categories:** Auth, Profile, Jobs, Students, Admin.
* **Versioning:** Future versioning path `/api/v1`.

---

## 10. Performance & Scale

* **Targets:** API p95 < 500ms; DB avg < 100ms; support 500+ concurrent users.
* **Current State:** Utilizes pagination, selective/eager loading, connection pooling, and database indexes.
* **Future Strategy:** Implement Redis cache, use CDN for static assets, and add DB read replicas for query-heavy operations.

---

## 11. Observability

* **Logging:** INFO/WARN/ERROR levels using Morgan for request logging; no sensitive data logged.
* **Health Checks:** Dedicated endpoints for basic uptime (`/api/health`), database connectivity (`/api/health/db`), and storage accessibility (`/api/health/storage`).
* **Future:** Integration with Sentry/Rollbar for error tracking and Prometheus+Grafana for centralized metrics and alerting.

---

## 12. DevOps & Deployment Strategy

* **CI/CD:** Uses **GitHub Actions** for linting, testing, and building. Deployment to Staging is automatic on merging to the `develop` branch, while Production deployment requires **manual approval**.
* **Rollback:** The strategy involves reverting the deployed code and, if necessary (e.g., in a severe database issue), restoring from a daily backup.

---

## 13. Risks & Technical Debt

### Architectural Risks

| Risk | Mitigation |
|:------|:------------|
| **DB scaling** | Plan for read replicas and caching |
| **Single API instance** | Horizontal scaling behind a Load Balancer (future) |
| **Security incident** | Regular audits, penetration testing, Incident Response plan |
| **Monolith Complexity** | Maintain strict module boundaries |

### Technical Debt

| Technical Debt | Next Action |
|:-----------------|:------------|
| **Helmet headers** | Add globally for security |
| **Centralized logging** | Choose ELK/CloudWatch and integrate |
| **Audit logs** | Design and capture key actions |
| **Monitoring/alerting** | Add metrics and thresholds |

---

## 14. Appendices

### Architectural Decision Records (ADRs)

* **ADR-001:** Modular Monolith
* **ADR-002:** Encrypted cookies
* **ADR-003:** Prisma ORM
* **ADR-004:** Storage abstraction (Local/S3)
* **ADR-005:** RBAC (Role-Based Access Control)
* **ADR-006:** React SPA

### References

* **Standards:** IEEE 42010; OWASP Top 10.
* **Technologies:** Express, Prisma, React, PostgreSQL, AWS S3, JWT.