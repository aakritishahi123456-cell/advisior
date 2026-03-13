export interface CopilotConversation {
  id: string;
  userId: string;
  title: string;
  messages: CopilotMessage[];
  context: CopilotContext;
  createdAt: Date;
  updatedAt: Date;
}

export interface CopilotMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
  metadata?: MessageMetadata;
}

export interface MessageAttachment {
  type: 'company' | 'portfolio' | 'chart' | 'document';
  data: any;
}

export interface MessageMetadata {
  intent?: string;
  entities?: ExtractedEntity[];
  confidence?: number;
  sources?: string[];
}

export interface ExtractedEntity {
  type: 'company' | 'sector' | 'metric' | 'portfolio' | 'concept';
  value: string;
  confidence: number;
}

export interface CopilotContext {
  userId: string;
  subscriptionPlan: 'FREE' | 'PRO' | 'INVESTOR';
  portfolioIds?: string[];
  watchlist?: string[];
  preferences?: UserPreferences;
  recentAnalyses?: RecentAnalysis[];
}

export interface UserPreferences {
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short' | 'medium' | 'long';
  preferredSectors?: string[];
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  portfolioAlerts: boolean;
  marketNews: boolean;
  priceAlerts: boolean;
  researchUpdates: boolean;
  frequency: 'realtime' | 'daily' | 'weekly';
}

export interface RecentAnalysis {
  type: 'company' | 'sector' | 'market';
  entityId: string;
  timestamp: Date;
}

export interface CopilotResponse {
  message: string;
  type: 'text' | 'analysis' | 'recommendation' | 'chart' | 'table' | 'action';
  data?: any;
  sources?: Source[];
  actions?: CopilotAction[];
  suggestions?: string[];
  metadata: ResponseMetadata;
}

export interface Source {
  type: 'company' | 'news' | 'research' | 'market_data';
  id: string;
  title: string;
  url?: string;
  timestamp?: Date;
}

export interface CopilotAction {
  type: 'open_page' | 'run_analysis' | 'set_alert' | 'add_to_watchlist' | 'execute_trade';
  label: string;
  payload: any;
}

export interface ResponseMetadata {
  intent: string;
  confidence: number;
  processingTime: number;
  cached: boolean;
  tier: 'basic' | 'pro' | 'investor';
}

export interface Intent {
  name: string;
  description: string;
  examples: string[];
  requiredSlots: string[];
  tier: 'FREE' | 'PRO' | 'INVESTOR';
}

export const COPILOT_INTENTS: Intent[] = [
  {
    name: 'analyze_company',
    description: 'Analyze a company for investment potential',
    examples: [
      'Analyze NBL bank',
      'Is NMB Bank a good investment?',
      'Tell me about NIC Asia',
    ],
    requiredSlots: ['company_symbol'],
    tier: 'FREE',
  },
  {
    name: 'compare_companies',
    description: 'Compare multiple companies',
    examples: [
      'Compare NBL vs NMB',
      'Which is better, NBL or Prabhu Bank?',
    ],
    requiredSlots: ['company_symbols'],
    tier: 'PRO',
  },
  {
    name: 'get_investment_recommendation',
    description: 'Get personalized investment recommendations',
    examples: [
      'What should I invest in?',
      'Give me stock recommendations',
    ],
    requiredSlots: [],
    tier: 'PRO',
  },
  {
    name: 'explain_concept',
    description: 'Explain a financial concept',
    examples: [
      'What is ROE?',
      'Explain P/E ratio',
      'What does market cap mean?',
    ],
    requiredSlots: ['concept'],
    tier: 'FREE',
  },
  {
    name: 'portfolio_analysis',
    description: 'Analyze user portfolio',
    examples: [
      'How is my portfolio doing?',
      'Analyze my investments',
      'Show my portfolio performance',
    ],
    requiredSlots: [],
    tier: 'PRO',
  },
  {
    name: 'market_overview',
    description: 'Get market overview and trends',
    examples: [
      'How is the market doing?',
      'What is NEPSE doing today?',
      'Show market trends',
    ],
    requiredSlots: [],
    tier: 'FREE',
  },
  {
    name: 'set_price_alert',
    description: 'Set a price alert for a stock',
    examples: [
      'Alert me when NBL hits 500',
      'Set price alert for NMB',
    ],
    requiredSlots: ['company_symbol', 'price'],
    tier: 'PRO',
  },
  {
    name: 'financial_health',
    description: 'Check financial health of a company',
    examples: [
      'What is the financial health of NBL?',
      'Is NMB Bank financially healthy?',
    ],
    requiredSlots: ['company_symbol'],
    tier: 'PRO',
  },
  {
    name: 'risk_analysis',
    description: 'Analyze risk of an investment',
    examples: [
      'What is the risk of investing in NBL?',
      'Is NBL risky?',
    ],
    requiredSlots: ['company_symbol'],
    tier: 'PRO',
  },
  {
    name: 'sector_analysis',
    description: 'Analyze a specific sector',
    examples: [
      'How is the banking sector doing?',
      'Analyze the hydro power sector',
    ],
    requiredSlots: ['sector'],
    tier: 'INVESTOR',
  },
];
