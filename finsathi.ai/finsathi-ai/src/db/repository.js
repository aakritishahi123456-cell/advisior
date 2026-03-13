const { prisma } = require('../config/prisma');

// Central place for shared DB helpers and transaction patterns.
async function withTx(fn) {
  return prisma.$transaction(fn);
}

module.exports = { withTx };

