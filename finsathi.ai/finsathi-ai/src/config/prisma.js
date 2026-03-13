const { PrismaClient } = require('../generated/prisma');

// Singleton Prisma client for the API process.
const prisma = new PrismaClient();

module.exports = { prisma };

