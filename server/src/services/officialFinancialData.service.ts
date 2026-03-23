import { FinancialExtractionService } from './financialExtraction.service'

type OfficialIngestionInput = {
  symbol: string
  year: number
  pdfUrl: string
  title?: string
  documentType?: string
  publishedAt?: string
}

export class OfficialFinancialDataService {
  static async ingestOfficialPdf(input: OfficialIngestionInput) {
    return FinancialExtractionService.ingestCompanyReport({
      symbol: input.symbol,
      year: input.year,
      pdfUrl: input.pdfUrl,
      title: input.title,
      documentType: input.documentType,
      publishedAt: input.publishedAt,
    })
  }
}
