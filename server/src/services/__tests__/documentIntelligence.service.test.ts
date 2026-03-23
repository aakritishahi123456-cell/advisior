const mockPrisma = {
  company: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  filing: {
    findMany: jest.fn(),
  },
}

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}))

describe('DocumentIntelligenceService', () => {
  let splitTextIntoPages: any
  let chunkPageText: any
  let DocumentIntelligenceService: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    ;({ splitTextIntoPages, chunkPageText, DocumentIntelligenceService } = require('../documentIntelligence.service'))
  })

  test('splits extracted PDF text into numbered pages', () => {
    const pages = splitTextIntoPages('Revenue rose strongly.\fNet profit improved further.\fAssets remained stable.')

    expect(pages).toEqual([
      { pageNumber: 1, text: 'Revenue rose strongly.' },
      { pageNumber: 2, text: 'Net profit improved further.' },
      { pageNumber: 3, text: 'Assets remained stable.' },
    ])
  })

  test('chunks long page text into small sections', () => {
    const chunks = chunkPageText(
      'Revenue increased due to higher lending. Net profit expanded on better margins. Capital adequacy stayed above the regulatory minimum.',
      4,
      70
    )

    expect(chunks).toEqual([
      { pageNumber: 4, content: 'Revenue increased due to higher lending.' },
      { pageNumber: 4, content: 'Net profit expanded on better margins.' },
      { pageNumber: 4, content: 'Capital adequacy stayed above the regulatory minimum.' },
    ])
  })

  test('answers questions using only relevant filing chunks', async () => {
    mockPrisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      symbol: 'NABIL',
      name: 'Nabil Bank Limited',
    })
    mockPrisma.filing.findMany.mockResolvedValue([
      {
        id: 'filing-1',
        type: 'ANNUAL_REPORT',
        uploadedAt: new Date('2024-07-15T00:00:00.000Z'),
        createdAt: new Date('2024-07-15T00:00:00.000Z'),
        chunks: [
          {
            pageNumber: 12,
            chunkIndex: 0,
            content: 'Revenue grew by 18 percent year over year due to strong loan book expansion.',
          },
          {
            pageNumber: 32,
            chunkIndex: 1,
            content: 'Net profit increased by 12 percent supported by lower funding costs and stable asset quality.',
          },
        ],
      },
    ])

    const result = await DocumentIntelligenceService.answerFromFilings({
      company: 'NABIL',
      question: 'What happened to net profit?',
    })

    expect(result).toEqual({
      answer: 'Net profit increased by 12 percent supported by lower funding costs and stable asset quality.',
      source: 'Annual Report 2024, Page 32',
    })
  })

  test('fails closed when no relevant filing content exists', async () => {
    mockPrisma.company.findUnique.mockResolvedValue({
      id: 'company-1',
      symbol: 'NABIL',
      name: 'Nabil Bank Limited',
    })
    mockPrisma.filing.findMany.mockResolvedValue([
      {
        id: 'filing-1',
        type: 'ANNUAL_REPORT',
        uploadedAt: new Date('2024-07-15T00:00:00.000Z'),
        createdAt: new Date('2024-07-15T00:00:00.000Z'),
        chunks: [
          {
            pageNumber: 1,
            chunkIndex: 0,
            content: 'Registered office details and board contact information.',
          },
        ],
      },
    ])

    const result = await DocumentIntelligenceService.answerFromFilings({
      company: 'NABIL',
      question: 'What is the EPS trend?',
    })

    expect(result).toEqual({
      answer: 'Insufficient data',
      source: null,
    })
  })
})
