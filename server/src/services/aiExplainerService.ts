import { Concept, Lesson } from './educationTypes';

export interface AIExplanationRequest {
  concept?: string;
  question?: string;
  context?: {
    userLevel?: string;
    interestTopics?: string[];
  };
}

export interface AIExplanationResponse {
  explanation: string;
  keyPoints: string[];
  examples: ExampleExplanation[];
  relatedConcepts: string[];
  nextSteps: string[];
  difficulty: 'simplified' | 'standard' | 'detailed';
}

interface ExampleExplanation {
  title: string;
  description: string;
  calculation?: string;
}

const CONCEPT_EXPLANATIONS: Record<string, Partial<AIExplanationResponse>> = {
  'compound_interest': {
    keyPoints: [
      'Compound interest earns interest on interest',
      'Time is your biggest advantage when compounding',
      'Small differences in returns create massive differences over time',
    ],
    examples: [
      {
        title: 'The Rule of 72',
        description: 'Divide 72 by your annual return to estimate years to double your money',
        calculation: '72 ÷ 10% = 7.2 years to double',
      },
      {
        title: 'NPR 10,000 Example',
        description: 'At 10% annual return over 30 years: NPR 10k becomes NPR 174k',
      },
    ],
    nextSteps: [
      'Try our compound growth calculator',
      'Learn about different investment vehicles',
      'Start investing early',
    ],
  },
  'diversification': {
    keyPoints: [
      'Don\'t put all eggs in one basket',
      'Spread across asset classes, sectors, and geographies',
      'Reduces risk without necessarily reducing returns',
    ],
    examples: [
      {
        title: 'Simple Diversification',
        description: '50% stocks, 30% bonds, 20% cash provides stability and growth',
      },
    ],
    nextSteps: [
      'Calculate your current diversification',
      'Learn about asset allocation models',
      'Use our portfolio builder simulator',
    ],
  },
  'roe': {
    keyPoints: [
      'Measures how efficiently a company uses shareholder money',
      'Higher ROE = better management',
      'Compare within same industry',
    ],
    examples: [
      {
        title: 'ROE Calculation',
        description: 'ROE = Net Income ÷ Shareholder Equity × 100',
        calculation: 'NPR 1Cr ÷ NPR 10Cr × 100 = 10%',
      },
    ],
    nextSteps: [
      'Compare ROE across Nepalese banks',
      'Learn about DuPont analysis',
      'Understand what affects ROE',
    ],
  },
  'pe_ratio': {
    keyPoints: [
      'Shows how much investors pay for each NPR of earnings',
      'Lower P/E may indicate undervalued',
      'Higher P/E may indicate growth expectations',
    ],
    examples: [
      {
        title: 'P/E Example',
        description: 'Stock price NPR 450, EPS NPR 36 → P/E = 12.5',
      },
    ],
    nextSteps: [
      'Compare P/E across sectors',
      'Learn about PEG ratio',
      'Understand limitations of P/E',
    ],
  },
  'nav': {
    keyPoints: [
      'NAV is the price per unit of a mutual fund',
      'Calculated daily based on underlying assets',
      'Unlike stocks, NAV moves less dramatically',
    ],
    examples: [
      {
        title: 'NAV Calculation',
        description: 'NAV = (Total Assets - Liabilities) ÷ Outstanding Units',
      },
    ],
    nextSteps: [
      'Compare different mutual funds by NAV',
      'Learn about fund performance vs NAV growth',
    ],
  },
  'dca': {
    keyPoints: [
      'Dollar Cost Averaging = investing fixed amounts regularly',
      'Reduces impact of market volatility',
      'Removes emotional decision-making',
    ],
    examples: [
      {
        title: 'DCA Example',
        description: 'Invest NPR 10,000 every month regardless of market conditions',
      },
    ],
    nextSteps: [
      'Use our DCA simulator',
      'Learn when DCA is most beneficial',
    ],
  },
};

export class AIExplainerService {
  async explain(request: AIExplanationRequest): Promise<AIExplanationResponse> {
    const { concept, question, context } = request;
    
    const userLevel = context?.userLevel || 'beginner';
    const isSimplified = userLevel === 'beginner';

    if (concept && CONCEPT_EXPLANATIONS[concept]) {
      return this.buildExplanation(CONCEPT_EXPLANATIONS[concept], isSimplified, concept);
    }

    if (question) {
      return this.answerQuestion(question, isSimplified);
    }

    return this.getDefaultExplanation();
  }

  private buildExplanation(
    base: Partial<AIExplanationResponse>,
    simplified: boolean,
    conceptId: string
  ): AIExplanationResponse {
    return {
      explanation: this.getExplanationText(conceptId, simplified),
      keyPoints: base.keyPoints || [],
      examples: base.examples || [],
      relatedConcepts: base.nextSteps || [],
      nextSteps: base.nextSteps || [],
      difficulty: simplified ? 'simplified' : 'standard',
    };
  }

  private getExplanationText(conceptId: string, simplified: boolean): string {
    const explanations: Record<string, { simplified: string; standard: string }> = {
      compound_interest: {
        simplified: 'Compound interest is like a snowball rolling downhill - it keeps getting bigger! When you earn interest on your interest, your money grows faster over time.',
        standard: 'Compound interest is the phenomenon where interest earned on an initial principal plus accumulated interest leads to exponential growth over time. This is distinct from simple interest, which is calculated only on the principal amount.',
      },
      diversification: {
        simplified: 'Diversification means not putting all your money in one place. If one investment goes down, others might go up, so you don\'t lose everything.',
        standard: 'Diversification is a risk management strategy that involves spreading investments across various financial instruments, industries, and other categories to optimize risk-adjusted returns.',
      },
      roe: {
        simplified: 'ROE shows how good a company is at making money from your investment. Higher ROE = better company.',
        standard: 'Return on Equity (ROE) is a financial metric that measures how efficiently a company uses shareholder equity to generate profits. It is calculated by dividing net income by shareholder equity.',
      },
      pe_ratio: {
        simplified: 'P/E tells you how expensive a stock is. A lower P/E might mean it\'s cheaper.',
        standard: 'The Price-to-Earnings (P/E) ratio is a valuation metric that compares a company\'s stock price to its earnings per share, indicating market expectations for growth.',
      },
      nav: {
        simplified: 'NAV is just the price of one unit of a mutual fund, calculated every day.',
        standard: 'Net Asset Value (NAV) represents the per-unit value of a mutual fund or ETF, calculated by dividing total assets minus liabilities by the number of outstanding shares.',
      },
      dca: {
        simplified: 'DCA means investing a fixed amount regularly, like NPR 5000 every month, no matter what the market does.',
        standard: 'Dollar Cost Averaging (DCA) is an investment strategy where an investor divides the total investment amount across periodic purchases to reduce the impact of volatility.',
      },
    };

    const exp = explanations[conceptId];
    return exp ? (simplified ? exp.simplified : exp.standard) : CONCEPT_EXPLANATIONS[conceptId]?.explanation || '';
  }

  private answerQuestion(question: string, simplified: boolean): AIExplanationResponse {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('risk')) {
      return {
        explanation: simplified 
          ? 'Risk in investing means you might lose some or all of your money. But usually, higher risk means higher potential returns.'
          : 'Investment risk refers to the possibility of losing some or all of your initial investment. Different risk types include market risk, inflation risk, liquidity risk, and concentration risk.',
        keyPoints: ['Higher risk often means higher potential returns', 'Diversification reduces risk', 'Understand your risk tolerance'],
        examples: [],
        relatedConcepts: ['diversification', 'risk_return'],
        nextSteps: ['Take our risk assessment', 'Learn about asset allocation'],
        difficulty: simplified ? 'simplified' : 'standard',
      };
    }

    if (lowerQuestion.includes('start investing')) {
      return {
        explanation: simplified
          ? 'Start with what you can afford! Even small amounts grow over time. Learn basics first, then start with mutual funds or index funds.'
          : 'Begin investing by establishing an emergency fund, paying off high-interest debt, understanding your risk tolerance, and starting with diversified low-cost investments.',
        keyPoints: ['Start early', 'Invest regularly', 'Stay diversified'],
        examples: [],
        relatedConcepts: ['compound_interest', 'diversification'],
        nextSteps: ['Take our beginner course', 'Try our investment simulators'],
        difficulty: simplified ? 'simplified' : 'standard',
      };
    }

    return this.getDefaultExplanation();
  }

  private getDefaultExplanation(): AIExplanationResponse {
    return {
      explanation: 'I can explain various investment concepts. Try asking about specific terms like P/E ratio, ROE, diversification, compound interest, or ask "How do I start investing?"',
      keyPoints: [],
      examples: [],
      relatedConcepts: [],
      nextSteps: ['Browse our lesson library', 'Take a course', 'Try our simulators'],
      difficulty: 'simplified',
    };
  }

  getRelatedConcepts(conceptId: string): string[] {
    return CONCEPT_EXPLANATIONS[conceptId]?.nextSteps || [];
  }
}

export const aiExplainerService = new AIExplainerService();
