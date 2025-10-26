/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `DegreeType` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DegreeType_name_key" ON "DegreeType"("name");
