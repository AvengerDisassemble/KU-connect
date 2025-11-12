/**
 * @module utils/prisma
 * @description Re-export the existing Prisma client singleton.
 * Why: The codebase already has a single Prisma client at `src/models/prisma.js`.
 * Creating this small adapter lets new code require from `src/utils/prisma` as requested
 * without duplicating client instantiation logic.
 */

module.exports = require("../models/prisma");
