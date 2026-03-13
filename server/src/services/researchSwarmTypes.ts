export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed' | 'waiting';

export interface AgentCapability {
  name: string;
  description: string;
  parameters: string[];
}

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: AgentCapability[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryCount?: number;
}

export type AgentRole = 
  | 'company_analysis'
  | 'macro_trend'
  | 'market_sentiment'
  | 'portfolio_strategy'
  | 'orchestrator';

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'broadcast' | 'alert';
  content: AgentMessageContent;
  timestamp: Date;
  correlationId?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface AgentMessageContent {
  intent: string;
  payload: any;
  context?: Record<string, any>;
  requiresAction?: boolean;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  input: any;
  status: AgentStatus;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  dependencies?: string[];
}

export interface AgentResult {
  agentId: string;
  agentRole: AgentRole;
  success: boolean;
  data: any;
  confidence: number;
  sources: string[];
  timestamp: Date;
  processingTime: number;
  recommendations?: string[];
}

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  capabilities: AgentCapability[];
  status: AgentStatus;
  lastRun?: Date;
  metrics: AgentMetrics;
}

export interface AgentMetrics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  averageProcessingTime: number;
  lastSuccess?: Date;
  lastFailure?: Date;
}

export const DEFAULT_AGENT_CONFIGS: Record<AgentRole, Partial<AgentConfig>> = {
  company_analysis: {
    name: 'Company Analysis Agent',
    capabilities: [
      { name: 'analyze_financials', description: 'Analyze company financial statements', parameters: ['symbol', 'period'] },
      { name: 'calculate_metrics', description: 'Calculate key financial ratios', parameters: ['symbol', 'metrics'] },
      { name: 'assess_health', description: 'Assess financial health score', parameters: ['symbol'] },
      { name: 'compare', description: 'Compare multiple companies', parameters: ['symbols'] },
    ],
  },
  macro_trend: {
    name: 'Macro Trend Agent',
    capabilities: [
      { name: 'analyze_market', description: 'Analyze market trends', parameters: ['market', 'period'] },
      { name: 'track_sectors', description: 'Track sector performance', parameters: ['sectors'] },
      { name: 'identify_patterns', description: 'Identify market patterns', parameters: ['market'] },
      { name: 'forecast', description: 'Forecast market direction', parameters: ['market', 'timeframe'] },
    ],
  },
  market_sentiment: {
    name: 'Market Sentiment Agent',
    capabilities: [
      { name: 'analyze_news', description: 'Analyze financial news sentiment', parameters: ['symbols'] },
      { name: 'social_sentiment', description: 'Analyze social media sentiment', parameters: ['symbols'] },
      { name: 'investor_sentiment', description: 'Gauge investor sentiment', parameters: ['market'] },
      { name: 'trend_analysis', description: 'Analyze sentiment trends', parameters: ['symbols', 'period'] },
    ],
  },
  portfolio_strategy: {
    name: 'Portfolio Strategy Agent',
    capabilities: [
      { name: 'optimize', description: 'Optimize portfolio allocation', parameters: ['holdings', 'constraints'] },
      { name: 'rebalance', description: 'Suggest rebalancing', parameters: ['portfolio'] },
      { name: 'risk_assess', description: 'Assess portfolio risk', parameters: ['portfolio'] },
      { name: 'generate_report', description: 'Generate strategy report', parameters: ['type'] },
    ],
  },
  orchestrator: {
    name: 'Orchestrator Agent',
    capabilities: [
      { name: 'coordinate', description: 'Coordinate multi-agent tasks', parameters: ['tasks'] },
      { name: 'aggregate', description: 'Aggregate agent results', parameters: ['results'] },
      { name: 'synthesize', description: 'Synthesize final reports', parameters: ['data'] },
    ],
  },
};
