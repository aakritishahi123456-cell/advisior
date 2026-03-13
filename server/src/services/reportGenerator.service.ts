import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { FinancialRatioService, FinancialRatios } from './financialRatio.service';
import { Redis } from 'ioredis';

const prisma = new PrismaClient();

export interface CompanyAnalysisInput {
  companyId: string;
  symbol: string;
  year: number;
  ratios: FinancialRatios;
  companyName?: string;
  industry?: string;
  marketCap?: number;
  sharePrice?: number;
}

export interface AIAnalysisResult {
  companyOverview: string;
  profitabilityAnalysis: string;
  debtRiskAnalysis: string;
  growthPotential: string;
  investorRiskScore: {
    score: number;
    category: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    description: string;
  };
  finalVerdict: {
    rating: 'STRONG' | 'MODERATE' | 'WEAK';
    recommendation: string;
    keyRisks: string[];
    keyStrengths: string[];
  };
  summary: string;
  generatedAt: Date;
  confidence: number;
}

export interface ReportTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: 'retail' | 'institutional' | 'risk' | 'growth';
}

export class ReportGeneratorService {
  private static readonly REDIS_KEY_PREFIX = 'ai_report:';
  private static readonly CACHE_TTL = 3600; // 1 hour in seconds

  // Report templates for different use cases
  private static readonly REPORT_TEMPLATES: ReportTemplate[] = [
    {
      id: 'retail_investor',
      name: 'Retail Investor Analysis',
      category: 'retail',
      template: `Analyze the following financial ratios for a NEPSE company:

Company: {{companyName}}
Symbol: {{symbol}}
Year: {{year}}
Industry: {{industry}}

Financial Ratios:
- Return on Equity (ROE): {{roe}}%
- Debt Ratio: {{debtRatio}}%
- EPS Growth: {{epsGrowth}}%
- Profit Margin: {{profitMargin}}%
- Current Ratio: {{currentRatio}}
- Quick Ratio: {{quickRatio}}
- Gross Margin: {{grossMargin}}%
- Operating Margin: {{operatingMargin}}%
- Return on Assets (ROA): {{returnOnAssets}}%
- Asset Turnover: {{assetTurnover}}
- Inventory Turnover: {{inventoryTurnover}}

Generate a clear financial analysis for retail investors. Structure your response with these sections:

1. Company Overview
2. Profitability Analysis
3. Debt Risk Analysis
4. Growth Potential
5. Investor Risk Score
6. Final Verdict

For each section, provide:
- Clear explanation in simple terms
- Key insights and implications
- Risk factors to consider

End with a final rating (STRONG/MODERATE/WEAK) and investment recommendation.

Focus on helping retail investors understand the company's financial health and investment potential.`,
      variables: ['companyName', 'symbol', 'year', 'industry', 'roe', 'debtRatio', 'epsGrowth', 'profitMargin', 'currentRatio', 'quickRatio', 'grossMargin', 'operatingMargin', 'returnOnAssets', 'assetTurnover', 'inventoryTurnover']
    },
    {
      id: 'risk_focused',
      name: 'Risk-Focused Analysis',
      category: 'risk',
      template: `Analyze the following financial ratios for risk assessment:

Company: {{companyName}}
Symbol: {{symbol}}
Year: {{year}}
Industry: {{industry}}

Financial Ratios:
- Return on Equity (ROE): {{roe}}%
- Debt Ratio: {{debtRatio}}%
- EPS Growth: {{epsGrowth}}%
- Profit Margin: {{profitMargin}}%
- Current Ratio: {{currentRatio}}
- Quick Ratio: {{quickRatio}}

Focus on:
1. Liquidity risks
2. Solvency concerns
3. Profitability sustainability
4. Growth challenges
5. Overall risk assessment

Provide a risk score (LOW/MODERATE/HIGH/VERY_HIGH) with detailed explanation.`,
      variables: ['companyName', 'symbol', 'year', 'industry', 'roe', 'debtRatio', 'epsGrowth', 'profitMargin', 'currentRatio', 'quickRatio']
    },
    {
      id: 'growth_analysis',
      name: 'Growth Potential Analysis',
      category: 'growth',
      template: `Analyze the following financial ratios for growth potential:

Company: {{companyName}}
Symbol: {{symbol}}
Year: {{year}}
Industry: {{industry}}

Financial Ratios:
- Return on Equity (ROE): {{roe}}%
- EPS Growth: {{epsGrowth}}%
- Profit Margin: {{profitMargin}}%
- Gross Margin: {{grossMargin}}%
- Operating Margin: {{operatingMargin}}%
- Asset Turnover: {{assetTurnover}}
- Inventory Turnover: {{inventoryTurnover}}

Focus on:
1. Growth indicators
2. Operational efficiency
3. Profitability trends
4. Expansion potential
5. Growth sustainability

Provide growth prospects and investment outlook.`,
      variables: ['companyName', 'symbol', 'year', 'industry', 'roe', 'epsGrowth', 'profitMargin', 'grossMargin', 'operatingMargin', 'assetTurnover', 'inventoryTurnover']
    }
  ];

  /**
   * Generate AI analysis report using LLM
   */
  static async generateAIAnalysis(
    input: CompanyAnalysisInput,
    templateId: string = 'retail_investor'
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    const cacheKey = `${this.REDIS_KEY_PREFIX}${input.companyId}_${input.year}_${templateId}`;

    try {
      // Check cache first
      const cachedReport = await this.getCachedReport(cacheKey);
      if (cachedReport) {
        logger.info({
          action: 'ai_report_cache_hit',
          companyId: input.companyId,
          year: input.year,
          templateId,
          generationTime: Date.now() - startTime,
        });
        return cachedReport;
      }

      // Get template
      const template = this.REPORT_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        throw createError(`Template ${templateId} not found`, 400);
      }

      // Build prompt with financial data
      const prompt = this.buildPrompt(template, input);

      // Generate AI analysis
      const aiResponse = await this.callLLM(prompt);

      // Parse and structure the response
      const analysis = this.parseAIResponse(aiResponse, input);

      // Cache the result
      await this.cacheReport(cacheKey, analysis);

      const generationTime = Date.now() - startTime;

      logger.info({
        action: 'ai_report_generated',
        companyId: input.companyId,
        symbol: input.symbol,
        year: input.year,
        templateId,
        generationTime,
        confidence: analysis.confidence,
      });

      return analysis;
    } catch (error: any) {
      logger.error({
        action: 'ai_report_generation_error',
        companyId: input.companyId,
        symbol: input.symbol,
        year: input.year,
        templateId,
        error: error.message,
        generationTime: Date.now() - startTime,
      });
      throw createError('Failed to generate AI analysis report', 500);
    }
  }

  /**
   * Build prompt template with financial data
   */
  private static buildPrompt(template: ReportTemplate, input: CompanyAnalysisInput): string {
    let prompt = template.template;

    // Replace variables with actual values
    template.variables.forEach(variable => {
      const value = this.getVariableValue(variable, input);
      prompt = prompt.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });

    return prompt;
  }

  /**
   * Get value for template variable
   */
  private static getVariableValue(variable: string, input: CompanyAnalysisInput): string {
    switch (variable) {
      case 'companyName':
        return input.companyName || input.symbol;
      case 'symbol':
        return input.symbol;
      case 'year':
        return input.year.toString();
      case 'industry':
        return input.industry || 'Unknown';
      case 'roe':
        return input.ratios.roe?.toFixed(2) || 'N/A';
      case 'debtRatio':
        return input.ratios.debtRatio?.toFixed(2) || 'N/A';
      case 'epsGrowth':
        return input.ratios.epsGrowth?.toFixed(2) || 'N/A';
      case 'profitMargin':
        return input.ratios.profitMargin?.toFixed(2) || 'N/A';
      case 'currentRatio':
        return input.ratios.currentRatio?.toFixed(2) || 'N/A';
      case 'quickRatio':
        return input.ratios.quickRatio?.toFixed(2) || 'N/A';
      case 'grossMargin':
        return input.ratios.grossMargin?.toFixed(2) || 'N/A';
      case 'operatingMargin':
        return input.ratios.operatingMargin?.toFixed(2) || 'N/A';
      case 'returnOnAssets':
        return input.ratios.returnOnAssets?.toFixed(2) || 'N/A';
      case 'assetTurnover':
        return input.ratios.assetTurnover?.toFixed(2) || 'N/A';
      case 'inventoryTurnover':
        return input.ratios.inventoryTurnover?.toFixed(2) || 'N/A';
      default:
        return 'N/A';
    }
  }

  /**
   * Call LLM API (OpenAI or local LLM)
   */
  private static async callLLM(prompt: string): Promise<string> {
    try {
      // In production, you would integrate with OpenAI API or local LLM
      // For now, we'll simulate the response
      
      // Simulate LLM processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock analysis based on prompt content
      const mockResponse = this.generateMockAnalysis(prompt);

      // Sanitize the response
      return this.sanitizeOutput(mockResponse);
    } catch (error: any) {
      logger.error('LLM API call failed:', error);
      throw createError('Failed to generate AI analysis', 500);
    }
  }

  /**
   * Generate mock analysis for demonstration
   */
  private static generateMockAnalysis(prompt: string): string {
    // Extract key metrics from prompt
    const roeMatch = prompt.match(/ROE:\s*([0-9.]+)%/);
    const debtMatch = prompt.match(/Debt Ratio:\s*([0-9.]+)%/);
    const epsMatch = prompt.match(/EPS Growth:\s*([0-9.-]+)%/);
    const profitMatch = prompt.match(/Profit Margin:\s*([0-9.]+)%/);
    const symbolMatch = prompt.match(/Symbol:\s*([A-Z]+)/);
    const companyMatch = prompt.match(/Company:\s*([^\n]+)/);

    const roe = roeMatch ? parseFloat(roeMatch[1]) : 0;
    const debtRatio = debtMatch ? parseFloat(debtMatch[1]) : 0;
    const epsGrowth = epsMatch ? parseFloat(epsMatch[1]) : 0;
    const profitMargin = profitMatch ? parseFloat(profitMatch[1]) : 0;
    const symbol = symbolMatch ? symbolMatch[1] : 'Unknown';
    const companyName = companyMatch ? companyMatch[1].trim() : symbol;

    // Generate analysis based on metrics
    let rating = 'MODERATE';
    let riskScore = 50;
    let riskCategory = 'MODERATE';

    // Calculate overall health score
    let healthScore = 0;
    let factors = 0;

    if (roe > 0) {
      if (roe >= 20) healthScore += 25;
      else if (roe >= 15) healthScore += 20;
      else if (roe >= 10) healthScore += 15;
      else if (roe >= 5) healthScore += 10;
      else healthScore += 5;
      factors++;
    }

    if (debtRatio >= 0) {
      if (debtRatio <= 30) healthScore += 25;
      else if (debtRatio <= 50) healthScore += 20;
      else if (debtRatio <= 70) healthScore += 15;
      else if (debtRatio <= 90) healthScore += 10;
      else healthScore += 5;
      factors++;
    }

    if (epsGrowth > 0) {
      if (epsGrowth >= 20) healthScore += 25;
      else if (epsGrowth >= 15) healthScore += 20;
      else if (epsGrowth >= 10) healthScore += 15;
      else if (epsGrowth >= 5) healthScore += 10;
      else healthScore += 5;
      factors++;
    }

    if (profitMargin > 0) {
      if (profitMargin >= 20) healthScore += 25;
      else if (profitMargin >= 15) healthScore += 20;
      else if (profitMargin >= 10) healthScore += 15;
      else if (profitMargin >= 5) healthScore += 10;
      else healthScore += 5;
      factors++;
    }

    const avgScore = factors > 0 ? healthScore / factors : 50;

    // Determine rating and risk
    if (avgScore >= 80) {
      rating = 'STRONG';
      riskScore = 20;
      riskCategory = 'LOW';
    } else if (avgScore >= 60) {
      rating = 'MODERATE';
      riskScore = 50;
      riskCategory = 'MODERATE';
    } else if (avgScore >= 40) {
      rating = 'MODERATE';
      riskScore = 70;
      riskCategory = 'HIGH';
    } else {
      rating = 'WEAK';
      riskScore = 85;
      riskCategory = 'VERY_HIGH';
    }

    // Generate structured analysis
    return `
## Company Overview
${companyName} (${symbol}) demonstrates ${avgScore >= 70 ? 'strong' : avgScore >= 50 ? 'moderate' : 'weak'} financial performance based on the analyzed metrics. The company operates in the Nepalese market with ${roe >= 15 ? 'healthy' : 'moderate'} return on equity of ${roe.toFixed(2)}%.

## Profitability Analysis
The company's profitability is ${profitMargin >= 15 ? 'strong' : profitMargin >= 10 ? 'moderate' : 'weak'} with a profit margin of ${profitMargin.toFixed(2)}%. The return on equity of ${roe.toFixed(2)}% indicates ${roe >= 20 ? 'excellent' : roe >= 15 ? 'good' : roe >= 10 ? 'average' : 'below average'} efficiency in generating returns for shareholders.

## Debt Risk Analysis
The debt ratio stands at ${debtRatio.toFixed(2)}%, which is considered ${debtRatio <= 50 ? 'conservative' : debtRatio <= 70 ? 'moderate' : 'high'}. ${debtRatio <= 50 ? 'The company maintains a healthy balance between debt and equity.' : debtRatio <= 70 ? 'The company has moderate leverage that should be monitored.' : 'The high debt level poses significant financial risk.'}

## Growth Potential
EPS growth of ${epsGrowth > 0 ? epsGrowth.toFixed(2) : 'negative'}% suggests ${epsGrowth >= 15 ? 'strong' : epsGrowth >= 10 ? 'moderate' : epsGrowth >= 5 ? 'limited' : 'concerning'} growth prospects. ${epsGrowth >= 10 ? 'The company shows positive earnings momentum.' : 'Growth prospects require careful consideration.'}

## Investor Risk Score
Risk Score: ${riskScore}/100 (${riskCategory})
${riskScore <= 30 ? 'Low risk investment suitable for conservative investors.' : riskScore <= 60 ? 'Moderate risk suitable for balanced portfolios.' : riskScore <= 80 ? 'High risk suitable for aggressive investors.' : 'Very high risk requiring thorough due diligence.'}

## Final Verdict
Rating: ${rating}
${rating === 'STRONG' ? 'Strong financial performance with good growth prospects. Recommended for long-term investment.' : rating === 'MODERATE' ? 'Moderate financial health with balanced risk-reward profile. Suitable for diversified portfolios.' : 'Weak financial indicators with elevated risks. Investment requires careful consideration and risk management.'}

Key Strengths: ${rating === 'STRONG' ? 'Strong profitability, healthy debt levels, positive growth' : rating === 'MODERATE' ? 'Balanced financial metrics, moderate risk profile' : 'Limited strengths, high risk factors'}
Key Risks: ${rating === 'STRONG' ? 'Market volatility, sector-specific risks' : rating === 'MODERATE' ? 'Economic sensitivity, competitive pressures' : 'High debt, weak profitability, growth challenges'}
    `.trim();
  }

  /**
   * Parse and structure AI response
   */
  private static parseAIResponse(response: string, input: CompanyAnalysisInput): AIAnalysisResult {
    try {
      // Parse sections from the response
      const sections = this.parseSections(response);
      
      // Calculate risk score based on financial ratios
      const riskScore = this.calculateRiskScore(input.ratios);
      
      // Determine final verdict
      const verdict = this.determineFinalVerdict(input.ratios, riskScore);

      return {
        companyOverview: sections.companyOverview || 'Company overview not available',
        profitabilityAnalysis: sections.profitabilityAnalysis || 'Profitability analysis not available',
        debtRiskAnalysis: sections.debtRiskAnalysis || 'Debt risk analysis not available',
        growthPotential: sections.growthPotential || 'Growth potential analysis not available',
        investorRiskScore: riskScore,
        finalVerdict: verdict,
        summary: this.generateSummary(sections, verdict),
        generatedAt: new Date(),
        confidence: this.calculateConfidence(input.ratios),
      };
    } catch (error: any) {
      logger.error('Failed to parse AI response:', error);
      throw createError('Failed to parse AI analysis response', 500);
    }
  }

  /**
   * Parse sections from AI response
   */
  private static parseSections(response: string): any {
    const sections: any = {};

    // Extract sections using regex patterns
    const sectionPatterns = {
      companyOverview: /## Company Overview\s*\n([\s\S]*?)(?=\n##|\n*$)/,
      profitabilityAnalysis: /## Profitability Analysis\s*\n([\s\S]*?)(?=\n##|\n*$)/,
      debtRiskAnalysis: /## Debt Risk Analysis\s*\n([\s\S]*?)(?=\n##|\n*$)/,
      growthPotential: /## Growth Potential\s*\n([\s\S]*?)(?=\n##|\n*$)/,
      investorRiskScore: /## Investor Risk Score\s*\n([\s\S]*?)(?=\n##|\n*$)/,
      finalVerdict: /## Final Verdict\s*\n([\s\S]*?)(?=\n##|\n*$)/,
    };

    Object.entries(sectionPatterns).forEach(([key, pattern]) => {
      const match = response.match(pattern);
      if (match && match[1]) {
        sections[key] = match[1].trim();
      }
    });

    return sections;
  }

  /**
   * Calculate risk score based on financial ratios
   */
  private static calculateRiskScore(ratios: FinancialRatios): {
    score: number;
    category: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    description: string;
  } {
    let score = 50; // Base score
    let factors = 0;

    // ROE impact on risk
    if (ratios.roe !== undefined) {
      if (ratios.roe >= 20) score -= 20;
      else if (ratios.roe >= 15) score -= 15;
      else if (ratios.roe >= 10) score -= 10;
      else if (ratios.roe >= 5) score -= 5;
      else score += 10;
      factors++;
    }

    // Debt ratio impact on risk
    if (ratios.debtRatio !== undefined) {
      if (ratios.debtRatio <= 30) score -= 20;
      else if (ratios.debtRatio <= 50) score -= 10;
      else if (ratios.debtRatio <= 70) score += 10;
      else score += 20;
      factors++;
    }

    // Profit margin impact on risk
    if (ratios.profitMargin !== undefined) {
      if (ratios.profitMargin >= 20) score -= 15;
      else if (ratios.profitMargin >= 15) score -= 10;
      else if (ratios.profitMargin >= 10) score -= 5;
      else if (ratios.profitMargin >= 5) score += 5;
      else score += 15;
      factors++;
    }

    // Current ratio impact on risk
    if (ratios.currentRatio !== undefined) {
      if (ratios.currentRatio >= 2) score -= 10;
      else if (ratios.currentRatio >= 1.5) score -= 5;
      else if (ratios.currentRatio >= 1) score += 5;
      else score += 15;
      factors++;
    }

    // Normalize score
    score = Math.max(0, Math.min(100, score));

    let category: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    let description: string;

    if (score <= 30) {
      category = 'LOW';
      description = 'Low risk investment suitable for conservative investors';
    } else if (score <= 60) {
      category = 'MODERATE';
      description = 'Moderate risk suitable for balanced portfolios';
    } else if (score <= 80) {
      category = 'HIGH';
      description = 'High risk suitable for aggressive investors';
    } else {
      category = 'VERY_HIGH';
      description = 'Very high risk requiring thorough due diligence';
    }

    return { score, category, description };
  }

  /**
   * Determine final verdict
   */
  private static determineFinalVerdict(
    ratios: FinancialRatios,
    riskScore: { score: number; category: string }
  ): {
    rating: 'STRONG' | 'MODERATE' | 'WEAK';
    recommendation: string;
    keyRisks: string[];
    keyStrengths: string[];
  } {
    let rating: 'STRONG' | 'MODERATE' | 'WEAK' = 'MODERATE';
    let recommendation = '';
    const keyRisks: string[] = [];
    const keyStrengths: string[] = [];

    // Analyze strengths
    if (ratios.roe !== undefined && ratios.roe >= 15) {
      keyStrengths.push('Strong return on equity');
    }
    if (ratios.debtRatio !== undefined && ratios.debtRatio <= 50) {
      keyStrengths.push('Healthy debt levels');
    }
    if (ratios.profitMargin !== undefined && ratios.profitMargin >= 15) {
      keyStrengths.push('Strong profitability');
    }
    if (ratios.currentRatio !== undefined && ratios.currentRatio >= 1.5) {
      keyStrengths.push('Good liquidity position');
    }
    if (ratios.epsGrowth !== undefined && ratios.epsGrowth >= 10) {
      keyStrengths.push('Positive earnings growth');
    }

    // Analyze risks
    if (ratios.roe !== undefined && ratios.roe < 5) {
      keyRisks.push('Low return on equity');
    }
    if (ratios.debtRatio !== undefined && ratios.debtRatio > 70) {
      keyRisks.push('High debt burden');
    }
    if (ratios.profitMargin !== undefined && ratios.profitMargin < 5) {
      keyRisks.push('Weak profitability');
    }
    if (ratios.currentRatio !== undefined && ratios.currentRatio < 1) {
      keyRisks.push('Liquidity concerns');
    }
    if (ratios.epsGrowth !== undefined && ratios.epsGrowth < 0) {
      keyRisks.push('Negative earnings growth');
    }

    // Determine rating
    const strengthScore = keyStrengths.length * 20;
    const riskScorePenalty = riskScore.score * 0.3;
    const totalScore = strengthScore - riskScorePenalty;

    if (totalScore >= 70) {
      rating = 'STRONG';
      recommendation = 'Strong financial performance with good growth prospects. Recommended for long-term investment.';
    } else if (totalScore >= 40) {
      rating = 'MODERATE';
      recommendation = 'Moderate financial health with balanced risk-reward profile. Suitable for diversified portfolios.';
    } else {
      rating = 'WEAK';
      recommendation = 'Weak financial indicators with elevated risks. Investment requires careful consideration and risk management.';
    }

    return {
      rating,
      recommendation,
      keyRisks,
      keyStrengths,
    };
  }

  /**
   * Generate summary
   */
  private static generateSummary(sections: any, verdict: any): string {
    return `${verdict.rating} financial performance with ${verdict.keyStrengths.length} key strengths and ${verdict.keyRisks.length} identified risks. ${verdict.recommendation}`;
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(ratios: FinancialRatios): number {
    const availableRatios = Object.values(ratios).filter(r => r !== undefined && r !== null).length;
    const totalRatios = Object.keys(ratios).length;
    
    return Math.round((availableRatios / totalRatios) * 100);
  }

  /**
   * Sanitize AI output to prevent injection
   */
  private static sanitizeOutput(output: string): string {
    // Remove potentially harmful content
    const sanitized = output
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/eval\s*\(/gi, '')
      .replace(/exec\s*\(/gi, '');

    // Limit length
    return sanitized.substring(0, 10000);
  }

  /**
   * Cache report in Redis
   */
  private static async cacheReport(key: string, report: AIAnalysisResult): Promise<void> {
    try {
      const redis = new Redis(process.env.REDIS_URL);
      await redis.setex(key, this.CACHE_TTL, JSON.stringify(report));
      await redis.quit();
    } catch (error: any) {
      logger.warn('Failed to cache report:', error.message);
    }
  }

  /**
   * Get cached report from Redis
   */
  private static async getCachedReport(key: string): Promise<AIAnalysisResult | null> {
    try {
      const redis = new Redis(process.env.REDIS_URL);
      const cached = await redis.get(key);
      await redis.quit();
      
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error: any) {
      logger.warn('Failed to get cached report:', error.message);
      return null;
    }
  }

  /**
   * Store AI report in database
   */
  static async storeAIReport(
    companyId: string,
    year: number,
    analysis: AIAnalysisResult,
    templateId: string = 'retail_investor'
  ): Promise<string> {
    try {
      const report = await prisma.aIReport.create({
        data: {
          userId: 'system', // System-generated report
          companyId,
          year,
          reportType: templateId.toUpperCase() as any,
          summary: analysis.summary,
          content: JSON.stringify(analysis),
          metadata: {
            templateId,
            confidence: analysis.confidence,
            riskScore: analysis.investorRiskScore.score,
            rating: analysis.finalVerdict.rating,
            generatedAt: analysis.generatedAt,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      logger.info({
        action: 'ai_report_stored',
        reportId: report.id,
        companyId,
        year,
        templateId,
        rating: analysis.finalVerdict.rating,
        riskScore: analysis.investorRiskScore.score,
      });

      return report.id;
    } catch (error: any) {
      logger.error({
        action: 'store_ai_report_error',
        companyId,
        year,
        error: error.message,
      });
      throw createError('Failed to store AI report', 500);
    }
  }

  /**
   * Get AI report from database
   */
  static async getAIReport(
    companyId: string,
    year: number,
    templateId: string = 'retail_investor'
  ): Promise<AIAnalysisResult | null> {
    try {
      const report = await prisma.aIReport.findFirst({
        where: {
          companyId,
          year,
          reportType: templateId.toUpperCase() as any,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!report) {
        return null;
      }

      return JSON.parse(report.content);
    } catch (error: any) {
      logger.error({
        action: 'get_ai_report_error',
        companyId,
        year,
        error: error.message,
      });
      throw createError('Failed to get AI report', 500);
    }
  }

  /**
   * Get AI reports for a company
   */
  static async getCompanyAIReports(
    companyId: string,
    limit: number = 10
  ): Promise<Array<{
    id: string;
    year: number;
    reportType: string;
    summary: string;
    rating: string;
    riskScore: number;
    createdAt: Date;
  }>> {
    try {
      const reports = await prisma.aIReport.findMany({
        where: { companyId },
        orderBy: { year: 'desc' },
        take: limit,
        select: {
          id: true,
          year: true,
          reportType: true,
          summary: true,
          content: true,
          createdAt: true,
        },
      });

      return reports.map(report => ({
        id: report.id,
        year: report.year,
        reportType: report.reportType,
        summary: report.summary,
        rating: JSON.parse(report.content).finalVerdict.rating,
        riskScore: JSON.parse(report.content).investorRiskScore.score,
        createdAt: report.createdAt,
      }));
    } catch (error: any) {
      logger.error({
        action: 'get_company_ai_reports_error',
        companyId,
        error: error.message,
      });
      throw createError('Failed to get company AI reports', 500);
    }
  }

  /**
   * Delete AI report
   */
  static async deleteAIReport(reportId: string): Promise<void> {
    try {
      await prisma.aIReport.delete({
        where: { id: reportId },
      });

      logger.info({
        action: 'ai_report_deleted',
        reportId,
      });
    } catch (error: any) {
      logger.error({
        action: 'delete_ai_report_error',
        reportId,
        error: error.message,
      });
      throw createError('Failed to delete AI report', 500);
    }
  }

  /**
   * Get available report templates
   */
  static getAvailableTemplates(): ReportTemplate[] {
    return this.REPORT_TEMPLATES;
  }

  /**
   * Generate batch AI reports
   */
  static async generateBatchReports(
    companies: Array<{
      companyId: string;
      symbol: string;
      year: number;
      ratios: FinancialRatios;
      companyName?: string;
      industry?: string;
    }>,
    templateId: string = 'retail_investor'
  ): Promise<Array<{
    companyId: string;
    symbol: string;
    year: number;
    analysis: AIAnalysisResult;
    error?: string;
  }>> {
    const results = [];

    for (const company of companies) {
      try {
        const analysis = await this.generateAIAnalysis(company, templateId);
        await this.storeAIReport(company.companyId, company.year, analysis, templateId);

        results.push({
          companyId: company.companyId,
          symbol: company.symbol,
          year: company.year,
          analysis,
        });
      } catch (error: any) {
        logger.error({
          action: 'batch_report_generation_error',
          companyId: company.companyId,
          symbol: company.symbol,
          year: company.year,
          error: error.message,
        });

        results.push({
          companyId: company.companyId,
          symbol: company.symbol,
          year: company.year,
          analysis: null as any,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get report statistics
   */
  static async getReportStatistics(): Promise<{
    totalReports: number;
    reportsByType: Record<string, number>;
    averageRiskScore: number;
    ratingDistribution: Record<string, number>;
  }> {
    try {
      const reports = await prisma.aIReport.findMany({
        select: {
          reportType: true,
          content: true,
        },
      });

      const reportsByType: Record<string, number> = {};
      let totalRiskScore = 0;
      let riskScoreCount = 0;
      const ratingDistribution: Record<string, number> = {
        STRONG: 0,
        MODERATE: 0,
        WEAK: 0,
      };

      reports.forEach(report => {
        // Count by type
        reportsByType[report.reportType] = (reportsByType[report.reportType] || 0) + 1;

        // Calculate average risk score
        try {
          const content = JSON.parse(report.content);
          if (content.investorRiskScore?.score) {
            totalRiskScore += content.investorRiskScore.score;
            riskScoreCount++;
          }

          // Count ratings
          if (content.finalVerdict?.rating) {
            ratingDistribution[content.finalVerdict.rating]++;
          }
        } catch (error) {
          // Skip invalid content
        }
      });

      return {
        totalReports: reports.length,
        reportsByType,
        averageRiskScore: riskScoreCount > 0 ? totalRiskScore / riskScoreCount : 0,
        ratingDistribution,
      };
    } catch (error: any) {
      logger.error('Failed to get report statistics:', error);
      throw createError('Failed to get report statistics', 500);
    }
  }
}

export default ReportGeneratorService;
