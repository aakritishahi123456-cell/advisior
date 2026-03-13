export type EnterpriseTier = 'professional' | 'institutional' | 'wholesale';
export type DataFrequency = 'realtime' | 'end_of_day' | 'historical';
export type ReportFormat = 'pdf' | 'excel' | 'json' | 'csv' | 'api';

export interface EnterpriseClient {
  id: string;
  name: string;
  type: 'hedge_fund' | 'bank' | 'investment_firm' | 'asset_manager' | 'insurance' | 'other';
  tier: EnterpriseTier;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  createdAt: Date;
  subscription: EnterpriseSubscription;
  features: EnterpriseFeatures;
  integrations: IntegrationConfig[];
}

export interface EnterpriseSubscription {
  planId: string;
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  monthlyPrice: number;
  annualPrice: number;
  status: 'active' | 'pending' | 'suspended' | 'cancelled';
}

export interface EnterpriseFeatures {
  realtimeData: boolean;
  bulkDataAccess: boolean;
  customReports: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  dedicatedSupport: boolean;
  sla: SLAAttributes;
  seats: number;
  dataRetention: number;
}

export interface SLAAttributes {
  uptime: number;
  dataLatency: number;
  supportResponseTime: number;
  resolutionTime: number;
}

export interface IntegrationConfig {
  id: string;
  type: 'api' | 'webhook' | 'sftp' | 'direct_connect';
  name: string;
  status: 'active' | 'pending' | 'failed';
  config: Record<string, any>;
  lastSync?: Date;
}

export interface MarketDataFeed {
  id: string;
  clientId: string;
  type: 'price' | 'news' | 'research' | 'sentiment' | 'predictions';
  frequency: DataFrequency;
  symbols: string[];
  fields: string[];
  format: ReportFormat;
  destination: string;
  schedule?: string;
  status: 'active' | 'paused' | 'stopped';
}

export interface BulkDataRequest {
  id: string;
  clientId: string;
  type: 'historical' | 'snapshot' | 'streaming';
  dataTypes: string[];
  symbols: string[];
  startDate?: Date;
  endDate?: Date;
  format: ReportFormat;
  status: 'processing' | 'ready' | 'delivered' | 'expired';
  downloadUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface CustomReport {
  id: string;
  clientId: string;
  name: string;
  description: string;
  type: 'portfolio' | 'performance' | 'risk' | 'compliance' | 'regulatory';
  schedule?: string;
  parameters: ReportParameter[];
  lastGenerated?: Date;
  status: 'active' | 'paused';
}

export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'array';
  required: boolean;
  defaultValue?: any;
}

export interface AnalyticsWidget {
  id: string;
  clientId: string;
  type: 'chart' | 'table' | 'metric' | 'map' | 'heatmap';
  title: string;
  dataSource: string;
  config: WidgetConfig;
  position: { x: number; y: number; w: number; h: number };
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'candlestick' | 'area';
  timeRange?: string;
  refreshInterval?: number;
  filters?: Record<string, any>;
}

export interface Dashboard {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  widgets: AnalyticsWidget[];
  sharedWith: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertRule {
  id: string;
  clientId: string;
  name: string;
  type: 'price' | 'volume' | 'sentiment' | 'news' | 'technical' | 'regulatory';
  conditions: AlertCondition[];
  actions: AlertAction[];
  status: 'active' | 'paused';
  createdAt: Date;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'crosses';
  value: number;
}

export interface AlertAction {
  type: 'email' | 'sms' | 'webhook' | 'push';
  config: Record<string, any>;
}

export interface ResearchReport {
  id: string;
  clientId: string;
  title: string;
  type: 'sector' | 'company' | 'market' | 'theme';
  publishedAt: Date;
  authors: string[];
  summary: string;
  content: string;
  symbols: string[];
  price: number;
  accessLevel: 'public' | 'premium' | 'exclusive';
}

export interface InstitutionalWatchlist {
  id: string;
  clientId: string;
  name: string;
  symbols: string[];
  alerts: boolean;
  sharedWith: string[];
  createdBy: string;
}
