import {
  Lesson,
  Course,
  Quiz,
  QuizQuestion,
  Concept,
  GlossaryTerm,
  LessonCategory,
  DifficultyLevel,
} from './educationTypes';

export const LESSON_CONTENT: Record<string, Lesson[]> = {
  basics: [
    {
      id: 'basics_1',
      title: 'Introduction to Investing',
      description: 'Learn the fundamentals of investing and why it matters for your financial future.',
      difficulty: 'beginner',
      category: 'basics',
      duration: 15,
      order: 1,
      prerequisites: [],
      learningObjectives: [
        'Understand what investing is',
        'Learn why investing beats saving',
        'Know the basic investment timeline',
      ],
      content: [
        {
          id: 'b1_1',
          type: 'lesson',
          title: 'What is Investing?',
          body: `Investing is the act of allocating money with the expectation of generating income or profit over time. Unlike saving, which preserves your money, investing puts your money to work to potentially grow.

**Key Difference: Saving vs Investing**
- Savings: Low risk, low return, liquid
- Investing: Higher risk, higher return, less liquid

**Why Invest?**
1. Beat inflation - Money sitting in savings loses purchasing power
2. Build wealth - Compound growth exponentially increases returns
3. Achieve financial goals - Reach retirement, buy a home, or build wealth faster

**The Power of Compound Growth**
When you earn returns on your returns, that's compounding. NPR 100 invested at 10% annually grows to:
- Year 1: NPR 110
- Year 10: NPR 259
- Year 20: NPR 673
- Year 30: NPR 1,745`,
        },
        {
          id: 'b1_2',
          type: 'interactive',
          title: 'Compound Interest Calculator',
          body: '',
          interactive: {
            type: 'calculator',
            config: {
              principal: { type: 'number', default: 10000, min: 1000, max: 1000000 },
              rate: { type: 'percentage', default: 10, min: 1, max: 30 },
              years: { type: 'number', default: 20, min: 1, max: 50 },
            },
          },
        },
      ],
    },
    {
      id: 'basics_2',
      title: 'Understanding Risk and Return',
      description: 'Learn about the relationship between risk and return in investing.',
      difficulty: 'beginner',
      category: 'basics',
      duration: 20,
      order: 2,
      prerequisites: ['basics_1'],
      learningObjectives: [
        'Understand risk-return tradeoff',
        'Identify different risk types',
        'Learn risk management strategies',
      ],
      content: [
        {
          id: 'b2_1',
          type: 'lesson',
          title: 'The Risk-Return Relationship',
          body: `The fundamental principle of investing: **Higher potential returns come with higher risk.**

**Risk Types:**
1. **Market Risk** - Overall market movements
2. **Inflation Risk** - Purchasing power erosion
3. **Interest Rate Risk** - Bond price changes
4. **Liquidity Risk** - Difficulty selling assets
5. **Concentration Risk** - Lack of diversification

**Risk Tolerance vs Risk Capacity**
- Risk Tolerance: Your emotional ability to handle losses
- Risk Capacity: Your financial ability to absorb losses

**Diversification**
Don't put all your eggs in one basket. Spread investments across:
- Asset classes (stocks, bonds, real estate)
- Sectors (banking, hydro, manufacturing)
- Geography (Nepal, India, US)`,
        },
      ],
    },
  ],
  stocks: [
    {
      id: 'stocks_1',
      title: 'Stock Market Fundamentals',
      description: 'Understand how the stock market works and how to evaluate stocks.',
      difficulty: 'beginner',
      category: 'stocks',
      duration: 25,
      order: 1,
      prerequisites: ['basics_1'],
      learningObjectives: [
        'Understand what stocks represent',
        'Learn about stock exchanges (NEPSE)',
        'Read basic stock information',
      ],
      content: [
        {
          id: 's1_1',
          type: 'lesson',
          title: 'What is a Stock?',
          body: `A stock (also called share) represents ownership in a company. When you buy a stock, you become a partial owner of that company.

**Key Terms:**
- **Market Cap** = Share Price × Shares Outstanding
- **P/E Ratio** = Price / Earnings per Share
- **Dividend** = Periodic profit distribution to shareholders
- **52-Week High/Low** = Price range over past year

**NEPSE (Nepal Stock Exchange)**
- Established 1993
- Over 200 listed companies
- Major indices: NEPSE Index, NEPSE 20

**Reading Stock Quotes:**
NBL: NPR 450 (+3.2%)
- Current price: NPR 450
- Change: +3.2% from previous close`,
        },
        {
          id: 's1_2',
          type: 'lesson',
          title: 'How to Analyze a Stock',
          body: `**Fundamental Analysis** evaluates a company's intrinsic value:
- Financial statements (revenue, profits, debt)
- Management quality
- Industry position
- Growth potential

**Key Financial Ratios:**
1. **P/E Ratio**: Price relative to earnings (lower may = undervalued)
2. **ROE**: Return on Equity (higher = better)
3. **D/E Ratio**: Debt to Equity (lower = less risky)
4. **Dividend Yield**: Annual dividend / price (higher = more income)`,
        },
      ],
    },
    {
      id: 'stocks_2',
      title: 'Stock Valuation Methods',
      description: 'Learn different methods to determine if a stock is undervalued or overvalued.',
      difficulty: 'intermediate',
      category: 'stocks',
      duration: 30,
      order: 2,
      prerequisites: ['stocks_1'],
      learningObjectives: [
        'Use P/E ratio for valuation',
        'Apply discounted cash flow basics',
        'Compare valuation methods',
      ],
      content: [
        {
          id: 's2_1',
          type: 'lesson',
          title: 'Valuation Methods',
          body: `**1. P/E Valuation**
Compare P/E to industry average and historical P/E.
- P/E 10 vs Industry 15 = potentially undervalued
- P/E 30 vs Industry 15 = potentially overvalued

**2. Price-to-Book (P/B)**
Useful for banks and asset-heavy companies.
- P/B < 1 may indicate bargain
- P/B > 3 may indicate premium

**3. Dividend Discount Model (DDM)**
Calculate present value of future dividends.
- Complex but fundamental for dividend stocks

**4. Relative Valuation**
Compare to similar companies in same sector`,
        },
      ],
    },
  ],
  mutual_funds: [
    {
      id: 'mf_1',
      title: 'Mutual Fund Basics',
      description: 'Learn about mutual funds and how to choose the right ones.',
      difficulty: 'beginner',
      category: 'mutual_funds',
      duration: 20,
      order: 1,
      prerequisites: ['basics_1'],
      learningObjectives: [
        'Understand mutual fund structure',
        'Know different fund types',
        'Evaluate fund performance',
      ],
      content: [
        {
          id: 'mf1_1',
          type: 'lesson',
          title: 'What is a Mutual Fund?',
          body: `A mutual fund pools money from many investors to purchase a diversified portfolio of stocks, bonds, or other securities.

**Benefits:**
- Professional management
- Instant diversification
- Liquidity
- Lower minimum investment

**Types of Mutual Funds:**

1. **By Asset Class:**
   - Equity Funds (stocks) - Higher risk, higher return
   - Debt Funds (bonds) - Lower risk, steady returns
   - Hybrid Funds - Mix of equity and debt

2. **By Structure:**
   - Open-ended: Buy/sell anytime
   - Closed-ended: Fixed tenure

3. **By Objective:**
   - Growth: Capital appreciation
   - Income: Regular dividends
   - Balanced: Both growth and income

**Key Terms:**
- NAV (Net Asset Value): Price per unit
- AUM: Assets Under Management
- Expense Ratio: Annual fee percentage`,
        },
      ],
    },
  ],
  risk_management: [
    {
      id: 'risk_1',
      title: 'Portfolio Diversification',
      description: 'Learn how to build a resilient portfolio through diversification.',
      difficulty: 'intermediate',
      category: 'risk_management',
      duration: 25,
      order: 1,
      prerequisites: ['stocks_1', 'basics_2'],
      learningObjectives: [
        'Understand diversification benefits',
        'Apply asset allocation strategies',
        'Rebalance portfolio effectively',
      ],
      content: [
        {
          id: 'r1_1',
          type: 'lesson',
          title: 'Diversification Strategy',
          body: `Diversification is the practice of spreading investments to reduce risk.

**Asset Allocation Models:**

1. **Conservative** (Lower risk)
   - Bonds: 60%
   - Stocks: 25%
   - Cash: 15%

2. **Moderate** (Balanced)
   - Stocks: 50%
   - Bonds: 35%
   - Cash: 15%

3. **Aggressive** (Higher risk)
   - Stocks: 75%
   - Bonds: 20%
   - Cash: 5%

**For Nepal Investors:**
- Banks: 30-40%
- Hydro Power: 20-25%
- Insurance: 10-15%
- Mutual Funds: 15-20%
- Others: 10-15%

**Rebalancing:**
Review and rebalance annually or when allocation drifts >5%.`,
        },
      ],
    },
  ],
};

export const QUIZZES: Quiz[] = [
  {
    id: 'quiz_basics_1',
    lessonId: 'basics_1',
    passingScore: 70,
    timeLimit: 600,
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What is the main difference between saving and investing?',
        options: [
          'Saving is safer than investing',
          'Investing has higher potential returns but more risk',
          'Saving generates higher returns',
          'There is no difference',
        ],
        correctAnswer: 'Investing has higher potential returns but more risk',
        explanation: 'Investing typically offers higher potential returns than saving, but comes with greater risk of loss.',
        points: 10,
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'Compound growth means you earn returns only on your initial investment.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Compound growth means you earn returns on your returns, leading to exponential growth over time.',
        points: 10,
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'NPR 10,000 invested at 10% annual return will be worth approximately how much after 20 years?',
        options: ['NPR 20,000', 'NPR 35,000', 'NPR 67,000', 'NPR 100,000'],
        correctAnswer: 'NPR 67,000',
        explanation: 'Using the rule of 72, doubling time is ~7.2 years. In 20 years, it approximately doubles almost 3 times: 10k → 20k → 40k → 80k (close to 67k with exact calculation).',
        points: 15,
      },
    ],
  },
  {
    id: 'quiz_stocks_1',
    lessonId: 'stocks_1',
    passingScore: 70,
    timeLimit: 600,
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What does P/E ratio measure?',
        options: [
          'Profit to Equity',
          'Price to Earnings',
          'Performance to Expectations',
          'Principal to Expenses',
        ],
        correctAnswer: 'Price to Earnings',
        explanation: 'P/E ratio = Market Price per Share / Earnings per Share. It shows how much investors pay for each unit of earnings.',
        points: 10,
      },
      {
        id: 'q2',
        type: 'multiple_choice',
        question: 'A higher P/E ratio generally indicates:',
        options: [
          'The stock is definitely overvalued',
          'Investors expect higher growth',
          'The company has high debt',
          'The stock is a bargain',
        ],
        correctAnswer: 'Investors expect higher growth',
        explanation: 'A higher P/E suggests investors are willing to pay more expecting higher future earnings growth.',
        points: 10,
      },
      {
        id: 'q3',
        type: 'fill_blank',
        question: 'The total market value of a company\'s outstanding shares is called _____.',
        options: [],
        correctAnswer: 'market cap',
        explanation: 'Market Capitalization = Share Price × Total Outstanding Shares.',
        points: 15,
      },
    ],
  },
];

export const CONCEPTS: Concept[] = [
  {
    id: 'compound_interest',
    name: 'Compound Interest',
    definition: 'Interest calculated on both the initial principal and accumulated interest.',
    explanation: 'Compound interest is called the "eighth wonder of the world" by Einstein. Unlike simple interest where you earn returns only on principal, compound interest earns returns on returns, creating exponential growth over time.',
    examples: [
      {
        title: 'Simple vs Compound',
        description: 'NPR 10,000 at 10% for 5 years: Simple = NPR 15,000, Compound = NPR 16,105',
      },
    ],
    relatedConcepts: ['interest', 'roi', 'exponential_growth'],
    category: 'basics',
    difficulty: 'beginner',
  },
  {
    id: 'diversification',
    name: 'Diversification',
    definition: 'Spreading investments across various assets to reduce risk.',
    explanation: 'Diversification works because different assets don\'t move together. When some decline, others may rise, smoothing overall portfolio returns.',
    examples: [
      {
        title: 'Asset Class Diversification',
        description: 'Mix stocks, bonds, and cash to reduce portfolio volatility.',
      },
    ],
    relatedConcepts: ['asset_allocation', 'risk', 'correlation'],
    category: 'risk_management',
    difficulty: 'beginner',
  },
  {
    id: 'nav',
    name: 'NAV (Net Asset Value)',
    definition: 'Per-unit value of a mutual fund calculated daily.',
    explanation: 'NAV represents the price at which you buy or sell mutual fund units. It\'s calculated by dividing total assets minus liabilities by number of outstanding units.',
    examples: [
      {
        title: 'NAV Calculation',
        description: 'If fund has NPR 10 Crore assets, NPR 1 Crore liabilities, and 1 Crore units: NAV = (10-1)/1 = NPR 9 per unit',
      },
    ],
    relatedConcepts: ['mutual_fund', 'aum', 'expense_ratio'],
    category: 'mutual_funds',
    difficulty: 'beginner',
  },
  {
    id: 'roe',
    name: 'ROE (Return on Equity)',
    definition: 'Measures profitability relative to shareholder equity.',
    explanation: 'ROE shows how efficiently a company uses shareholder money to generate profits. Higher ROE indicates better management efficiency.',
    examples: [
      {
        title: 'ROE Formula',
        calculation: 'ROE = Net Income / Shareholder Equity × 100',
        description: 'If Net Income = NPR 1 Crore and Equity = NPR 10 Crore, ROE = 10%',
      },
    ],
    relatedConcepts: ['profitability', 'financial_ratios', 'equity'],
    category: 'stocks',
    difficulty: 'intermediate',
  },
];

export const GLOSSARY: GlossaryTerm[] = [
  { term: 'Bull Market', definition: 'A market characterized by rising prices and optimism', relatedTerms: ['bear_market', 'market_trend'], category: 'market' },
  { term: 'Bear Market', definition: 'A market characterized by falling prices and pessimism', relatedTerms: ['bull_market', 'market_trend'], category: 'market' },
  { term: 'Market Cap', definition: 'Total market value of company shares', relatedTerms: ['stock_price', 'shares'], category: 'stocks' },
  { term: 'Dividend', definition: 'Profit distribution to shareholders', relatedTerms: ['dividend_yield', 'payout'], category: 'stocks' },
  { term: 'P/E Ratio', definition: 'Price to Earnings ratio', relatedTerms: ['valuation', 'earnings'], category: 'valuation' },
  { term: 'NAV', definition: 'Net Asset Value per unit', relatedTerms: ['mutual_fund', 'aum'], category: 'funds' },
  { term: 'AUM', definition: 'Assets Under Management', relatedTerms: ['nav', 'fund_size'], category: 'funds' },
  { term: 'Liquidity', definition: 'Ease of converting asset to cash', relatedTerms: ['marketability', 'trading_volume'], category: 'risk' },
  { term: 'Volatility', definition: 'Degree of price fluctuation', relatedTerms: ['risk', 'standard_deviation'], category: 'risk' },
  { term: 'ROI', definition: 'Return on Investment', relatedTerms: ['returns', 'profit'], category: 'performance' },
];

export const COURSES: Course[] = [
  {
    id: 'course_investing_basics',
    title: 'Investing Fundamentals',
    description: 'Master the basics of investing including risk, returns, and building your first portfolio.',
    difficulty: 'beginner',
    lessons: LESSON_CONTENT.basics,
    estimatedDuration: 120,
    certificate: true,
  },
  {
    id: 'course_stock_mastery',
    title: 'Stock Market Mastery',
    description: 'Learn to analyze stocks, understand valuations, and make informed investment decisions.',
    difficulty: 'intermediate',
    lessons: [...LESSON_CONTENT.stocks, ...LESSON_CONTENT.risk_management],
    estimatedDuration: 180,
    certificate: true,
  },
  {
    id: 'course_mutual_funds',
    title: 'Mutual Fund Investing',
    description: 'Understand mutual funds, ETFs, and how to build a diversified portfolio through funds.',
    difficulty: 'beginner',
    lessons: LESSON_CONTENT.mutual_funds,
    estimatedDuration: 90,
    certificate: true,
  },
];

export class EducationService {
  getCourses(): Course[] {
    return COURSES;
  }

  getCourseById(courseId: string): Course | undefined {
    return COURSES.find(c => c.id === courseId);
  }

  getLessonById(lessonId: string): Lesson | undefined {
    for (const lessons of Object.values(LESSON_CONTENT)) {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) return lesson;
    }
    return undefined;
  }

  getQuizForLesson(lessonId: string): Quiz | undefined {
    return QUIZZES.find(q => q.lessonId === lessonId);
  }

  getConceptsByCategory(category: LessonCategory): Concept[] {
    return CONCEPTS.filter(c => c.category === category);
  }

  getConceptById(conceptId: string): Concept | undefined {
    return CONCEPTS.find(c => c.id === conceptId);
  }

  searchGlossary(term: string): GlossaryTerm[] {
    const lower = term.toLowerCase();
    return GLOSSARY.filter(g => 
      g.term.toLowerCase().includes(lower) || 
      g.definition.toLowerCase().includes(lower)
    );
  }

  getLessonsByDifficulty(difficulty: DifficultyLevel): Lesson[] {
    const lessons: Lesson[] = [];
    for (const lessonArray of Object.values(LESSON_CONTENT)) {
      lessons.push(...lessonArray.filter(l => l.difficulty === difficulty));
    }
    return lessons.sort((a, b) => a.order - b.order);
  }

  getRecommendedLessons(userLevel: DifficultyLevel): Lesson[] {
    const difficultyOrder: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
    const currentIndex = difficultyOrder.indexOf(userLevel);
    const recommended: Lesson[] = [];

    for (let i = 0; i <= currentIndex; i++) {
      recommended.push(...this.getLessonsByDifficulty(difficultyOrder[i]));
    }

    return recommended.slice(0, 5);
  }
}

export const educationService = new EducationService();
