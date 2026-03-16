const { z } = require('zod');

// Schema representing the fundamental points a parser tries to extract
// The values map perfectly to the Prisma Database Schema.
const FinancialDataSchema = z.object({
    revenue: z.number().positive(),
    netIncome: z.number(),
    operatingIncome: z.number(),
    totalAssets: z.number().positive(),
    totalLiabilities: z.number().nonnegative(),
    equity: z.number(),
    eps: z.number(),
    sharesOutstanding: z.union([z.number(), z.string()]).transform((val) => BigInt(val)),
});

module.exports = {
    FinancialDataSchema,
};
