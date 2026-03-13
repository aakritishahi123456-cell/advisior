let PrismaClient;
try {
  // Preferred: generated client output from prisma/schema.prisma generator.
  // eslint-disable-next-line global-require
  ({ PrismaClient } = require('../generated/prisma'));
} catch (e) {
  // Fallback: standard Prisma client package (works before `prisma generate` is run).
  // eslint-disable-next-line global-require
  ({ PrismaClient } = require('@prisma/client'));
}

let prisma;

function getPrisma() {
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

module.exports = { getPrisma };
