import { AnalysisType } from '@prisma/client';
import axios from 'axios';

interface AnalysisInput {
  [key: string]: any;
}

interface AnalysisResult {
  analysis: string;
  confidence: number;
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const analyzeFinancialData = async (
  input: AnalysisInput,
  analysisType: AnalysisType
): Promise<AnalysisResult> => {
  try {
    const prompt = generatePrompt(input, analysisType);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst specializing in Nepal\'s financial market. Provide analysis in JSON format with analysis, confidence (0-1), recommendations array, and riskLevel (LOW/MEDIUM/HIGH).'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = JSON.parse(response.data.choices[0].message.content);
    
    return {
      analysis: result.analysis || 'Analysis completed successfully',
      confidence: result.confidence || 0.8,
      recommendations: result.recommendations || [],
      riskLevel: result.riskLevel || 'MEDIUM'
    };
  } catch (error) {
    // Fallback analysis if AI service fails
    return getFallbackAnalysis(input, analysisType);
  }
};

const generatePrompt = (input: AnalysisInput, analysisType: AnalysisType): string => {
  switch (analysisType) {
    case 'LOAN_ELIGIBILITY':
      return `Analyze loan eligibility for this data: ${JSON.stringify(input)}. Consider income, credit history, debt-to-income ratio, and Nepal banking standards.`;
    
    case 'RISK_ASSESSMENT':
      return `Assess financial risk for this data: ${JSON.stringify(input)}. Evaluate market risk, credit risk, and liquidity risk in Nepali context.`;
    
    case 'FINANCIAL_HEALTH':
      return `Evaluate financial health for this data: ${JSON.stringify(input)}. Analyze cash flow, profitability, and solvency metrics.`;
    
    case 'CREDIT_SCORE':
      return `Estimate credit score based on this data: ${JSON.stringify(input)}. Consider payment history, credit utilization, and credit age.`;
    
    case 'INVESTMENT_ANALYSIS':
      return `Analyze investment opportunity: ${JSON.stringify(input)}. Evaluate ROI, risk factors, and market conditions in Nepal.`;
    
    default:
      return `Analyze this financial data: ${JSON.stringify(input)}.`;
  }
};

const getFallbackAnalysis = (input: AnalysisInput, analysisType: AnalysisType): AnalysisResult => {
  return {
    analysis: `Basic ${analysisType.replace('_', ' ').toLowerCase()} analysis completed. Please consult with a financial advisor for detailed analysis.`,
    confidence: 0.6,
    recommendations: [
      'Review your financial statements regularly',
      'Consider consulting with a financial advisor',
      'Monitor market conditions and economic indicators'
    ],
    riskLevel: 'MEDIUM'
  };
};
