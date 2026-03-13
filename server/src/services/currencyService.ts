import Redis from 'ioredis';

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  decimalPlaces: number;
  markets: string[];
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyConfig> = {
  NPR: {
    code: 'NPR',
    symbol: 'रू',
    name: 'Nepalese Rupee',
    decimalPlaces: 2,
    markets: ['NEPSE'],
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimalPlaces: 2,
    markets: ['NYSE', 'NASDAQ', 'AMEX'],
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    decimalPlaces: 2,
    markets: ['NSE', 'BSE'],
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimalPlaces: 2,
    markets: ['LSE', 'FX'],
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimalPlaces: 2,
    markets: ['LSE'],
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    decimalPlaces: 0,
    markets: ['TSE'],
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    decimalPlaces: 2,
    markets: ['SSE', 'SZSE'],
  },
};

export const CURRENCY_PAIRS: Record<string, string[]> = {
  USD: ['NPR', 'INR', 'EUR', 'GBP', 'JPY', 'CNY'],
  NPR: ['USD', 'INR'],
  INR: ['USD', 'NPR'],
};

export interface CurrencyConversionRequest {
  amount: number;
  from: string;
  to: string;
  date?: string;
}

export interface CurrencyConversionResult {
  originalAmount: number;
  convertedAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  date: string;
  source: 'fixed' | 'api' | 'cache';
}

const FALLBACK_RATES: ExchangeRates = {
  base: 'USD',
  date: new Date().toISOString().split('T')[0],
  rates: {
    USD: 1,
    NPR: 133.5,
    INR: 83.12,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.5,
    CNY: 7.24,
  },
};

export class CurrencyService {
  private redis: Redis;
  private ratesCache: Map<string, ExchangeRates> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 3600000;

  constructor(redisClient?: Redis) {
    this.redis = redisClient || new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
    const cacheKey = `exchange_rates:${baseCurrency}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    if (Date.now() - this.lastFetch < this.CACHE_TTL && this.ratesCache.has(baseCurrency)) {
      return this.ratesCache.get(baseCurrency)!;
    }

    try {
      const rates = await this.fetchLiveRates(baseCurrency);
      this.ratesCache.set(baseCurrency, rates);
      this.lastFetch = Date.now();
      await this.redis.setex(cacheKey, 3600, JSON.stringify(rates));
      return rates;
    } catch (error) {
      console.warn('Using fallback exchange rates:', error);
      return this.getFallbackRates(baseCurrency);
    }
  }

  private async fetchLiveRates(baseCurrency: string): Promise<ExchangeRates> {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const url = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${baseCurrency}`
      : `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }

    const data = await response.json() as any;
    return {
      base: baseCurrency,
      date: new Date().toISOString().split('T')[0],
      rates: data.rates || data.conversion_rates,
    };
  }

  private getFallbackRates(baseCurrency: string): ExchangeRates {
    const baseRates = FALLBACK_RATES.rates;
    const baseRate = baseRates[baseCurrency] || 1;
    
    const convertedRates: Record<string, number> = {};
    for (const [currency, rate] of Object.entries(baseRates)) {
      convertedRates[currency] = (rate as number) / baseRate;
    }

    return {
      base: baseCurrency,
      date: FALLBACK_RATES.date,
      rates: convertedRates,
    };
  }

  async convert(request: CurrencyConversionRequest): Promise<CurrencyConversionResult> {
    const { amount, from, to, date } = request;

    if (from === to) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        fromCurrency: from,
        toCurrency: to,
        rate: 1,
        date: date || new Date().toISOString().split('T')[0],
        source: 'fixed',
      };
    }

    const rates = await this.getExchangeRates('USD');
    const fromRate = rates.rates[from] || 1;
    const toRate = rates.rates[to] || 1;
    const rate = toRate / fromRate;

    return {
      originalAmount: amount,
      convertedAmount: Math.round(amount * rate * 100) / 100,
      fromCurrency: from,
      toCurrency: to,
      rate: Math.round(rate * 10000) / 10000,
      date: date || new Date().toISOString().split('T')[0],
      source: 'api',
    };
  }

  async convertToBase(
    amount: number,
    currency: string,
    baseCurrency: string = 'USD'
  ): Promise<number> {
    if (currency === baseCurrency) return amount;

    const rates = await this.getExchangeRates(baseCurrency);
    const currencyRate = rates.rates[currency];
    
    if (!currencyRate) {
      throw new Error(`Exchange rate not found for ${currency}`);
    }

    return Math.round((amount / currencyRate) * 100) / 100;
  }

  getSupportedCurrencies(): string[] {
    return Object.keys(SUPPORTED_CURRENCIES);
  }

  getCurrencyConfig(currencyCode: string) {
    return SUPPORTED_CURRENCIES[currencyCode.toUpperCase()];
  }

  isSupported(currency: string): boolean {
    return currency.toUpperCase() in SUPPORTED_CURRENCIES;
  }

  getAvailablePairs(): Array<{ from: string; to: string }> {
    const pairs: Array<{ from: string; to: string }> = [];
    
    for (const [from, targets] of Object.entries(CURRENCY_PAIRS)) {
      for (const to of targets as string[]) {
        pairs.push({ from, to });
      }
    }
    
    return pairs;
  }
}

export const currencyService = new CurrencyService();
