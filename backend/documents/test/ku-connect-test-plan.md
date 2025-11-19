# 🧪 KU CONNECT BACKEND TEST PLAN DOCUMENT  
**Version:** 1.1  
**Prepared by:** Backend QA Team – AvengerDisassemble  
**Date:** November 2025  
**Status:** For Internal Testing Use  

---

## 1. Introduction  

### 1.1 Purpose  
This document defines the backend testing approach for **KU Connect**, a web-based job platform connecting verified SKE and CPE students with employers.  
It ensures that all backend APIs, database operations, and business logic meet the functional and non-functional requirements described in the SRS document.

### 1.2 Scope  
Testing focuses on the **backend API layer** (Node.js + Express + Prisma + PostgreSQL) used by the frontend.  
It covers:
- Authentication & verification flows (FR 1.x)  
- User & profile management (FR 2.x)  
- Job postings and applications (FR 3.x – 4.x)  
- Notifications & reports (FR 5.x)  
- Admin control & professor analytics (FR 6.x – 7.x)  
- Non-functional areas such as security, performance, and reliability (NFR 1–7)

Out of scope: frontend UI tests and mobile interfaces.

### 1.3 References  
- KU Connect SRS v1.0 (Sept 2025)  
- KU Connect ER diagram and API design draft  
- Prisma schema and seed files  

---

## 2. Test Objectives  

1. Validate all REST APIs respond correctly and follow business rules.  
2. Verify data integrity in database transactions.  
3. Confirm authentication and authorization enforce role-based access.  
4. Ensure system stability, security, and performance as defined by NFRs.  
5. Produce reliable bug reports and coverage results to guide release readiness.  

---

## 3. Test Scope and Modules  

| Module | Description | Key Requirements |  
|---------|--------------|------------------|  
| Auth & Verification | Login via Google OAuth, JWT tokens, user verification | FR-1.1 → FR-1.8 |  
| Profile Management | Profile CRUD, document upload with validation | FR-2.1 → FR-2.4 |  
| Job Browsing & Applications | Job filters, apply/withdraw, status tracking | FR-3.1 → FR-3.10 |  
| Job Posting | Employer create/edit/close postings | FR-4.1 → FR-4.6 |  
| Notifications & Reports | System alerts and user reports | FR-5.1 → FR-5.6 |  
| Admin Controls | Approve users, moderate content | FR-6.1 → FR-6.7 |  
| Professor Analytics | Read-only dashboard and trend data | FR-7.1 → FR-7.3 |  

---

## 4. Test Strategy  

### 4.1 Testing Levels  

| Level | Purpose | Tools | Responsibility |  
|-------|----------|------|----------------|  
| Unit Testing | Check functions and services in isolation | Jest | Developers |  
| Integration Testing | Validate APIs + DB interactions | Jest + Supertest | Backend Team |  
| System Testing | Full workflow tests across modules | Postman / Supertest | QA Team |  
| Regression Testing | Re-run critical paths after bug fixes | CI pipeline | QA Team |  

### 4.2 Test Types  
- **Functional:** CRUD and workflow tests for each FR.  
- **Security:** JWT, OAuth, input validation, role restrictions (NFR-1.x).  
- **Performance:** Basic load tests on key endpoints (NFR-2.x).  
- **Usability/Compatibility:** API consistency and error messages (NFR-3.x, 5.x).  
- **Reliability:** Error handling and transaction rollbacks (NFR-4.x, 7.x).  

---

## 5. Test Environment  

| Environment | Purpose | Database | Notes |  
|--------------|----------|-----------|-------|  
| Local | Unit + debug testing | SQLite | Fast for iteration |  
| Test/Staging | Integration + System testing | PostgreSQL | Seed data auto-loaded |  

**Environment Variables (Example):**  
```env
DATABASE_URL=postgresql://kuconnect_test
JWT_SECRET=test_secret
NODE_ENV=test
SMTP_HOST=smtp.mailtrap.io
```

---

## 6. Test Coverage by Role  

| Role | Main Actions to Test |  
|------|-----------------------|  
| Student | Register/login → edit profile → browse → apply → check status → report job |  
| Employer | Register → post job → review applications → update status |  
| Admin | Approve users → create announcements → resolve reports → suspend accounts |  
| Professor | View career stats → industry trends → read-only dashboard |  

---

## 7. Representative API Test Cases  

| ID | Endpoint | Scenario | Expected Result |  
|----|-----------|-----------|-----------------|  
| AUTH-01 | POST /api/auth/register | Valid student @ku.th email | 201 Created + Pending verification |  
| AUTH-02 | POST /api/auth/login | Unverified user | 403 Forbidden |  
| USER-01 | GET /api/users/me | Valid JWT token | 200 OK with profile |  
| JOB-01 | GET /api/jobs | Filter by field and location | 200 OK, filtered list |  
| JOB-02 | POST /api/jobs | Employer creates job | 201 Created |  
| APP-01 | POST /api/applications | Student applies once | 201 Created |  
| APP-02 | POST /api/applications | Duplicate apply | 409 Conflict |  
| NOTIF-01 | GET /api/notifications | List notifications | 200 OK |  
| ADMIN-01 | PATCH /api/admin/verify-user/:id | Approve employer | 200 OK, email sent |  
| PROF-01 | GET /api/analytics/career-progress | Professor role only | 200 OK / 403 if unauthorized |  

*(Detailed step-by-step cases are recorded in the Postman collection.)*

---

## 8. Database Testing  

- Check all FK and unique constraints (FR-1 → FR-4).  
- Verify cascade deletes (e.g., delete user → remove related records).  
- Confirm indexes on searchable fields (job title, location).  
- Run seed data and rollback scripts to validate transaction safety.  

---

## 9. Non-Functional Testing Summary  

| Category | Goal | Test Method | Expected Result | SRS Reference |  
|-----------|------|--------------|-----------------|----------------|  
| Security | JWT + OAuth auth secure | Token spoof tests | All rejected | NFR-1.1-1.2 |  
| Performance | < 3 s response | JMeter light test | Pass | NFR-2.1 |  
| Scalability | 100 concurrent users | Simulated load | Stable | NFR-2.2 |  
| Usability | Clear error messages | API response review | Human-readable errors | NFR-3.x |  
| Reliability | No crash under invalid input | Fuzz tests | Graceful errors | NFR-4.x |  
| Compatibility | Browser/API clients | Test via Postman | Consistent output | NFR-5.x |  
| Maintainability | Code lint & docs | ESLint, Swagger | 0 critical issues | NFR-6.x |  
| Data Management | Secure storage & backup | Encrypt fields test | Data encrypted | NFR-7.x |  

---

## 10. Test Deliverables  

1. **Backend Test Plan** (this document)  
2. **Postman Collection + Environment file**  
3. **Automated Jest/Supertest scripts** for core APIs  
4. **Test Report & Coverage Summary** (percentage of FR/NFR covered)  
5. **Bug Log** (GitHub Issues format with severity labels)  

---

## 11. Entry & Exit Criteria  

**Entry**  
- All core features implemented.  
- Database migrated successfully.  
- Test data available.  
- API documentation ready.  

**Exit**  
- All critical/high tests passed.  
- No blocker bugs.  
- Code coverage ≥ 80%.  
- Functional coverage ≥ 95%.  
- All NFRs verified by sample tests.  

---

## 12. Test Schedule (Simplified 8-Week Plan)  

| Phase | Activity | Owner | Duration |  
|-------|-----------|--------|-----------|  
| Week 1-2 | Unit testing (service layer) | Developers | 2 weeks |  
| Week 3 | Integration tests (DB + API) | Dev + QA | 1 week |  
| Week 4 | System tests + bug fixes | QA Team | 1 week |  
| Week 5 | Security + performance tests | QA Lead | 1 week |  
| Week 6 | Regression testing | QA Team | 1 week |  
| Week 7 | Report + review | QA Lead + PM | 3 days |  
| Week 8 | Sign-off and release | All | 2 days |  

---

## 13. Risk and Mitigation  

| Risk | Impact | Mitigation |  
|------|---------|-------------|  
| OAuth service unavailable | Blocker | Use mock login tokens in test env |  
| Slow queries detected | High | Add indexes, optimize joins |  
| Seed data corruption | Medium | Reset DB between test runs |  
| Auth token leak | High | Rotate keys and mask logs |  

---

## 14. Test Metrics  

| Metric | Target |  
|--------|---------|  
| Functional coverage | ≥ 95% of FR tested |  
| Code coverage | ≥ 80% Jest lines covered |  
| Pass rate | ≥ 90% test cases pass |  
| Average API response | ≤ 3 seconds |  
| Defect density | ≤ 0.1 bugs per test |  


---

✅ **Summary:**  
This plan aligns directly with the KU Connect SRS functional (FR 1.1 – 7.3) and non-functional (NFR 1.1 – 7.3) requirements.  
It is streamlined for a student development team with practical coverage expectations — functional, security, and performance tests using Jest and Postman to validate a stable backend release.
