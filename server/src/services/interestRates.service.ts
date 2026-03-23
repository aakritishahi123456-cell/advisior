import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type InterestRateProductType = 'loan' | 'fd' | 'savings'

type InterestRateRow = {
  id: string
  bankName: string
  productType: InterestRateProductType
  rate: number
  lastUpdated: Date
}

export class InterestRatesService {
  static normalizeProductType(productType?: string): InterestRateProductType | undefined {
    if (!productType) {
      return undefined
    }

    const value = productType.trim().toLowerCase()
    if (value === 'loan' || value === 'fd' || value === 'savings') {
      return value
    }

    throw new Error('product_type must be one of: loan, fd, savings')
  }

  static async getLatestRates(productType?: InterestRateProductType): Promise<InterestRateRow[]> {
    const productFilter = productType
      ? Prisma.sql`WHERE ir.product_type = ${productType}`
      : Prisma.empty

    const rows = await prisma.$queryRaw<InterestRateRow[]>(Prisma.sql`
      WITH ranked_rates AS (
        SELECT
          ir.id,
          ir.bank_name AS "bankName",
          ir.product_type AS "productType",
          ir.rate::float8 AS "rate",
          ir.last_updated AS "lastUpdated",
          ROW_NUMBER() OVER (
            PARTITION BY ir.bank_name, ir.product_type
            ORDER BY ir.last_updated DESC, ir.created_at DESC, ir.id DESC
          ) AS row_num
        FROM interest_rates ir
        ${productFilter}
      )
      SELECT
        id,
        "bankName",
        "productType",
        "rate",
        "lastUpdated"
      FROM ranked_rates
      WHERE row_num = 1
      ORDER BY "productType" ASC, "bankName" ASC
    `)

    return rows
  }

  static async buildAdvisorRateContext(message: string): Promise<string | null> {
    const lowered = message.toLowerCase()
    const likelyRateQuestion =
      lowered.includes('interest') ||
      lowered.includes('rate') ||
      lowered.includes('loan') ||
      lowered.includes('fd') ||
      lowered.includes('fixed deposit') ||
      lowered.includes('savings')

    if (!likelyRateQuestion) {
      return null
    }

    let productType: InterestRateProductType | undefined
    if (lowered.includes('fixed deposit') || lowered.includes(' fd')) {
      productType = 'fd'
    } else if (lowered.includes('savings')) {
      productType = 'savings'
    } else if (lowered.includes('loan')) {
      productType = 'loan'
    }

    const rows = await this.getLatestRates(productType)
    if (rows.length === 0) {
      return 'No interest rates are currently available in the interest_rates table.'
    }

    return rows
      .map((row) => {
        return `${row.bankName} | ${row.productType} | ${row.rate}% | updated ${row.lastUpdated.toISOString()}`
      })
      .join('\n')
  }
}
