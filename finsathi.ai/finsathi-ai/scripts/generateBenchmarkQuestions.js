const fs = require('fs');
const path = require('path');

const DEFAULT_SYMBOLS = [
  'NABIL',
  'HBL',
  'SCB',
  'NTC',
  'NICA',
  'EBL',
  'GBIME',
  'SANIMA',
  'NICL',
  'NRIC',
];

function pad(n, width) {
  return String(n).padStart(width, '0');
}

function buildTemplates(symbol) {
  return [
    {
      q: `From the official documents, what is the Return on Equity (ROE) for ${symbol}? Provide the ROE value and cite the page.`,
      expected: { numeric: { dbPath: 'companyFundamentals.roe', tolerancePct: 0.05 } },
      tags: ['roe', 'document', 'numeric'],
    },
    {
      q: `What is the Earnings Per Share (EPS) for ${symbol} based on the official annual/quarterly report? Provide the EPS and cite the page.`,
      expected: { numeric: { dbPath: 'companyFundamentals.eps', tolerancePct: 0.05 } },
      tags: ['eps', 'document', 'numeric'],
    },
    {
      q: `What is the P/E ratio for ${symbol} as stated in the official documents? Provide the value and cite the page.`,
      expected: { numeric: { dbPath: 'companyFundamentals.peRatio', tolerancePct: 0.08 } },
      tags: ['pe_ratio', 'document', 'numeric'],
    },
    {
      q: `What was ${symbol}'s net profit in the latest official report available? Provide the figure and cite the page.`,
      expected: { numeric: { dbPath: 'companyFundamentals.netProfit', tolerancePct: 0.12 } },
      tags: ['net_profit', 'document', 'numeric'],
    },
    {
      q: `Summarize the main business highlights for ${symbol} mentioned in the official documents. Provide at least 2 citations (document + page).`,
      expected: {},
      tags: ['highlights', 'document', 'reasoning'],
    },
    {
      q: `List the key risk factors mentioned for ${symbol} in the official document set. Provide citations.`,
      expected: {},
      tags: ['risks', 'document', 'reasoning'],
    },
    {
      q: `What does the official document say about ${symbol}'s dividend policy or dividend distribution? Cite the page(s).`,
      expected: { numeric: { dbPath: 'companyFundamentals.dividendYield', tolerancePct: 0.2 } },
      tags: ['dividend', 'document', 'numeric'],
    },
    {
      q: `According to official documents, what are ${symbol}'s major revenue sources or segments? Provide citations.`,
      expected: {},
      tags: ['revenue', 'document', 'reasoning'],
    },
  ];
}

function generate({ count = 250, symbols = DEFAULT_SYMBOLS }) {
  const questions = [];
  let i = 1;

  while (questions.length < count) {
    for (const symbol of symbols) {
      const templates = buildTemplates(symbol);
      for (const t of templates) {
        if (questions.length >= count) break;
        questions.push({
          id: `Q${pad(i, 4)}`,
          symbol,
          question: t.q,
          requireCitations: true,
          expected: t.expected,
          tags: t.tags,
        });
        i += 1;
      }
      if (questions.length >= count) break;
    }
  }

  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    notes: [
      'Auto-generated benchmark question set.',
      'Use official-documents RAG indexing for citation verification.',
    ],
    questions,
  };
}

function main() {
  const outPath = path.join(process.cwd(), 'data', 'benchmark', 'financialQuestions.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const count = Number(process.env.BENCHMARK_COUNT || 250);
  const symbols = process.env.BENCHMARK_SYMBOLS
    ? process.env.BENCHMARK_SYMBOLS.split(',').map((s) => s.trim()).filter(Boolean)
    : DEFAULT_SYMBOLS;

  const payload = generate({ count, symbols });
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Wrote ${payload.questions.length} questions to ${outPath}`);
}

if (require.main === module) main();

