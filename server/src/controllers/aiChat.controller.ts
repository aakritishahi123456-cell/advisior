import { Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { INSUFFICIENT_DATA_MESSAGE } from '../services/aiSafety.service';
import { AIResponseCacheService } from '../services/aiResponseCache.service';
import { getAIRuntimeConfig, truncateToTokenLimit } from '../services/aiRuntime.service';

const prisma = new PrismaClient();

// ============== Input Validation ==============
const chatRequestSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  query: z.string().min(1, 'Query is required').max(2000, 'Query too long')
});

// ============== Types ==============
type IntentType = 'stock_analysis' | 'loan_advice' | 'portfolio_advice' | 'general';

interface ChatRequest {
  user_id: string;
  query: string;
}

interface ChatResponse {
  answer: string;
  sources: string[];
  confidence_score: number;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  income?: number;
  riskTolerance?: string;
  investmentHorizon?: number;
}

interface PortfolioData {
  portfolios: Array<{
    id: string;
    items: Array<{
      symbol: string;
      companyName: string;
      quantity: number;
      buyPrice: number;
      currentPrice: number;
      returns: number;
    }>;
  }>;
}

interface LoanData {
  simulations: Array<{
    id: string;
    loanAmount: number;
    interestRate: number;
    termMonths: number;
    monthlyPayment: number;
    totalInterest: number;
  }>;
}

interface FinancialReportData {
  reports: Array<{
    id: string;
    companySymbol: string;
    companyName: string;
    year: number;
    revenue: number;
    netProfit: number;
    totalAssets: number;
    totalEquity: number;
    totalDebt: number;
  }>;
}

// ============== Intent Detection ==============
const detectIntent = (query: string): IntentType => {
  const lowerQuery = query.toLowerCase();
  
  // Stock analysis keywords
  const stockKeywords = [
    'stock', 'share', 'share price', 'nepse', 'index', 'dividend',
    'company analysis', 'financial report', 'quarterly', 'annual',
    'profit', 'revenue', 'eps', 'pe ratio', 'market cap'
  ];
  
  // Loan advice keywords
  const loanKeywords = [
    'loan', 'borrow', 'credit', 'interest rate', 'mortgage', 'lending',
    'emi', 'repayment', 'collateral', 'eligibility', 'debt'
  ];
  
  // Portfolio advice keywords
  const portfolioKeywords = [
    'portfolio', 'invest', 'investment', 'allocation', 'diversify',
    'asset', 'returns', 'risk', 'rebalance', 'fund', 'mutual fund', 'etf'
  ];
  
  // Check for intent
  const stockScore = stockKeywords.filter(k => lowerQuery.includes(k)).length;
  const loanScore = loanKeywords.filter(k => lowerQuery.includes(k)).length;
  const portfolioScore = portfolioKeywords.filter(k => lowerQuery.includes(k)).length;
  
  if (stockScore > loanScore && stockScore > portfolioScore) {
    return 'stock_analysis';
  } else if (loanScore > stockScore && loanScore > portfolioScore) {
    return 'loan_advice';
  } else if (portfolioScore > stockScore && portfolioScore > loanScore) {
    return 'portfolio_advice';
  }
  
  return 'general';
};

// ============== Data Retrieval ==============
const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      financialProfiles: {
        select: {
          monthlyIncome: true,
          riskTolerance: true,
          investmentHorizonYears: true
        }
      }
    }
  });
  
  if (!user) return null;
  
  const profile = user.financialProfiles[0];
  
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    income: profile?.monthlyIncome ?? undefined,
    riskTolerance: profile?.riskTolerance ?? undefined,
    investmentHorizon: profile?.investmentHorizonYears ?? undefined
  };
};

const getPortfolioData = async (userId: string): Promise<PortfolioData> => {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          stock: {
            select: {
              symbol: true,
              name: true
            }
          }
        }
      }
    }
  });
  
  // Get current prices from NepsePrice
  const symbols = portfolios.flatMap(p => p.items.map(i => i.stock?.symbol).filter(Boolean)) as string[];
  
  const latestPrices = await prisma.$queryRaw<Array<{ symbol: string; close: number | null }>>`
    SELECT DISTINCT ON (symbol) symbol, close 
    FROM prices 
    WHERE symbol = ANY(${symbols})
    ORDER BY symbol, timestamp DESC
  `;
  
  const priceMap = new Map(latestPrices.map(p => [p.symbol, p.close]));
  
  return {
    portfolios: portfolios.map(p => ({
      id: p.id,
      items: p.items.map(item => ({
        symbol: item.stock?.symbol || '',
        companyName: item.stock?.name || '',
        quantity: Number(item.quantity),
        buyPrice: Number(item.buyPrice),
        currentPrice: priceMap.get(item.stock?.symbol || '') || 0,
        returns: Number(item.buyPrice) > 0 
          ? ((priceMap.get(item.stock?.symbol || '') || 0) - Number(item.buyPrice)) / Number(item.buyPrice) * 100
          : 0
      }))
    }))
  };
};

const getLoanData = async (userId: string): Promise<LoanData> => {
  const simulations = await prisma.loanSimulation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  return {
    simulations: simulations.map(sim => ({
      id: sim.id,
      loanAmount: Number(sim.amount),
      interestRate: Number(sim.rate),
      termMonths: sim.tenure,
      monthlyPayment: Number(sim.emi),
      totalInterest: Number(sim.totalInterest)
    }))
  };
};

const getFinancialReports = async (query: string): Promise<FinancialReportData> => {
  // Extract potential company symbols from query
  const symbolMatches = query.match(/[A-Z]{2,5}/g) || [];
  
  const reports = await prisma.financialReport.findMany({
    where: symbolMatches.length > 0 
      ? { company: { symbol: { in: symbolMatches } } }
      : undefined,
    include: {
      company: {
        select: {
          symbol: true,
          name: true
        }
      }
    },
    orderBy: { year: 'desc' },
    take: 10
  });
  
  return {
    reports: reports.map(r => ({
      id: r.id,
      companySymbol: r.company?.symbol || '',
      companyName: r.company?.name || '',
      year: r.year,
      revenue: Number(r.revenue),
      netProfit: Number(r.netProfit),
      totalAssets: Number(r.totalAssets),
      totalEquity: Number(r.totalEquity),
      totalDebt: Number(r.totalDebt)
    }))
  };
};

// ============== Prompt Building ==============
const buildSystemPrompt = (intent: IntentType, userProfile: UserProfile | null): string => {
  const basePrompt = `You are FinSathi, a Nepal-focused financial advisor AI. Your expertise includes:
- Nepal Stock Exchange (NEPSE) analysis
- Nepalese banking and loan products
- Investment portfolio management in NPR (Nepalese Rupees)
- Financial planning for Nepali individuals and businesses

Guidelines:
- Always consider the Nepalese context (currency in NPR, NEPSE regulations)
- Provide specific, actionable advice
- Include risk considerations relevant to the Nepal market
- When data is insufficient, clearly state so
- Format responses in a clear, professional manner`;

  if (userProfile) {
    const profileInfo = `\n\nUser Profile:
- Risk Tolerance: ${userProfile.riskTolerance || 'Not specified'}
- Monthly Income: NPR ${userProfile.income || 'Not specified'}
- Investment Horizon: ${userProfile.investmentHorizon ? `${userProfile.investmentHorizon} years` : 'Not specified'}`;
    
    return basePrompt + profileInfo;
  }
  
  return basePrompt;
};

const buildUserPrompt = (
  query: string,
  intent: IntentType,
  userProfile: UserProfile | null,
  portfolioData: PortfolioData,
  loanData: LoanData,
  financialReports: FinancialReportData
): string => {
  let prompt = `User Query: ${query}\n\n`;
  
  prompt += `Intent: ${intent}\n\n`;
  
  if (userProfile) {
    prompt += `User Profile:
- Name: ${userProfile.firstName || ''} ${userProfile.lastName || ''}
- Monthly Income: NPR ${userProfile.income || 'N/A'}
- Risk Tolerance: ${userProfile.riskTolerance || 'N/A'}
- Investment Horizon: ${userProfile.investmentHorizon ? `${userProfile.investmentHorizon} years` : 'N/A'}
\n`;
  }
  
  if (portfolioData.portfolios.length > 0) {
    prompt += `Portfolio Data:
${JSON.stringify(portfolioData, null, 2)}
\n`;
  }
  
  if (loanData.simulations.length > 0) {
    prompt += `Loan Data:
${JSON.stringify(loanData, null, 2)}
\n`;
  }
  
  if (financialReports.reports.length > 0) {
    prompt += `Financial Reports:
${JSON.stringify(financialReports, null, 2)}
\n`;
  }
  
  return prompt;
};

// ============== LLM Integration ==============
const callLLM = async (
  systemPrompt: string,
  userPrompt: string
): Promise<{ answer: string; sources: string[]; confidence: number }> => {
  const runtime = getAIRuntimeConfig()
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return {
      answer: INSUFFICIENT_DATA_MESSAGE,
      sources: [],
      confidence: 0,
    };
  }
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: runtime.chatModel,
        temperature: 0.3,
        max_tokens: runtime.maxOutputTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: truncateToTokenLimit(userPrompt, runtime.maxInputTokens) }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    const content = response.data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from LLM');
    }
    
    const parsed = JSON.parse(content);
    
    return {
      answer: parsed.answer || parsed.response || 'Analysis completed',
      sources: parsed.sources || [],
      confidence: parsed.confidence || 0.7
    };
  } catch (error) {
    logger.error('LLM call failed:', error);
    return {
      answer: INSUFFICIENT_DATA_MESSAGE,
      sources: [],
      confidence: 0,
    };
  }
};

// ============== Input Sanitization ==============
const sanitizeInput = (input: string): string => {
  // Remove potential prompt injection patterns
  let sanitized = input
    .replace(/system:|SYSTEM:|You are:|Ignore previous/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
  
  // Limit length
  if (sanitized.length > 2000) {
    sanitized = sanitized.substring(0, 2000);
  }
  
  return sanitized;
};

// ============== Main Handler ==============
export const handleChat = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const validatedInput = chatRequestSchema.parse(req.body);
  const { user_id, query } = validatedInput;
  
  // Sanitize input
  const sanitizedQuery = truncateToTokenLimit(sanitizeInput(query));
  
  if (!sanitizedQuery) {
    throw createError('Invalid query after sanitization', 400);
  }
  
  // Fetch user profile
  const userProfile = await getUserProfile(user_id);
  
  if (!userProfile) {
    throw createError('User not found', 404);
  }
  
  // Detect intent
  const intent = detectIntent(sanitizedQuery);

  const cached = await AIResponseCacheService.get<{
    response: ChatResponse
    metadata: { intent: IntentType; userId: string; processedAt: string }
  }>('legacy-ai-chat', {
    user_id,
    query: sanitizedQuery,
    intent,
  })

  if (cached) {
    return res.status(200).json({
      success: true,
      data: cached.response,
      metadata: cached.metadata,
    })
  }
  
  // Retrieve relevant data based on intent
  let portfolioData: PortfolioData = { portfolios: [] };
  let loanData: LoanData = { simulations: [] };
  let financialReports: FinancialReportData = { reports: [] };
  
  if (intent === 'portfolio_advice' || intent === 'general') {
    portfolioData = await getPortfolioData(user_id);
  }
  
  if (intent === 'loan_advice' || intent === 'general') {
    loanData = await getLoanData(user_id);
  }
  
  if (intent === 'stock_analysis' || intent === 'general') {
    financialReports = await getFinancialReports(sanitizedQuery);
  }
  
  // Build prompts
  const systemPrompt = buildSystemPrompt(intent, userProfile);
  const userPrompt = buildUserPrompt(
    sanitizedQuery,
    intent,
    userProfile,
    portfolioData,
    loanData,
    financialReports
  );

  const hasVerifiedData =
    financialReports.reports.length > 0 ||
    portfolioData.portfolios.length > 0 ||
    loanData.simulations.length > 0

  if (!hasVerifiedData) {
    const response: ChatResponse = {
      answer: INSUFFICIENT_DATA_MESSAGE,
      sources: [],
      confidence_score: 0
    };

    return res.status(200).json({
      success: true,
      data: response,
      metadata: {
        intent,
        userId: user_id,
        processedAt: new Date().toISOString()
      }
    });
  }
  
  // Call LLM
  const llmResponse = await callLLM(systemPrompt, userPrompt);
  
  // Build sources
  const sources: string[] = [];
  
  if (financialReports.reports.length > 0) {
    financialReports.reports.forEach(r => {
      sources.push(`${r.companySymbol} (FY${r.year})`);
    });
  }
  
  if (portfolioData.portfolios.length > 0) {
    sources.push('User Portfolio Data');
  }
  
  if (loanData.simulations.length > 0) {
    sources.push('Loan History');
  }
  
  if (sources.length === 0) {
    const response: ChatResponse = {
      answer: INSUFFICIENT_DATA_MESSAGE,
      sources: [],
      confidence_score: 0
    };

    return res.status(200).json({
      success: true,
      data: response,
      metadata: {
        intent,
        userId: user_id,
        processedAt: new Date().toISOString()
      }
    });
  }
  
  // Build response
  const response: ChatResponse = {
    answer: llmResponse.answer || INSUFFICIENT_DATA_MESSAGE,
    sources: sources,
    confidence_score: llmResponse.confidence
  };

  const metadata = {
    intent,
    userId: user_id,
    processedAt: new Date().toISOString()
  }

  await AIResponseCacheService.set('legacy-ai-chat', {
    user_id,
    query: sanitizedQuery,
    intent,
  }, {
    response,
    metadata,
  })
  
  res.status(200).json({
    success: true,
    data: response,
    metadata
  });
});

export default { handleChat };
