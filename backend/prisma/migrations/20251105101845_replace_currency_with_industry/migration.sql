/*
  Warnings:

  - You are about to drop the column `currency` on the `StudentPreference` table. All the data in the column will be lost.
  - You are about to drop the column `payPeriod` on the `StudentPreference` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudentPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "desiredLocation" TEXT,
    "minSalary" INTEGER,
    "industry" TEXT,
    "jobType" TEXT,
    "remoteWork" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentPreference_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudentPreference" ("createdAt", "desiredLocation", "id", "minSalary", "remoteWork", "studentId", "updatedAt") SELECT "createdAt", "desiredLocation", "id", "minSalary", "remoteWork", "studentId", "updatedAt" FROM "StudentPreference";
DROP TABLE "StudentPreference";
ALTER TABLE "new_StudentPreference" RENAME TO "StudentPreference";
CREATE UNIQUE INDEX "StudentPreference_studentId_key" ON "StudentPreference"("studentId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
