-- CreateTable
CREATE TABLE "StudentPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "desiredLocation" TEXT,
    "minSalary" INTEGER,
    "currency" TEXT,
    "payPeriod" TEXT,
    "remoteWork" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentPreference_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentPreference_studentId_key" ON "StudentPreference"("studentId");
