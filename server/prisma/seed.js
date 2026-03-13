const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clean existing data
  await prisma.aiReport.deleteMany();
  await prisma.loanSimulation.deleteMany();
  await prisma.financialReport.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // Create sample companies (Nepalese companies)
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'Nabil Bank Limited',
        symbol: 'NABIL',
        sector: 'Banking',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Commercial Bank of Nepal',
        symbol: 'COMB',
        sector: 'Banking',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Nepal Telecom',
        symbol: 'NTC',
        sector: 'Telecommunications',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Unilever Nepal Limited',
        symbol: 'UNL',
        sector: 'Consumer Goods',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Nepal Insurance Company',
        symbol: 'NIC',
        sector: 'Insurance',
      },
    }),
  ]);

  console.log('Created companies:', companies);

  // Create sample financial reports
  const financialReports = await Promise.all([
    prisma.financialReport.create({
      data: {
        companyId: companies[0].id,
        year: 2023,
        revenue: 25450000000.00,
        netProfit: 3250000000.00,
        totalAssets: 285000000000.00,
        totalLiabilities: 245000000000.00,
        equity: 40000000000.00,
        eps: 125.50,
        roe: 8.1250,
        debtRatio: 0.8600,
        profitMargin: 12.7750,
        epsGrowth: 15.2500,
      },
    }),
    prisma.financialReport.create({
      data: {
        companyId: companies[1].id,
        year: 2023,
        revenue: 18900000000.00,
        netProfit: 2150000000.00,
        totalAssets: 198000000000.00,
        totalLiabilities: 168000000000.00,
        equity: 30000000000.00,
        eps: 89.60,
        roe: 7.1667,
        debtRatio: 0.8480,
        profitMargin: 11.3750,
        epsGrowth: 18.7500,
      },
    }),
  ]);

  console.log('Created financial reports:', financialReports);

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12);
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@finsathi.ai',
        passwordHash: hashedPassword,
        role: 'PRO',
      },
    }),
    prisma.user.create({
      data: {
        email: 'user@finsathi.ai',
        passwordHash: hashedPassword,
        role: 'FREE',
      },
    }),
  ]);

  console.log('Created users:', users);

  // Create subscriptions
  const subscriptions = await Promise.all([
    prisma.subscription.create({
      data: {
        userId: users[0].id,
        plan: 'PRO',
        status: 'ACTIVE',
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
    }),
    prisma.subscription.create({
      data: {
        userId: users[1].id,
        plan: 'FREE',
        status: 'ACTIVE',
      },
    }),
  ]);

  console.log('Created subscriptions:', subscriptions);

  // Create sample loan simulations
  const loanSimulations = await Promise.all([
    prisma.loanSimulation.create({
      data: {
        userId: users[0].id,
        principal: 5000000.00,
        interestRate: 12.50,
        tenure: 60,
        emi: 112625.50,
        totalPayment: 6757530.00,
      },
    }),
    prisma.loanSimulation.create({
      data: {
        userId: users[1].id,
        principal: 3000000.00,
        interestRate: 13.00,
        tenure: 36,
        emi: 101252.75,
        totalPayment: 3645099.00,
      },
    }),
  ]);

  console.log('Created loan simulations:', loanSimulations);

  // Create AI reports
  const aiReports = await Promise.all([
    prisma.aiReport.create({
      data: {
        companyId: companies[0].id,
        financialReportId: financialReports[0].id,
        year: 2023,
        analysisText: 'Nabil Bank demonstrates strong financial performance with healthy profit margins and stable asset quality. The bank shows consistent growth in net profit and maintains adequate capital ratios. Risk factors include increasing competition in the banking sector and potential economic headwinds.',
        riskScore: 3.25,
      },
    }),
    prisma.aiReport.create({
      data: {
        companyId: companies[1].id,
        financialReportId: financialReports[1].id,
        year: 2023,
        analysisText: 'Commercial Bank shows moderate performance with improving efficiency ratios. The bank has been focusing on digital transformation and cost optimization. Key challenges include maintaining asset quality in a competitive environment.',
        riskScore: 4.10,
      },
    }),
  ]);

  console.log('Created AI reports:', aiReports);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
