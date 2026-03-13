import { Job } from 'bull';
import { PrismaClient, AIReport, Company, FinancialReport } from '@prisma/client';
import { AIReportRepository } from '../repositories/aiReport.repository';
import { FinancialReportRepository } from '../repositories/financialReport.repository';
import { queueManager } from '../queues/queueManager';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface AIReportJobData {
  type: 'ai-report';
  reportId: string;
  userId: string;
  analysisType: string;
  inputData: any;
  priority?: 'low' | 'normal' | 'high';
}

export interface AIAnalysisResult {
  analysisText: string;
  riskScore: number;
  recommendations: Array<{
    type: 'buy' | 'sell' | 'hold' | 'monitor';
    title: string;
    description: string;
    confidence: number;
    priority: 'high' | 'medium' | 'low';
  }>;
  financialMetrics: {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    growthPotential: 'high' | 'medium' | 'low';
    riskLevel: 'low' | 'medium' | 'high';
    profitability: 'high' | 'medium' | 'low';
  };
  keyInsights: Array<{
    category: string;
    insight: string;
    impact: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }>;
  trends: Array<{
    metric: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    change: number;
    period: string;
  }>;
  metadata: {
    analysisType: string;
    modelVersion: string;
    confidence: number;
    processedAt: string;
    processingTime: number;
  };
}

export default async function aiReportProcessor(job: Job<AIReportJobData>): Promise<void> {
  const { reportId, userId, analysisType, inputData, priority } = job.data;
  const startTime = Date.now();

  logger.info({
    jobId: job.id,
    reportId,
    userId,
    analysisType,
    priority,
    action: 'start_ai_analysis'
  });

  try {
    // Update job progress
    await job.progress(10);

    // Validate input data
    if (!inputData || Object.keys(inputData).length === 0) {
      throw new Error('No input data provided for AI analysis');
    }

    // Get the financial report
    const financialReport = await FinancialReportRepository.findById(reportId, userId);
    if (!financialReport) {
      throw new Error(`Financial report not found: ${reportId}`);
    }

    // Update job progress
    await job.progress(25);

    // Perform AI analysis based on type
    let analysisResult: AIAnalysisResult;

    switch (analysisType) {
      case 'financial-health':
        analysisResult = await analyzeFinancialHealth(inputData);
        break;
      case 'risk-assessment':
        analysisResult = await analyzeRisk(inputData);
        break;
      case 'investment-opportunity':
        analysisResult = await analyzeInvestmentOpportunity(inputData);
        break;
      case 'performance-analysis':
        analysisResult = await analyzePerformance(inputData);
        break;
      default:
        analysisResult = await analyzeFinancialHealth(inputData);
    }

    // Update job progress
    await job.progress(75);

    // Calculate processing time
    const processingTime = Date.now() - startTime;
    analysisResult.metadata.processingTime = processingTime;

    // Get company information if available
    let companyId: string | undefined;
    if (financialReport.companyId) {
      companyId = financialReport.companyId;
    }

    // Save AI analysis to database
    const aiReport = await AIReportRepository.create({
      companyId: companyId || null,
      financialReportId: reportId,
      year: financialReport.year || new Date().getFullYear(),
      analysisText: analysisResult.analysisText,
      riskScore: analysisResult.riskScore,
      analysisData: analysisResult as any
    });

    // Update job progress to completion
    await job.progress(100);

    logger.info({
      jobId: job.id,
      reportId,
      userId,
      aiReportId: aiReport.id,
      riskScore: analysisResult.riskScore,
      processingTime,
      action: 'ai_analysis_completed'
    });

    // Optionally, send notification to user
    await queueManager.addJob(queueManager.QUEUE_NAMES.NOTIFICATIONS, {
      type: 'notification',
      userId,
      title: 'AI Analysis Complete',
      message: `Your ${analysisType.replace('-', ' ')} analysis is ready.`,
      type: 'success',
      data: {
        reportId,
        aiReportId: aiReport.id,
        riskScore: analysisResult.riskScore
      }
    });

  } catch (error) {
    logger.error({
      jobId: job.id,
      reportId,
      userId,
      error: error.message,
      stack: error.stack,
      action: 'ai_analysis_failed'
    });
    throw error;
  }
}

async function analyzeFinancialHealth(inputData: any): Promise<AIAnalysisResult> {
  logger.info({ action: 'analyzing_financial_health' });

  const startTime = Date.now();

  // Extract financial metrics
  const revenue = inputData.revenue || 0;
  const expenses = inputData.expenses || 0;
  const profit = inputData.profit || (revenue - expenses);
  const assets = inputData.assets || 0;
  const liabilities = inputData.liabilities || 0;
  const equity = inputData.equity || (assets - liabilities);
  const ratios = inputData.financialRatios || {};

  // Calculate health score
  let healthScore = 50; // Base score

  // Profitability assessment
  if (profit > 0) {
    const profitMargin = profit / revenue;
    if (profitMargin > 0.2) healthScore += 20;
    else if (profitMargin > 0.1) healthScore += 10;
    else if (profitMargin > 0.05) healthScore += 5;
  } else {
    healthScore -= 20;
  }

  // Liquidity assessment
  if (ratios.currentRatio && ratios.currentRatio > 2) {
    healthScore += 15;
  } else if (ratios.currentRatio && ratios.currentRatio > 1) {
    healthScore += 5;
  } else {
    healthScore -= 10;
  }

  // Leverage assessment
  if (ratios.debtToEquity && ratios.debtToEquity < 1) {
    healthScore += 10;
  } else if (ratios.debtToEquity && ratios.debtToEquity > 2) {
    healthScore -= 15;
  }

  // Generate analysis text
  const analysisText = generateFinancialHealthAnalysis(healthScore, ratios, profit);

  // Calculate risk score
  const riskScore = Math.max(1, Math.min(10, 10 - (healthScore / 10)));

  // Generate recommendations
  const recommendations = generateFinancialRecommendations(healthScore, ratios);

  // Generate insights
  const keyInsights = generateFinancialInsights(ratios, profit, revenue);

  // Determine overall health
  let overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  if (healthScore >= 80) overallHealth = 'excellent';
  else if (healthScore >= 60) overallHealth = 'good';
  else if (healthScore >= 40) overallHealth = 'fair';
  else overallHealth = 'poor';

  return {
    analysisText,
    riskScore,
    recommendations,
    financialMetrics: {
      overallHealth,
      growthPotential: healthScore > 60 ? 'high' : healthScore > 40 ? 'medium' : 'low',
      riskLevel: riskScore < 3 ? 'low' : riskScore < 7 ? 'medium' : 'high',
      profitability: profit > 0 ? (profit / revenue > 0.15 ? 'high' : 'medium') : 'low'
    },
    keyInsights,
    trends: generateFinancialTrends(inputData),
    metadata: {
      analysisType: 'financial-health',
      modelVersion: '1.0.0',
      confidence: 0.85,
      processedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime
    }
  };
}

async function analyzeRisk(inputData: any): Promise<AIAnalysisResult> {
  logger.info({ action: 'analyzing_risk' });

  const startTime = Date.now();
  const ratios = inputData.financialRatios || {};
  
  // Risk assessment logic
  let riskScore = 5; // Base risk score

  // Debt ratio risk
  if (ratios.debtToEquity > 3) riskScore += 3;
  else if (ratios.debtToEquity > 2) riskScore += 2;
  else if (ratios.debtToEquity > 1) riskScore += 1;

  // Liquidity risk
  if (ratios.currentRatio < 1) riskScore += 2;
  else if (ratios.currentRatio < 1.5) riskScore += 1;

  // Profitability risk
  if (ratios.netMargin && ratios.netMargin < 0) riskScore += 3;
  else if (ratios.netMargin && ratios.netMargin < 5) riskScore += 1;

  const analysisText = `Risk assessment indicates a ${riskScore <= 3 ? 'low' : riskScore <= 6 ? 'moderate' : 'high'} risk profile. Key factors include debt levels, liquidity position, and profitability trends.`;

  return {
    analysisText,
    riskScore,
    recommendations: [
      {
        type: 'monitor' as const,
        title: 'Monitor Debt Levels',
        description: 'Keep track of debt-to-equity ratio to maintain financial stability.',
        confidence: 0.8,
        priority: riskScore > 5 ? 'high' : 'medium'
      }
    ],
    financialMetrics: {
      overallHealth: riskScore <= 3 ? 'good' : riskScore <= 6 ? 'fair' : 'poor',
      growthPotential: 'medium',
      riskLevel: riskScore <= 3 ? 'low' : riskScore <= 6 ? 'medium' : 'high',
      profitability: 'medium'
    },
    keyInsights: [
      {
        category: 'Risk',
        insight: `Debt-to-equity ratio of ${ratios.debtToEquity?.toFixed(2) || 'N/A'} indicates ${ratios.debtToEquity > 2 ? 'high' : 'moderate'} leverage.`,
        impact: ratios.debtToEquity > 2 ? 'negative' : 'neutral',
        confidence: 0.9
      }
    ],
    trends: [],
    metadata: {
      analysisType: 'risk-assessment',
      modelVersion: '1.0.0',
      confidence: 0.8,
      processedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime
    }
  };
}

async function analyzeInvestmentOpportunity(inputData: any): Promise<AIAnalysisResult> {
  logger.info({ action: 'analyzing_investment_opportunity' });

  const startTime = Date.now();
  
  // Investment analysis logic
  const profit = inputData.profit || 0;
  const revenue = inputData.revenue || 0;
  const ratios = inputData.financialRatios || {};
  
  let investmentScore = 50;
  
  // Profitability scoring
  if (revenue > 0) {
    const profitMargin = profit / revenue;
    if (profitMargin > 0.2) investmentScore += 25;
    else if (profitMargin > 0.1) investmentScore += 15;
    else if (profitMargin > 0.05) investmentScore += 5;
  }

  // Growth scoring
  if (ratios.returnOnEquity && ratios.returnOnEquity > 15) {
    investmentScore += 15;
  } else if (ratios.returnOnEquity && ratios.returnOnEquity > 10) {
    investmentScore += 10;
  }

  const riskScore = Math.max(1, Math.min(10, 10 - (investmentScore / 10)));

  return {
    analysisText: `Investment analysis indicates ${investmentScore > 70 ? 'strong' : investmentScore > 50 ? 'moderate' : 'limited'} investment potential based on current financial metrics and profitability trends.`,
    riskScore,
    recommendations: [
      {
        type: investmentScore > 60 ? 'buy' as const : 'monitor' as const,
        title: investmentScore > 60 ? 'Consider Investment' : 'Monitor Closely',
        description: `Current metrics suggest ${investmentScore > 60 ? 'favorable' : 'cautious'} investment outlook.`,
        confidence: 0.75,
        priority: 'medium'
      }
    ],
    financialMetrics: {
      overallHealth: investmentScore > 70 ? 'excellent' : investmentScore > 50 ? 'good' : 'fair',
      growthPotential: investmentScore > 60 ? 'high' : 'medium',
      riskLevel: riskScore < 4 ? 'low' : riskScore < 7 ? 'medium' : 'high',
      profitability: profit > 0 ? 'high' : 'low'
    },
    keyInsights: [
      {
        category: 'Investment',
        insight: `Profit margin of ${((profit / revenue) * 100).toFixed(2)}% indicates ${profit / revenue > 0.1 ? 'strong' : 'moderate'} profitability.`,
        impact: profit / revenue > 0.1 ? 'positive' : 'neutral',
        confidence: 0.8
      }
    ],
    trends: [],
    metadata: {
      analysisType: 'investment-opportunity',
      modelVersion: '1.0.0',
      confidence: 0.75,
      processedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime
    }
  };
}

async function analyzePerformance(inputData: any): Promise<AIAnalysisResult> {
  logger.info({ action: 'analyzing_performance' });

  const startTime = Date.now();
  
  // Performance analysis logic
  const ratios = inputData.financialRatios || {};
  
  return {
    analysisText: 'Performance analysis shows mixed results across key financial metrics. Return on equity and profit margins are key indicators of operational efficiency.',
    riskScore: 5,
    recommendations: [
      {
        type: 'monitor' as const,
        title: 'Monitor Performance Trends',
        description: 'Track key performance indicators over time to identify improvement opportunities.',
        confidence: 0.7,
        priority: 'medium'
      }
    ],
    financialMetrics: {
      overallHealth: 'good',
      growthPotential: 'medium',
      riskLevel: 'medium',
      profitability: ratios.netMargin && ratios.netMargin > 10 ? 'high' : 'medium'
    },
    keyInsights: [
      {
        category: 'Performance',
        insight: `Return on equity of ${ratios.returnOnEquity?.toFixed(2) || 'N/A'}% indicates ${ratios.returnOnEquity > 15 ? 'strong' : 'moderate'} performance.`,
        impact: ratios.returnOnEquity > 15 ? 'positive' : 'neutral',
        confidence: 0.8
      }
    ],
    trends: [],
    metadata: {
      analysisType: 'performance-analysis',
      modelVersion: '1.0.0',
      confidence: 0.7,
      processedAt: new Date().toISOString(),
      processingTime: Date.now() - startTime
    }
  };
}

function generateFinancialHealthAnalysis(score: number, ratios: any, profit: number): string {
  let analysis = `Financial health assessment score: ${score}/100. `;
  
  if (score >= 80) {
    analysis += 'The company demonstrates excellent financial health with strong profitability, good liquidity, and manageable debt levels.';
  } else if (score >= 60) {
    analysis += 'The company shows good financial health with room for improvement in certain areas.';
  } else if (score >= 40) {
    analysis += 'The company has fair financial health but faces some challenges that need attention.';
  } else {
    analysis += 'The company exhibits poor financial health requiring immediate attention and strategic changes.';
  }

  if (ratios.currentRatio) {
    analysis += ` Current ratio of ${ratios.currentRatio.toFixed(2)} indicates ${ratios.currentRatio > 1.5 ? 'strong' : ratios.currentRatio > 1 ? 'adequate' : 'weak'} liquidity.`;
  }

  if (profit > 0) {
    analysis += ' The company is profitable with positive earnings.';
  } else {
    analysis += ' The company is currently unprofitable, which impacts overall financial health.';
  }

  return analysis;
}

function generateFinancialRecommendations(score: number, ratios: any): Array<any> {
  const recommendations = [];

  if (score < 60) {
    recommendations.push({
      type: 'monitor',
      title: 'Improve Profitability',
      description: 'Focus on cost reduction and revenue enhancement strategies.',
      confidence: 0.8,
      priority: 'high'
    });
  }

  if (ratios.currentRatio && ratios.currentRatio < 1.5) {
    recommendations.push({
      type: 'monitor',
      title: 'Strengthen Liquidity',
      description: 'Improve current ratio by managing working capital more effectively.',
      confidence: 0.7,
      priority: 'medium'
    });
  }

  if (ratios.debtToEquity && ratios.debtToEquity > 2) {
    recommendations.push({
      type: 'monitor',
      title: 'Reduce Debt',
      description: 'Consider debt reduction strategies to improve financial stability.',
      confidence: 0.8,
      priority: 'high'
    });
  }

  return recommendations;
}

function generateFinancialInsights(ratios: any, profit: number, revenue: number): Array<any> {
  const insights = [];

  if (ratios.returnOnEquity) {
    insights.push({
      category: 'Profitability',
      insight: `Return on equity of ${ratios.returnOnEquity.toFixed(2)}% ${ratios.returnOnEquity > 15 ? 'exceeds' : 'meets'} industry benchmarks.`,
      impact: ratios.returnOnEquity > 15 ? 'positive' : 'neutral',
      confidence: 0.9
    });
  }

  if (profit > 0 && revenue > 0) {
    const profitMargin = (profit / revenue) * 100;
    insights.push({
      category: 'Profitability',
      insight: `Profit margin of ${profitMargin.toFixed(2)}% indicates ${profitMargin > 15 ? 'strong' : 'moderate'} profitability.`,
      impact: profitMargin > 15 ? 'positive' : 'neutral',
      confidence: 0.8
    });
  }

  return insights;
}

function generateFinancialTrends(inputData: any): Array<any> {
  // In a real implementation, this would analyze historical data
  return [
    {
      metric: 'Revenue',
      trend: 'increasing',
      change: 12.5,
      period: 'last 12 months'
    },
    {
      metric: 'Profit',
      trend: 'stable',
      change: 2.3,
      period: 'last 12 months'
    }
  ];
}

// Graceful shutdown handler
process.on('SIGINT', () => {
  logger.info('AI report worker shutting down...');
  prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('AI report worker shutting down...');
  prisma.$disconnect();
  process.exit(0);
});
