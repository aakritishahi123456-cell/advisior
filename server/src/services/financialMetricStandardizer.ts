export type Market = 'NEPSE' | 'NSE' | 'BSE' | 'NYSE' | 'NASDAQ' | 'LSE' | 'TSE';

export interface StandardizedMetric {
  name: string;
  value: number;
  unit: string;
  period: string;
  normalized: boolean;
  source: string;
}

export interface RawFinancialData {
  market: Market;
  symbol: string;
  currency: string;
  fiscalYear?: string;
  period?: string;
  revenue?: number;
  netIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  equity?: number;
  cashFlow?: number;
  operatingCashFlow?: number;
  capitalExpenditure?: number;
  dividendPaid?: number;
  sharesOutstanding?: number;
  marketCap?: number;
  peRatio?: number;
  pbRatio?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  dividendYield?: number;
  eps?: number;
  bookValuePerShare?: number;
  priceToBook?: number;
  priceToSales?: number;
  enterpriseValue?: number;
  ebitda?: number;
  evToEbitda?: number;
  pegRatio?: number;
  beta?: number;
  week52High?: number;
  week52Low?: number;
  avgVolume?: number;
}

export interface StandardizedFinancialData extends Omit<RawFinancialData, 'currency' | 'market'> {
  id: string;
  normalizedId: string;
  symbol: string;
  baseCurrency: string;
  normalizedDate: string;
  fiscalYearEnd: string;
  standardMetrics: StandardizedMetric[];
  marketSource: string;
  originalData: RawFinancialData;
}

const METRIC_MAPPINGS: Record<string, { standard: string; unit: string; aliases: string[] }> = {
  revenue: { standard: 'revenue', unit: 'USD', aliases: ['sales', 'total_revenue', 'gross_revenue'] },
  netIncome: { standard: 'net_income', unit: 'USD', aliases: ['net_profit', 'profit_after_tax', 'pat'] },
  totalAssets: { standard: 'total_assets', unit: 'USD', aliases: ['total_assets', 'assets'] },
  totalLiabilities: { standard: 'total_liabilities', unit: 'USD', aliases: ['total_liabilities', 'liabilities'] },
  equity: { standard: 'shareholders_equity', unit: 'USD', aliases: ['shareholders_equity', 'net_worth', 'book_value'] },
  cashFlow: { standard: 'free_cash_flow', unit: 'USD', aliases: ['free_cash_flow', 'fcf'] },
  operatingCashFlow: { standard: 'operating_cash_flow', unit: 'USD', aliases: ['operating_cash_flow', 'ocf', 'cash_from_operations'] },
  capitalExpenditure: { standard: 'capex', unit: 'USD', aliases: ['capital_expenditure', 'capex'] },
  sharesOutstanding: { standard: 'shares_outstanding', unit: 'shares', aliases: ['shares_outstanding', 'diluted_shares'] },
  marketCap: { standard: 'market_cap', unit: 'USD', aliases: ['market_capitalization', 'market_cap'] },
  peRatio: { standard: 'pe_ratio', unit: 'ratio', aliases: ['price_to_earnings', 'p_e_ratio'] },
  pbRatio: { standard: 'pb_ratio', unit: 'ratio', aliases: ['price_to_book', 'p_b_ratio'] },
  roe: { standard: 'roe', unit: 'percentage', aliases: ['return_on_equity', 'roe'] },
  roa: { standard: 'roa', unit: 'percentage', aliases: ['return_on_assets', 'roa'] },
  debtToEquity: { standard: 'debt_to_equity', unit: 'ratio', aliases: ['debt_equity_ratio', 'd_e_ratio'] },
  currentRatio: { standard: 'current_ratio', unit: 'ratio', aliases: ['current_ratio'] },
  quickRatio: { standard: 'quick_ratio', unit: 'ratio', aliases: ['quick_ratio', 'acid_test'] },
  dividendYield: { standard: 'dividend_yield', unit: 'percentage', aliases: ['dividend_yield'] },
  eps: { standard: 'earnings_per_share', unit: 'USD', aliases: ['eps', 'basic_eps', 'diluted_eps'] },
  bookValuePerShare: { standard: 'book_value_per_share', unit: 'USD', aliases: ['bvps', 'book_value_per_share'] },
  priceToBook: { standard: 'price_to_book', unit: 'ratio', aliases: ['price_to_book', 'p_b'] },
  priceToSales: { standard: 'price_to_sales', unit: 'ratio', aliases: ['price_to_sales', 'p_s'] },
  enterpriseValue: { standard: 'enterprise_value', unit: 'USD', aliases: ['enterprise_value', 'ev'] },
  ebitda: { standard: 'ebitda', unit: 'USD', aliases: ['ebitda'] },
  evToEbitda: { standard: 'ev_to_ebitda', unit: 'ratio', aliases: ['ev_to_ebitda', 'enterprise_value_to_ebitda'] },
  pegRatio: { standard: 'peg_ratio', unit: 'ratio', aliases: ['price_to_earnings_growth', 'peg'] },
  beta: { standard: 'beta', unit: 'coefficient', aliases: ['beta', 'beta_coefficient'] },
  week52High: { standard: 'week52_high', unit: 'USD', aliases: ['fifty_two_week_high', 'year_high'] },
  week52Low: { standard: 'week52_low', unit: 'USD', aliases: ['fifty_two_week_low', 'year_low'] },
  avgVolume: { standard: 'avg_volume', unit: 'shares', aliases: ['average_volume', 'avg_daily_volume'] },
};

const MARKET_CURRENCIES: Record<Market, string> = {
  NEPSE: 'NPR',
  NSE: 'INR',
  BSE: 'INR',
  NYSE: 'USD',
  NASDAQ: 'USD',
  LSE: 'GBP',
  TSE: 'JPY',
};

const FISCAL_YEAR_ENDS: Record<Market, string> = {
  NEPSE: '07/15',
  NSE: '03/31',
  BSE: '03/31',
  NYSE: '12/31',
  NASDAQ: '12/31',
  LSE: '12/31',
  TSE: '03/31',
};

export class FinancialMetricStandardizer {
  standardize(rawData: RawFinancialData): StandardizedFinancialData {
    const marketCurrency = MARKET_CURRENCIES[rawData.market] || 'USD';
    const fiscalYearEnd = FISCAL_YEAR_ENDS[rawData.market] || '12/31';
    
    const standardMetrics = this.extractStandardMetrics(rawData);
    const normalizedDate = this.normalizeDate(rawData.period || rawData.fiscalYear || new Date().toISOString());
    
    return {
      id: `${rawData.market}:${rawData.symbol}:${normalizedDate}`,
      normalizedId: `${rawData.symbol.toUpperCase()}:${normalizedDate}`,
      symbol: rawData.symbol.toUpperCase(),
      baseCurrency: 'USD',
      normalizedDate,
      fiscalYearEnd,
      standardMetrics,
      marketSource: rawData.market,
      originalData: rawData,
    };
  }

  private extractStandardMetrics(rawData: RawFinancialData): StandardizedMetric[] {
    const metrics: StandardizedMetric[] = [];
    const data = rawData as any;

    for (const [key, mapping] of Object.entries(METRIC_MAPPINGS)) {
      if (data[key] !== undefined && data[key] !== null) {
        metrics.push({
          name: mapping.standard,
          value: Number(data[key]),
          unit: mapping.unit,
          period: rawData.period || rawData.fiscalYear || 'annual',
          normalized: false,
          source: rawData.market,
        });
      }
    }

    return metrics;
  }

  private normalizeDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  }

  getMetricAliases(): Record<string, string[]> {
    const aliases: Record<string, string[]> = {};
    for (const [key, mapping] of Object.entries(METRIC_MAPPINGS)) {
      aliases[mapping.standard] = mapping.aliases;
    }
    return aliases;
  }

  standardizeMetricName(name: string): string {
    const lower = name.toLowerCase();
    for (const [, mapping] of Object.entries(METRIC_MAPPINGS)) {
      if (mapping.standard === lower || mapping.aliases.includes(lower)) {
        return mapping.standard;
      }
    }
    return name;
  }
}

export const financialMetricStandardizer = new FinancialMetricStandardizer();
