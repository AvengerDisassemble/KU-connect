/*
  Warnings:

  - Added the required column `phoneNumber` to the `HR` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_HR" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "industry" TEXT NOT NULL DEFAULT 'OTHER',
    "companySize" TEXT NOT NULL DEFAULT 'ONE_TO_TEN',
    "website" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HR_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_HR" ("address", "companyName", "companySize", "createdAt", "description", "id", "industry", "updatedAt", "userId", "website", "phoneNumber")
SELECT "address", "companyName", "companySize", "createdAt", "description", "id", "industry", "updatedAt", "userId", "website", 
'000-000-0000' AS "phoneNumber" FROM "HR";
DROP TABLE "HR";
ALTER TABLE "new_HR" RENAME TO "HR";
CREATE UNIQUE INDEX "HR_userId_key" ON "HR"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
