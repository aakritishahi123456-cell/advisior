import { Prisma, PrismaClient } from '@prisma/client';

export type LoanProductType = 'HOME' | 'PERSONAL' | 'EDUCATION' | 'BUSINESS' | 'AUTO';

export interface CompareLoanProductsInput {
  loanType: LoanProductType;
  loanAmount?: number;
  durationMonths?: number;
  limit?: number;
}

export interface LoanProductComparison {
  bankName: string;
  loanType: LoanProductType | string;
  interestRate: number;
  interestRateMax?: number | null;
  loanTerm?: number | null;
  processingFee?: number | null;
  minimumIncome?: number | null;
  maxLoanAmount?: number | null;
  eligibilityRequirements?: string | null;
  sourceUrl?: string | null;
  lastUpdated: string;
}

type LoanProductRow = {
  bankName: string;
  loanType: string;
  interestRate: any;
  interestRateMax: any;
  loanTerm: number | null;
  processingFee: any;
  minimumIncome: any;
  maxLoanAmount: any;
  eligibilityRequirements: string | null;
  sourceUrl: string | null;
  lastUpdated: Date;
};

const prisma = new PrismaClient();

export function normalizeLoanType(input: string): LoanProductType {
  const value = input.trim().toLowerCase();

  if (value === 'home' || value.includes('home') || value.includes('housing') || value.includes('mortgage')) {
    return 'HOME';
  }
  if (value === 'personal' || value.includes('personal') || value.includes('consumer')) {
    return 'PERSONAL';
  }
  if (value === 'education' || value.includes('education') || value.includes('study') || value.includes('student')) {
    return 'EDUCATION';
  }
  if (value === 'business' || value.includes('business') || value.includes('sme') || value.includes('enterprise')) {
    return 'BUSINESS';
  }
  if (value === 'auto' || value.includes('auto') || value.includes('vehicle') || value.includes('hire purchase') || value.includes('car')) {
    return 'AUTO';
  }

  throw new Error(`Unsupported loan type: ${input}`);
}

function toNumber(value: any): number | null {
  if (value === null || value === undefined) return null;
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export class LoanProductsService {
  static async compare(input: CompareLoanProductsInput): Promise<LoanProductComparison[]> {
    const limit = input.limit ?? 50;

    const conditions: Prisma.Sql[] = [
      Prisma.sql`LOWER("loan_type") = LOWER(${input.loanType})`,
    ];

    if (typeof input.loanAmount === 'number') {
      conditions.push(Prisma.sql`("max_loan_amount" IS NULL OR "max_loan_amount" >= ${input.loanAmount})`);
    }

    if (typeof input.durationMonths === 'number') {
      conditions.push(Prisma.sql`("loan_term" IS NULL OR "loan_term" >= ${input.durationMonths})`);
    }

    const whereSql = Prisma.sql`WHERE ${Prisma.join(conditions, Prisma.sql` AND `)}`;

    const rows = await prisma.$queryRaw<LoanProductRow[]>(Prisma.sql`
      SELECT
        "bank_name" AS "bankName",
        "loan_type" AS "loanType",
        "interest_rate" AS "interestRate",
        "interest_rate_max" AS "interestRateMax",
        "loan_term" AS "loanTerm",
        "processing_fee" AS "processingFee",
        "minimum_income" AS "minimumIncome",
        "max_loan_amount" AS "maxLoanAmount",
        "eligibility_requirements" AS "eligibilityRequirements",
        "source_url" AS "sourceUrl",
        "last_updated" AS "lastUpdated"
      FROM "loan_products"
      ${whereSql}
      ORDER BY "interest_rate" ASC, "bank_name" ASC
      LIMIT ${limit};
    `);

    return rows.map((row) => ({
      bankName: row.bankName,
      loanType: row.loanType,
      interestRate: toNumber(row.interestRate) ?? 0,
      interestRateMax: toNumber(row.interestRateMax),
      loanTerm: row.loanTerm,
      processingFee: toNumber(row.processingFee),
      minimumIncome: toNumber(row.minimumIncome),
      maxLoanAmount: toNumber(row.maxLoanAmount),
      eligibilityRequirements: row.eligibilityRequirements,
      sourceUrl: row.sourceUrl,
      lastUpdated: row.lastUpdated.toISOString(),
    }));
  }
}
