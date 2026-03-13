import {
  EnterpriseClient,
  EnterpriseTier,
  EnterpriseFeatures,
  MarketDataFeed,
  BulkDataRequest,
  CustomReport,
  Dashboard,
  AnalyticsWidget,
  AlertRule,
} from './enterpriseTypes';

export const ENTERPRISE_PLANS: Record<EnterpriseTier, EnterpriseFeatures & { price: number; name: string }> = {
  professional: {
    name: 'Professional',
    price: 499,
    realtimeData: true,
    bulkDataAccess: false,
    customReports: true,
    whiteLabel: false,
    apiAccess: true,
    dedicatedSupport: false,
    sla: { uptime: 99.5, dataLatency: 5000, supportResponseTime: 24, resolutionTime: 72 },
    seats: 5,
    dataRetention: 1,
  },
  institutional: {
    name: 'Institutional',
    price: 1999,
    realtimeData: true,
    bulkDataAccess: true,
    customReports: true,
    whiteLabel: true,
    apiAccess: true,
    dedicatedSupport: true,
    sla: { uptime: 99.9, dataLatency: 1000, supportResponseTime: 4, resolutionTime: 24 },
    seats: 25,
    dataRetention: 5,
  },
  wholesale: {
    name: 'Wholesale',
    price: 9999,
    realtimeData: true,
    bulkDataAccess: true,
    customReports: true,
    whiteLabel: true,
    apiAccess: true,
    dedicatedSupport: true,
    sla: { uptime: 99.99, dataLatency: 200, supportResponseTime: 1, resolutionTime: 4 },
    seats: -1,
    dataRetention: 10,
  },
};

export class EnterpriseService {
  private clients: Map<string, EnterpriseClient> = new Map();

  async createClient(data: Partial<EnterpriseClient>): Promise<EnterpriseClient> {
    const plan = ENTERPRISE_PLANS[data.tier || 'professional'];
    
    const client: EnterpriseClient = {
      id: `ent_${Date.now()}`,
      name: data.name || '',
      type: data.type || 'investment_firm',
      tier: data.tier || 'professional',
      contactEmail: data.contactEmail || '',
      createdAt: new Date(),
      subscription: {
        planId: data.tier || 'professional',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        monthlyPrice: plan.price,
        annualPrice: plan.price * 10,
        status: 'active',
      },
      features: {
        realtimeData: plan.realtimeData,
        bulkDataAccess: plan.bulkDataAccess,
        customReports: plan.customReports,
        whiteLabel: plan.whiteLabel,
        apiAccess: plan.apiAccess,
        dedicatedSupport: plan.dedicatedSupport,
        sla: plan.sla,
        seats: plan.seats,
        dataRetention: plan.dataRetention,
      },
      integrations: [],
    };

    this.clients.set(client.id, client);
    return client;
  }

  getClient(clientId: string): EnterpriseClient | undefined {
    return this.clients.get(clientId);
  }

  getPlans() {
    return Object.entries(ENTERPRISE_PLANS).map(([key, plan]) => ({
      tier: key,
      ...plan,
    }));
  }

  async createDataFeed(clientId: string, config: Partial<MarketDataFeed>): Promise<MarketDataFeed> {
    const feed: MarketDataFeed = {
      id: `feed_${Date.now()}`,
      clientId,
      type: config.type || 'price',
      frequency: config.frequency || 'end_of_day',
      symbols: config.symbols || [],
      fields: config.fields || ['price', 'volume', 'change'],
      format: config.format || 'json',
      destination: config.destination || '',
      schedule: config.schedule || '0 18 0 * *',
      status: 'active',
    };

    return feed;
  }

  async createBulkDataRequest(clientId: string, request: Partial<BulkDataRequest>): Promise<BulkDataRequest> {
    const bulkRequest: BulkDataRequest = {
      id: `bulk_${Date.now()}`,
      clientId,
      type: request.type || 'historical',
      dataTypes: request.dataTypes || ['price', 'financials'],
      symbols: request.symbols || [],
      startDate: request.startDate,
      endDate: request.endDate,
      format: request.format || 'csv',
      status: 'processing',
      createdAt: new Date(),
    };

    return bulkRequest;
  }

  async createDashboard(clientId: string, config: Partial<Dashboard>): Promise<Dashboard> {
    const dashboard: Dashboard = {
      id: `dash_${Date.now()}`,
      clientId,
      name: config.name || 'New Dashboard',
      description: config.description,
      widgets: config.widgets || [],
      sharedWith: config.sharedWith || [],
      createdBy: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dashboard;
  }

  async createAlert(clientId: string, config: Partial<AlertRule>): Promise<AlertRule> {
    const alert: AlertRule = {
      id: `alert_${Date.now()}`,
      clientId,
      name: config.name || '',
      type: config.type || 'price',
      conditions: config.conditions || [],
      actions: config.actions || [],
      status: 'active',
      createdAt: new Date(),
    };

    return alert;
  }

  async createCustomReport(clientId: string, config: Partial<CustomReport>): Promise<CustomReport> {
    const report: CustomReport = {
      id: `report_${Date.now()}`,
      clientId,
      name: config.name || '',
      description: config.description || '',
      type: config.type || 'portfolio',
      parameters: config.parameters || [],
      status: 'active',
    };

    return report;
  }

  generateAPIClientCredentials(clientId: string): { clientId: string; clientSecret: string; apiKey: string } {
    return {
      clientId: `ent_${clientId}`,
      clientSecret: `secret_${Math.random().toString(36).substr(2, 32)}`,
      apiKey: `fsa_ent_${Math.random().toString(36).substr(2, 24)}`,
    };
  }

  getUsageMetrics(clientId: string): {
    apiCalls: number;
    dataTransfer: number;
    seatsUsed: number;
    reportsGenerated: number;
    alertsTriggered: number;
  } {
    return {
      apiCalls: 125000,
      dataTransfer: 45.7,
      seatsUsed: 8,
      reportsGenerated: 45,
      alertsTriggered: 234,
    };
  }
}

export const enterpriseService = new EnterpriseService();
