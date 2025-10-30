-- AlterTable
ALTER TABLE "HR" ADD COLUMN "verificationDocKey" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "resumeKey" TEXT;
ALTER TABLE "Student" ADD COLUMN "transcriptKey" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "avatarKey" TEXT;
