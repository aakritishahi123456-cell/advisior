import { currencyService, CurrencyConversionResult } from './currencyService';
import { financialMetricStandardizer, RawFinancialData, StandardizedFinancialData } from './financialMetricStandardizer';
import { sectorClassifier, StandardSector, MARKET_SECTOR_CODES } from './sectorClassifier';

export interface RawMarketData {
  market: string;
  symbol: string;
  name?: string;
  sector?: string;
  industry?: string;
  currency: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  week52High?: number;
  week52Low?: number;
  financialData?: RawFinancialData;
}

export interface NormalizedCompanyData {
  id: string;
  normalizedId: string;
  symbol: string;
  name: string;
  standardSector: StandardSector;
  sectorMappings: {
    gics: string;
    icb: string;
    nepses: string;
    nses: string;
    bses: string;
  };
  baseCurrency: string;
  marketSource: string;
  pricing: {
    currentPrice: number;
    baseCurrencyPrice: number;
    change: number;
    changePercent: number;
    currencyConversion: CurrencyConversionResult;
  } | null;
  marketData: {
    marketCap: number | null;
    baseCurrencyMarketCap: number | null;
    peRatio: number | null;
    dividendYield: number | null;
    week52High: number | null;
    week52Low: number | null;
    volume: number | null;
  };
  financialData: StandardizedFinancialData | null;
  metadata: {
    originalSector: string | undefined;
    originalIndustry: string | undefined;
    normalizedAt: string;
    dataQuality: {
      currencyConverted: boolean;
      sectorMapped: boolean;
      metricsStandardized: boolean;
      completeness: number;
    };
  };
}

export interface DataNormalizationResult {
  success: boolean;
  data: NormalizedCompanyData | null;
  errors: string[];
  warnings: string[];
}

export interface BatchNormalizationResult {
  total: number;
  successful: number;
  failed: number;
  results: DataNormalizationResult[];
}

export class FinancialDataPipeline {
  private targetCurrency: string = 'USD';
  private enableCurrencyConversion: boolean = true;
  private enableSectorMapping: boolean = true;
  private enableMetricStandardization: boolean = true;

  configure(options: {
    targetCurrency?: string;
    enableCurrencyConversion?: boolean;
    enableSectorMapping?: boolean;
    enableMetricStandardization?: boolean;
  }): void {
    if (options.targetCurrency) {
      this.targetCurrency = options.targetCurrency;
    }
    if (options.enableCurrencyConversion !== undefined) {
      this.enableCurrencyConversion = options.enableCurrencyConversion;
    }
    if (options.enableSectorMapping !== undefined) {
      this.enableSectorMapping = options.enableSectorMapping;
    }
    if (options.enableMetricStandardization !== undefined) {
      this.enableMetricStandardization = options.enableMetricStandardization;
    }
  }

  async normalizeCompanyData(rawData: RawMarketData): Promise<DataNormalizationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    try {
      const symbol = rawData.symbol.toUpperCase();
      const originalSector = rawData.sector;
      const originalIndustry = rawData.industry;

      const standardSector = this.enableSectorMapping
        ? sectorClassifier.classify(rawData.sector || '', rawData.market, [rawData.industry || ''].filter(Boolean))
        : 'other' as StandardSector;

      const sectorMappings = sectorClassifier.getSectorMappings(standardSector) || {
        gics: 'Unknown',
        icb: 'Unknown',
        nepses: 'Unknown',
        nses: 'Unknown',
        bses: 'Unknown',
      };

      let pricing: NormalizedCompanyData['pricing'] = null;
      let currencyConversion: CurrencyConversionResult | null = null;

      if (this.enableCurrencyConversion && rawData.price) {
        const fromCurrency = rawData.currency.toUpperCase();
        
        if (fromCurrency !== this.targetCurrency) {
          try {
            currencyConversion = await currencyService.convert({
              amount: rawData.price,
              from: fromCurrency,
              to: this.targetCurrency,
            });
            
            pricing = {
              currentPrice: rawData.price,
              baseCurrencyPrice: currencyConversion.convertedAmount,
              change: rawData.change ? Math.round(rawData.change * currencyConversion.rate * 100) / 100 : 0,
              changePercent: rawData.changePercent || 0,
              currencyConversion,
            };
          } catch (e) {
            warnings.push(`Currency conversion failed for ${symbol}: ${e}`);
            pricing = {
              currentPrice: rawData.price,
              baseCurrencyPrice: rawData.price,
              change: rawData.change || 0,
              changePercent: rawData.changePercent || 0,
              currencyConversion: {
                originalAmount: rawData.price,
                convertedAmount: rawData.price,
                fromCurrency: fromCurrency,
                toCurrency: this.targetCurrency,
                rate: 1,
                date: new Date().toISOString().split('T')[0],
                source: 'fixed',
              },
            };
          }
        } else {
          pricing = {
            currentPrice: rawData.price,
            baseCurrencyPrice: rawData.price,
            change: rawData.change || 0,
            changePercent: rawData.changePercent || 0,
            currencyConversion: {
              originalAmount: rawData.price,
              convertedAmount: rawData.price,
              fromCurrency: fromCurrency,
              toCurrency: this.targetCurrency,
              rate: 1,
              date: new Date().toISOString().split('T')[0],
              source: 'fixed',
            },
          };
        }
      }

      let marketCapBase: number | null = null;
      if (rawData.marketCap && this.enableCurrencyConversion) {
        const fromCurrency = rawData.currency.toUpperCase();
        if (fromCurrency !== this.targetCurrency) {
          try {
            const conversion = await currencyService.convert({
              amount: rawData.marketCap,
              from: fromCurrency,
              to: this.targetCurrency,
            });
            marketCapBase = conversion.convertedAmount;
          } catch {
            marketCapBase = rawData.marketCap;
          }
        } else {
          marketCapBase = rawData.marketCap;
        }
      }

      let financialData: StandardizedFinancialData | null = null;
      if (rawData.financialData && this.enableMetricStandardization) {
        try {
          financialData = financialMetricStandardizer.standardize(rawData.financialData);
        } catch (e) {
          warnings.push(`Financial metric standardization failed for ${symbol}: ${e}`);
        }
      }

      const hasPricing = pricing !== null;
      const hasMarketData = rawData.marketCap !== undefined || rawData.peRatio !== undefined;
      const hasFinancials = financialData !== null;
      const completeness = (Number(hasPricing) + Number(hasMarketData) + Number(hasFinancials)) / 3;

      const normalized: NormalizedCompanyData = {
        id: `${rawData.market}:${symbol}`,
        normalizedId: `${symbol}:${this.targetCurrency}`,
        symbol,
        name: rawData.name || symbol,
        standardSector,
        sectorMappings,
        baseCurrency: this.targetCurrency,
        marketSource: rawData.market,
        pricing,
        marketData: {
          marketCap: rawData.marketCap || null,
          baseCurrencyMarketCap: marketCapBase,
          peRatio: rawData.peRatio || null,
          dividendYield: rawData.dividendYield || null,
          week52High: rawData.week52High || null,
          week52Low: rawData.week52Low || null,
          volume: rawData.volume || null,
        },
        financialData,
        metadata: {
          originalSector,
          originalIndustry,
          normalizedAt: new Date().toISOString(),
          dataQuality: {
            currencyConverted: this.enableCurrencyConversion && currencyConversion !== null,
            sectorMapped: this.enableSectorMapping && standardSector !== 'other',
            metricsStandardized: this.enableMetricStandardization && financialData !== null,
            completeness: Math.round(completeness * 100),
          },
        },
      };

      return {
        success: true,
        data: normalized,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(`Normalization failed: ${error}`);
      return {
        success: false,
        data: null,
        errors,
        warnings,
      };
    }
  }

  async normalizeBatch(rawDataList: RawMarketData[]): Promise<BatchNormalizationResult> {
    const results: DataNormalizationResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const rawData of rawDataList) {
      const result = await this.normalizeCompanyData(rawData);
      results.push(result);
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    return {
      total: rawDataList.length,
      successful,
      failed,
      results,
    };
  }

  async normalizeFinancialData(rawFinancialData: RawFinancialData): Promise<StandardizedFinancialData> {
    let standardized = financialMetricStandardizer.standardize(rawFinancialData);

    if (this.enableCurrencyConversion) {
      standardized = await this.convertFinancialDataToBase(standardized);
    }

    return standardized;
  }

  private async convertFinancialDataToBase(data: StandardizedFinancialData): Promise<StandardizedFinancialData> {
    const convertedMetrics = await Promise.all(
      data.standardMetrics.map(async (metric) => {
        if (metric.unit === 'USD' || metric.unit === 'NPR' || metric.unit === 'INR') {
          const conversion = await currencyService.convert({
            amount: metric.value,
            from: data.originalData.currency,
            to: this.targetCurrency,
          });
          return {
            ...metric,
            value: conversion.convertedAmount,
          };
        }
        return metric;
      })
    );

    return {
      ...data,
      standardMetrics: convertedMetrics,
      baseCurrency: this.targetCurrency,
    };
  }

  getTargetCurrency(): string {
    return this.targetCurrency;
  }

  isCurrencyConversionEnabled(): boolean {
    return this.enableCurrencyConversion;
  }

  isSectorMappingEnabled(): boolean {
    return this.enableSectorMapping;
  }

  isMetricStandardizationEnabled(): boolean {
    return this.enableMetricStandardization;
  }
}

export const financialDataPipeline = new FinancialDataPipeline();
