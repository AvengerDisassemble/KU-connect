/**
 * Manual verification script for job resume endpoints
 * Run this to quickly test the implementation without full Jest setup
 */

const path = require("path");

// Test 1: Check if controller exports exist
console.log("✓ Test 1: Checking controller exports...");
try {
  const jobDocController = require("../src/controllers/documents-controller/jobDocumentController");
  const expectedExports = [
    "upsertJobResume",
    "getJobResumeUrl",
    "deleteJobResume",
    "getSelfJobResumeUrl",
  ];

  expectedExports.forEach((exportName) => {
    if (typeof jobDocController[exportName] !== "function") {
      throw new Error(`Missing export: ${exportName}`);
    }
  });
  console.log("  ✓ All controller exports present");
} catch (error) {
  console.error("  ✗ Controller exports check failed:", error.message);
  process.exit(1);
}

// Test 2: Check if routes file exists and exports router
console.log("✓ Test 2: Checking routes file...");
try {
  const jobRoutes = require("../src/routes/jobs/index");
  if (!jobRoutes || typeof jobRoutes !== "function") {
    throw new Error("Routes do not export an Express router");
  }
  console.log("  ✓ Routes file valid");
} catch (error) {
  console.error("  ✗ Routes check failed:", error.message);
  process.exit(1);
}

// Test 3: Check if Prisma schema has Resume model with correct fields
console.log("✓ Test 3: Checking Prisma client generation...");
try {
  const prisma = require("../src/models/prisma");
  if (!prisma.resume) {
    throw new Error("Resume model not found in Prisma client");
  }
  console.log("  ✓ Prisma client has Resume model");
} catch (error) {
  console.error("  ✗ Prisma client check failed:", error.message);
  process.exit(1);
}

// Test 4: Verify migration files exist
console.log("✓ Test 4: Checking migration files...");
const fs = require("fs");
try {
  const migrationsDir = "./prisma/migrations";
  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.includes("add_job_resume"));
  if (migrations.length === 0) {
    throw new Error("Migration file not found");
  }
  console.log(`  ✓ Migration found: ${migrations[0]}`);
} catch (error) {
  console.error("  ✗ Migration check failed:", error.message);
  process.exit(1);
}

// Test 5: Verify documentsController import path is fixed
console.log("✓ Test 5: Checking documentsController import paths...");
try {
  const docsController = require("../src/controllers/documents-controller/documentsController");
  if (typeof docsController.uploadResume !== "function") {
    throw new Error("documentsController not properly loaded");
  }
  console.log("  ✓ documentsController import paths correct");
} catch (error) {
  console.error("  ✗ documentsController import check failed:", error.message);
  process.exit(1);
}

console.log("\n✅ All basic checks passed! Implementation looks good.");
console.log("\nTo run full tests:");
console.log("  npm test tests/controllers/jobDocumentController.test.js");
