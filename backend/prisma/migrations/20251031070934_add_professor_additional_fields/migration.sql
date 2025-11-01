/*
  Warnings:

  - Added the required column `updatedAt` to the `Professor` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Professor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "officeLocation" TEXT,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Professor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Professor" ("department", "id", "userId", "createdAt", "updatedAt") 
SELECT "department", "id", "userId", 
       COALESCE("createdAt", CURRENT_TIMESTAMP), 
       CURRENT_TIMESTAMP 
FROM "Professor";
DROP TABLE "Professor";
ALTER TABLE "new_Professor" RENAME TO "Professor";
CREATE UNIQUE INDEX "Professor_userId_key" ON "Professor"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
