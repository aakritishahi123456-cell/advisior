require('dotenv').config();

const { indexOfficialDocuments } = require('./src/docs/vectorIndexer');
const { getPrisma } = require('./src/database/prismaClient');

async function main() {
  const prisma = getPrisma();
  try {
    const symbol = process.env.DOCS_INDEX_SYMBOL || null;
    const out = await indexOfficialDocuments({ symbol });
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

