-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Resume" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "studentId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "link" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'UPLOADED',
    CONSTRAINT "Resume_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Resume_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Resume" ("id", "jobId", "link", "studentId") SELECT "id", "jobId", "link", "studentId" FROM "Resume";
DROP TABLE "Resume";
ALTER TABLE "new_Resume" RENAME TO "Resume";
CREATE UNIQUE INDEX "Resume_studentId_jobId_key" ON "Resume"("studentId", "jobId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
