export type StandardSector = 
  | 'technology'
  | 'healthcare'
  | 'financials'
  | 'consumer_discretionary'
  | 'consumer_staples'
  | 'energy'
  | 'utilities'
  | 'real_estate'
  | 'industrials'
  | 'materials'
  | 'telecommunications'
  | 'basic_materials'
  | 'commodities'
  | 'other';

export interface SectorMapping {
  standard: StandardSector;
  gics: string;
  icb: string;
  nepses: string;
  nses: string;
  bses: string;
  aliases: string[];
}

export const SECTOR_MAPPINGS: SectorMapping[] = [
  {
    standard: 'technology',
    gics: 'Information Technology',
    icb: 'Technology',
    nepses: 'Mutual Fund',
    nses: 'Technology',
    bses: 'Technology',
    aliases: ['it', 'software', 'tech', 'information technology', 'computers', 'it services', 'software services', 'tech stocks'],
  },
  {
    standard: 'financials',
    gics: 'Financials',
    icb: 'Financials',
    nepses: 'Commercial Banks',
    nses: 'Financial Services',
    bses: 'Financial Services',
    aliases: ['bank', 'banking', 'financial', 'finance', 'insurance', 'nbfc', 'nbfc', 'mutual fund', 'amc', 'investment'],
  },
  {
    standard: 'healthcare',
    gics: 'Health Care',
    icb: 'Health Care',
    nepses: 'Hydro Power',
    nses: 'Healthcare',
    bses: 'Healthcare',
    aliases: ['healthcare', 'health', 'pharma', 'pharmaceutical', 'hospital', 'medical', 'biotech', 'biotechnology', 'life sciences'],
  },
  {
    standard: 'consumer_discretionary',
    gics: 'Consumer Discretionary',
    icb: 'Consumer Discretionary',
    nepses: 'Hotels And Tourism',
    nses: 'Consumer Durables',
    bses: 'Consumer Discretionary',
    aliases: ['consumer discretionary', 'retail', 'automobile', 'auto', 'luxury', 'entertainment', 'media', 'tourism', 'hotels'],
  },
  {
    standard: 'consumer_staples',
    gics: 'Consumer Staples',
    icb: 'Consumer Staples',
    nepses: 'Manufacturing And Processing',
    nses: 'Fast Moving Consumer Goods',
    bses: 'Consumer Staples',
    aliases: ['consumer staples', 'fmcg', 'food', 'beverage', 'agriculture', 'consumer goods', 'distillery', 'breweries'],
  },
  {
    standard: 'energy',
    gics: 'Energy',
    icb: 'Energy',
    nepses: 'Hydro Power',
    nses: 'Oil & Gas',
    bses: 'Energy',
    aliases: ['energy', 'oil', 'gas', 'power', 'renewable', 'hydro', 'solar', 'wind', 'utilities', 'electricity'],
  },
  {
    standard: 'utilities',
    gics: 'Utilities',
    icb: 'Utilities',
    nepses: 'Hydro Power',
    nses: 'Power',
    bses: 'Utilities',
    aliases: ['utilities', 'power', 'electricity', 'water', 'gas distribution', 'renewable energy'],
  },
  {
    standard: 'real_estate',
    gics: 'Real Estate',
    icb: 'Real Estate',
    nepses: 'Hotels And Tourism',
    nses: 'Real Estate',
    bses: 'Real Estate',
    aliases: ['real estate', 'property', 'housing', 'construction', 'infra', 'infrastructure', 'development'],
  },
  {
    standard: 'industrials',
    gics: 'Industrials',
    icb: 'Industrials',
    nepses: 'Manufacturing And Processing',
    nses: 'Capital Goods',
    bses: 'Industrials',
    aliases: ['industrials', 'manufacturing', 'engineering', 'construction', 'cement', 'steel', 'infrastructure'],
  },
  {
    standard: 'materials',
    gics: 'Materials',
    icb: 'Basic Materials',
    nepses: 'Manufacturing And Processing',
    nses: 'Materials',
    bses: 'Materials',
    aliases: ['materials', 'mining', 'metals', 'chemicals', 'steel', 'cement', 'paper', 'textile'],
  },
  {
    standard: 'telecommunications',
    gics: 'Communication Services',
    icb: 'Telecommunications',
    nepses: 'Mutual Fund',
    nses: 'Telecom',
    bses: 'Telecom',
    aliases: ['telecom', 'telecommunications', 'communication', 'isp', 'network', 'wireless', 'mobile'],
  },
  {
    standard: 'basic_materials',
    gics: 'Materials',
    icb: 'Basic Materials',
    nepses: 'Manufacturing And Processing',
    nses: 'Metals & Mining',
    bses: 'Metals & Minerals',
    aliases: ['basic materials', 'mining', 'metals', 'minerals', 'coal', 'iron', 'aluminum', 'copper'],
  },
  {
    standard: 'commodities',
    gics: 'Energy',
    icb: 'Commodities',
    nepses: 'Hydro Power',
    nses: 'Commodities',
    bses: 'Commodities',
    aliases: ['commodities', 'commodity', 'crude', 'gold', 'silver', 'precious metals', 'agricultural commodities'],
  },
];

export const MARKET_SECTOR_CODES: Record<string, Record<string, string>> = {
  NEPSE: {
    'Commercial Banks': 'financials',
    'Development Banks': 'financials',
    'Finance Companies': 'financials',
    'Mutual Fund': 'technology',
    'Hotels And Tourism': 'consumer_discretionary',
    'Manufacturing And Processing': 'consumer_staples',
    'Hydro Power': 'energy',
    'Trading': 'consumer_discretionary',
    'Others': 'other',
  },
  NSE: {
    'Technology': 'technology',
    'Financial Services': 'financials',
    'Healthcare': 'healthcare',
    'Consumer Durables': 'consumer_discretionary',
    'Fast Moving Consumer Goods': 'consumer_staples',
    'Oil & Gas': 'energy',
    'Power': 'utilities',
    'Real Estate': 'real_estate',
    'Capital Goods': 'industrials',
    'Materials': 'materials',
    'Telecom': 'telecommunications',
    'Metals & Mining': 'basic_materials',
  },
  BSE: {
    'Technology': 'technology',
    'Financial Services': 'financials',
    'Healthcare': 'healthcare',
    'Consumer Discretionary': 'consumer_discretionary',
    'Consumer Staples': 'consumer_staples',
    'Energy': 'energy',
    'Utilities': 'utilities',
    'Real Estate': 'real_estate',
    'Industrials': 'industrials',
    'Materials': 'materials',
    'Telecom': 'telecommunications',
    'Metals & Minerals': 'basic_materials',
  },
  NYSE: {
    'Information Technology': 'technology',
    'Financials': 'financials',
    'Health Care': 'healthcare',
    'Consumer Discretionary': 'consumer_discretionary',
    'Consumer Staples': 'consumer_staples',
    'Energy': 'energy',
    'Utilities': 'utilities',
    'Real Estate': 'real_estate',
    'Industrials': 'industrials',
    'Materials': 'materials',
    'Communication Services': 'telecommunications',
  },
  NASDAQ: {
    'Technology': 'technology',
    'Healthcare': 'healthcare',
    'Consumer Discretionary': 'consumer_discretionary',
    'Financials': 'financials',
    'Communication Services': 'telecommunications',
    'Industrials': 'industrials',
  },
};

export class SectorClassifier {
  classify(
    sectorName: string,
    market: string,
    additionalKeywords: string[] = []
  ): StandardSector {
    const searchTerms = [
      sectorName.toLowerCase(),
      ...additionalKeywords.map(k => k.toLowerCase()),
    ];

    for (const mapping of SECTOR_MAPPINGS) {
      for (const term of searchTerms) {
        if (mapping.aliases.some(alias => term.includes(alias))) {
          return mapping.standard;
        }
      }
    }

    const marketCode = MARKET_SECTOR_CODES[market]?.[sectorName];
    if (marketCode) {
      return marketCode as StandardSector;
    }

    return 'other';
  }

  getStandardSector(market: string, sectorCode: string): StandardSector {
    return this.classify(sectorCode, market);
  }

  getGicsSector(standardSector: StandardSector): string {
    const mapping = SECTOR_MAPPINGS.find(m => m.standard === standardSector);
    return mapping?.gics || 'Unknown';
  }

  getIcbSector(standardSector: StandardSector): string {
    const mapping = SECTOR_MAPPINGS.find(m => m.standard === standardSector);
    return mapping?.icb || 'Unknown';
  }

  getAllStandardSectors(): StandardSector[] {
    return SECTOR_MAPPINGS.map(m => m.standard);
  }

  getSectorMappings(standardSector: StandardSector): SectorMapping | undefined {
    return SECTOR_MAPPINGS.find(m => m.standard === standardSector);
  }

  findSimilarSectors(sectorName: string, limit: number = 3): Array<{ sector: StandardSector; confidence: number }> {
    const results: Array<{ sector: StandardSector; confidence: number }> = [];
    const searchTerm = sectorName.toLowerCase();

    for (const mapping of SECTOR_MAPPINGS) {
      let confidence = 0;

      for (const alias of mapping.aliases) {
        if (searchTerm === alias) {
          confidence = 1;
          break;
        } else if (searchTerm.includes(alias) || alias.includes(searchTerm)) {
          confidence = Math.max(confidence, 0.8);
        } else {
          const words = searchTerm.split(' ');
          for (const word of words) {
            if (word && alias.includes(word)) {
              confidence = Math.max(confidence, 0.5);
            }
          }
        }
      }

      if (confidence > 0) {
        results.push({ sector: mapping.standard, confidence });
      }
    }

    return results.sort((a, b) => b.confidence - a.confidence).slice(0, limit);
  }
}

export const sectorClassifier = new SectorClassifier();
