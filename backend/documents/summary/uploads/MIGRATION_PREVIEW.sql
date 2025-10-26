-- CreateEnum
-- This migration adds document storage keys to User, Student, and HR models

-- AlterTable User: Add avatarKey field
ALTER TABLE "User" ADD COLUMN "avatarKey" TEXT;

-- AlterTable Student: Add resumeKey and transcriptKey fields
ALTER TABLE "Student" ADD COLUMN "resumeKey" TEXT;
ALTER TABLE "Student" ADD COLUMN "transcriptKey" TEXT;

-- AlterTable HR: Add verificationDocKey field  
ALTER TABLE "HR" ADD COLUMN "verificationDocKey" TEXT;

-- Note: These are nullable fields, so existing records will not be affected
-- Users can upload documents after this migration is applied
