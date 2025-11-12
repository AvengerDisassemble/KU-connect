/**
 * @module models/prisma
 * @description Prisma client singleton instance
 */

const { PrismaClient } = require("../generated/prisma");

let prisma;

/**
 * Creates or returns existing Prisma client instance
 * @returns {PrismaClient} Prisma client instance
 */
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances in development with hot reloading
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = prisma;
