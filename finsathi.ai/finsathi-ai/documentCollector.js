require('dotenv').config();

const { collectDocuments } = require('./src/docs/documentCollector');
const { getPrisma } = require('./src/database/prismaClient');

async function main() {
  const prisma = getPrisma();
  try {
    const out = await collectDocuments({ manifestPath: process.env.DOCS_MANIFEST || null });
    // eslint-disable-next-line no-console
    console.log(out);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { main };

if (require.main === module) {
  main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}

