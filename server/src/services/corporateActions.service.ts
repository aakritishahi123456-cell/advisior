import prisma from '../lib/prisma'
import { createError } from '../middleware/errorHandler'

type CompanyMatch = {
  id: string
  symbol: string
  name: string
}

function normalizeCompanyKey(company: string) {
  return company.trim()
}

async function resolveCompany(company: string): Promise<CompanyMatch> {
  const normalized = normalizeCompanyKey(company)
  const bySymbol = await prisma.company.findUnique({
    where: { symbol: normalized.toUpperCase() },
    select: { id: true, symbol: true, name: true },
  })

  if (bySymbol) {
    return bySymbol
  }

  const byName = await prisma.company.findFirst({
    where: {
      name: {
        equals: normalized,
        mode: 'insensitive',
      },
    },
    select: { id: true, symbol: true, name: true },
  })

  if (byName) {
    return byName
  }

  throw createError(`Company not found for ${company}.`, 404)
}

function deriveDividendType(dividend: {
  dividendType?: string | null
  isCash?: boolean
  isBonus?: boolean
}) {
  if (dividend.dividendType) {
    return dividend.dividendType
  }

  if (dividend.isCash && dividend.isBonus) {
    return 'cash_bonus'
  }

  if (dividend.isCash) {
    return 'cash'
  }

  if (dividend.isBonus) {
    return 'bonus'
  }

  return 'unknown'
}

function normalizeCorporateActionType(action: {
  actionType: { code: string; name: string }
}) {
  const code = action.actionType.code.trim().toUpperCase()

  if (code.includes('RIGHT')) {
    return 'rights_issue'
  }

  if (code.includes('MERGER')) {
    return 'merger'
  }

  if (code.includes('SPLIT')) {
    return 'split'
  }

  return code.toLowerCase()
}

export class CorporateActionsService {
  static async getCompanyCorporateActions(company: string) {
    const match = await resolveCompany(company)

    const [dividends, corporateActions] = await Promise.all([
      prisma.dividend.findMany({
        where: { companyId: match.id },
        orderBy: [{ paymentDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          corporateAction: {
            select: {
              announcementDate: true,
              exDate: true,
              ratio: true,
              sourceUrl: true,
              actionType: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.corporateAction.findMany({
        where: {
          companyId: match.id,
          actionType: {
            code: {
              in: ['SPLIT', 'STOCK_SPLIT', 'MERGER', 'MERGERS', 'RIGHTS_ISSUE', 'RIGHT_ISSUE'],
            },
          },
        },
        orderBy: [{ announcementDate: 'desc' }, { createdAt: 'desc' }],
        include: {
          actionType: {
            select: {
              code: true,
              name: true,
            },
          },
        },
      }),
    ])

    const normalizedDividends = dividends
      .map((dividend) => ({
        company_id: dividend.companyId,
        dividend_type: deriveDividendType(dividend),
        amount: dividend.dividendAmount ?? dividend.dividendPercentage ?? null,
        announcement_date: dividend.corporateAction?.announcementDate?.toISOString() ?? null,
        ex_date: dividend.corporateAction?.exDate?.toISOString() ?? null,
        fiscal_year: dividend.fiscalYear,
      }))
      .sort((left, right) => {
        const leftValue = left.announcement_date ?? ''
        const rightValue = right.announcement_date ?? ''
        return rightValue.localeCompare(leftValue)
      })

    const normalizedActions = corporateActions
      .map((action) => ({
        company_id: action.companyId,
        action_type: normalizeCorporateActionType(action),
        announcement_date: action.announcementDate.toISOString(),
        ex_date: action.exDate?.toISOString() ?? null,
        ratio: action.ratio ?? null,
        source_url: action.sourceUrl ?? null,
      }))
      .sort((left, right) => right.announcement_date.localeCompare(left.announcement_date))

    return {
      company: {
        id: match.id,
        symbol: match.symbol,
        name: match.name,
      },
      dividends: normalizedDividends,
      corporate_actions: normalizedActions,
    }
  }
}
