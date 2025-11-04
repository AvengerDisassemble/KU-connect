/**
 * @module services/savedService
 * @description Business logic for Saved Jobs feature using Prisma
 */

const prisma = require("../models/prisma");

/**
 * Lists saved jobs for a user with pagination
 * Why: support frontend pagination and count for UX
 *
 * @param {string} userId
 * @param {object} opts
 * @param {number} [opts.page=1]
 * @param {number} [opts.pageSize=20]
 * @returns {Promise<{items:Array, page:number, pageSize:number, total:number}>}
 */
async function listSavedJobs(userId, { page = 1, pageSize = 20 } = {}) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const size = Math.max(parseInt(pageSize, 10) || 20, 1);
  const skip = (pageNum - 1) * size;

  const [items, total] = await Promise.all([
    prisma.savedJob.findMany({
      where: { userId },
      take: size,
      skip,
      include: {
        job: {
          include: { hr: true, tags: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.savedJob.count({ where: { userId } }),
  ]);

  // Map items to return the job objects for convenience
  const jobs = items.map((s) => ({
    savedAt: s.createdAt,
    job: s.job,
  }));

  return { items: jobs, page: pageNum, pageSize: size, total };
}

/**
 * Adds/saves a job for a user
 * Throws: Error with code 'ALREADY_SAVED' or 'NOT_FOUND'
 *
 * @param {string} userId
 * @param {string} jobId
 * @returns {Promise<object>} created record
 */
async function addSavedJob(userId, jobId) {
  try {
    const saved = await prisma.savedJob.create({
      data: { userId, jobId },
    });
    return saved;
  } catch (error) {
    console.error("savedService.addSavedJob error:", error);
    console.error(error && error.stack);
    // Map Prisma unique constraint to ALREADY_SAVED
    if (error && error.code === "P2002") {
      const err = new Error("Already saved");
      err.code = "ALREADY_SAVED";
      throw err;
    }
    // Map record not found (foreign key) to NOT_FOUND when possible
    if (error && error.code === "P2025") {
      const err = new Error("Not found");
      err.code = "NOT_FOUND";
      throw err;
    }
    throw error;
  }
}

/**
 * Removes/unsaves a job for a user
 * Throws: Error with code 'NOT_FOUND' if nothing deleted
 *
 * @param {string} userId
 * @param {string} jobId
 * @returns {Promise<void>}
 */
async function removeSavedJob(userId, jobId) {
  const result = await prisma.savedJob.deleteMany({ where: { userId, jobId } });
  if (result.count === 0) {
    const err = new Error("Not found");
    err.code = "NOT_FOUND";
    throw err;
  }
}

module.exports = {
  listSavedJobs,
  addSavedJob,
  removeSavedJob,
};
