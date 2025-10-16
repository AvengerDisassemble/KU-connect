/*
  Warnings:

  - The primary key for the `Admin` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Application` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Benefit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DegreeType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `HR` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Job` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `JobReport` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Professor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Qualification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Requirement` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Responsibility` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Resume` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Student` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `StudentInterest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Tag` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Admin" ("id", "userId") SELECT "id", "userId" FROM "Admin";
DROP TABLE "Admin";
ALTER TABLE "new_Admin" RENAME TO "Admin";
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "resumeId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("createdAt", "id", "jobId", "resumeId", "status", "studentId", "updatedAt") SELECT "createdAt", "id", "jobId", "resumeId", "status", "studentId", "updatedAt" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE UNIQUE INDEX "Application_jobId_studentId_key" ON "Application"("jobId", "studentId");
CREATE TABLE "new_Benefit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Benefit_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Benefit" ("id", "jobId", "text") SELECT "id", "jobId", "text" FROM "Benefit";
DROP TABLE "Benefit";
ALTER TABLE "new_Benefit" RENAME TO "Benefit";
CREATE TABLE "new_DegreeType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
INSERT INTO "new_DegreeType" ("id", "name") SELECT "id", "name" FROM "DegreeType";
DROP TABLE "DegreeType";
ALTER TABLE "new_DegreeType" RENAME TO "DegreeType";
CREATE UNIQUE INDEX "DegreeType_name_key" ON "DegreeType"("name");
CREATE TABLE "new_HR" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "industry" TEXT NOT NULL DEFAULT 'OTHER',
    "companySize" TEXT NOT NULL DEFAULT 'ONE_TO_TEN',
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HR_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_HR" ("address", "companyName", "companySize", "createdAt", "description", "id", "industry", "updatedAt", "userId", "website") SELECT "address", "companyName", "companySize", "createdAt", "description", "id", "industry", "updatedAt", "userId", "website" FROM "HR";
DROP TABLE "HR";
ALTER TABLE "new_HR" RENAME TO "HR";
CREATE UNIQUE INDEX "HR_userId_key" ON "HR"("userId");
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hrId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "jobType" TEXT NOT NULL,
    "workArrangement" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "minSalary" INTEGER NOT NULL,
    "maxSalary" INTEGER NOT NULL,
    "application_deadline" DATETIME NOT NULL,
    "email" TEXT,
    "phone_number" TEXT NOT NULL,
    "other_contact_information" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_hrId_fkey" FOREIGN KEY ("hrId") REFERENCES "HR" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("application_deadline", "companyName", "createdAt", "description", "duration", "email", "hrId", "id", "jobType", "location", "maxSalary", "minSalary", "other_contact_information", "phone_number", "title", "updatedAt", "workArrangement") SELECT "application_deadline", "companyName", "createdAt", "description", "duration", "email", "hrId", "id", "jobType", "location", "maxSalary", "minSalary", "other_contact_information", "phone_number", "title", "updatedAt", "workArrangement" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE TABLE "new_JobReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobReport_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_JobReport" ("createdAt", "id", "jobId", "reason", "userId") SELECT "createdAt", "id", "jobId", "reason", "userId" FROM "JobReport";
DROP TABLE "JobReport";
ALTER TABLE "new_JobReport" RENAME TO "JobReport";
CREATE TABLE "new_Professor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    CONSTRAINT "Professor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Professor" ("department", "id", "userId") SELECT "department", "id", "userId" FROM "Professor";
DROP TABLE "Professor";
ALTER TABLE "new_Professor" RENAME TO "Professor";
CREATE UNIQUE INDEX "Professor_userId_key" ON "Professor"("userId");
CREATE TABLE "new_Qualification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Qualification_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Qualification" ("id", "jobId", "text") SELECT "id", "jobId", "text" FROM "Qualification";
DROP TABLE "Qualification";
ALTER TABLE "new_Qualification" RENAME TO "Qualification";
CREATE TABLE "new_Requirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Requirement_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Requirement" ("id", "jobId", "text") SELECT "id", "jobId", "text" FROM "Requirement";
DROP TABLE "Requirement";
ALTER TABLE "new_Requirement" RENAME TO "Requirement";
CREATE TABLE "new_Responsibility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    CONSTRAINT "Responsibility_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Responsibility" ("id", "jobId", "text") SELECT "id", "jobId", "text" FROM "Responsibility";
DROP TABLE "Responsibility";
ALTER TABLE "new_Responsibility" RENAME TO "Responsibility";
CREATE TABLE "new_Resume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    CONSTRAINT "Resume_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Resume" ("id", "link", "studentId") SELECT "id", "link", "studentId" FROM "Resume";
DROP TABLE "Resume";
ALTER TABLE "new_Resume" RENAME TO "Resume";
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "degreeTypeId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "gpa" REAL,
    "expectedGraduationYear" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Student_degreeTypeId_fkey" FOREIGN KEY ("degreeTypeId") REFERENCES "DegreeType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("address", "createdAt", "degreeTypeId", "expectedGraduationYear", "gpa", "id", "updatedAt", "userId") SELECT "address", "createdAt", "degreeTypeId", "expectedGraduationYear", "gpa", "id", "updatedAt", "userId" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE TABLE "new_StudentInterest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    CONSTRAINT "StudentInterest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentInterest_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudentInterest" ("id", "jobId", "studentId") SELECT "id", "jobId", "studentId" FROM "StudentInterest";
DROP TABLE "StudentInterest";
ALTER TABLE "new_StudentInterest" RENAME TO "StudentInterest";
CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Tag" ("id", "name") SELECT "id", "name" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE TABLE "new__JobTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_JobTags_A_fkey" FOREIGN KEY ("A") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_JobTags_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__JobTags" ("A", "B") SELECT "A", "B" FROM "_JobTags";
DROP TABLE "_JobTags";
ALTER TABLE "new__JobTags" RENAME TO "_JobTags";
CREATE UNIQUE INDEX "_JobTags_AB_unique" ON "_JobTags"("A", "B");
CREATE INDEX "_JobTags_B_index" ON "_JobTags"("B");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
