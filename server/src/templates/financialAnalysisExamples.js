/**
 * FinSathi AI - Financial Analysis Report Generator Usage Examples
 * Practical examples of using the AI financial analysis template
 */

const { generateFinancialAnalysisReport } = require('./financialAnalysisPrompt');

console.log('🏦 FinSathi AI - Financial Analysis Report Generator Usage Examples\n');

// Example 1: Strong performing company
console.log('📊 Example 1: Strong Performing Company Report');
console.log('=' .repeat(60));

const strongCompanyData = {
  company: {
    id: 'company_001',
    name: 'Nabil Bank Limited',
    symbol: 'NABIL',
    sector: 'Banking',
    listedYear: 2004,
  },
  analysis: {
    period: {
      year: 2023,
      fiscalYear: 2023,
      dataDate: '2024-03-10T12:00:00.000Z',
    },
    financialData: {
      revenue: 15000000000,
      netProfit: 1800000000,
      totalAssets: 35000000000,
      totalEquity: 12000000000,
      totalDebt: 15000000000,
      revenueGrowth: 12.5,
    },
    ratios: {
      returnOnEquity: 15.0,
      debtToEquity: 1.25,
      netProfitMargin: 12.0,
      assetTurnover: 0.43,
      returnOnAssets: 5.14,
      earningsPerShare: 150.0,
    },
    healthScore: {
      score: 78,
      category: 'MODERATE',
      confidence: 'HIGH',
    },
    metadata: {
      dataQuality: {
        completeness: 100,
        quality: 'EXCELLENT',
      },
    },
  },
};

const strongReport = generateFinancialAnalysisReport(strongCompanyData);
console.log(strongReport);

// Example 2: High-risk company
console.log('\n⚠️  Example 2: High-Risk Company Report');
console.log('=' .repeat(60));

const riskyCompanyData = {
  company: {
    id: 'company_002',
    name: 'Struggling Manufacturing Co',
    symbol: 'STRUG',
    sector: 'Manufacturing',
    listedYear: 2015,
  },
  analysis: {
    period: {
      year: 2023,
      fiscalYear: 2023,
      dataDate: '2024-03-10T12:00:00.000Z',
    },
    financialData: {
      revenue: 500000000,
      netProfit: -50000000,
      totalAssets: 800000000,
      totalEquity: 200000000,
      totalDebt: 600000000,
      revenueGrowth: -15.0,
    },
    ratios: {
      returnOnEquity: -25.0,
      debtToEquity: 3.0,
      netProfitMargin: -10.0,
      assetTurnover: 0.63,
      returnOnAssets: -6.25,
      earningsPerShare: -25.0,
    },
    healthScore: {
      score: 25,
      category: 'RISKY',
      confidence: 'MEDIUM',
    },
    metadata: {
      dataQuality: {
        completeness: 100,
        quality: 'GOOD',
      },
    },
  },
};

const riskyReport = generateFinancialAnalysisReport(riskyCompanyData);
console.log(riskyReport);

// Example 3: Technology growth company
console.log('\n🚀 Example 3: Technology Growth Company Report');
console.log('=' .repeat(60));

const techCompanyData = {
  company: {
    id: 'company_003',
    name: 'TechInnovate Nepal',
    symbol: 'TECH',
    sector: 'Technology',
    listedYear: 2020,
  },
  analysis: {
    period: {
      year: 2023,
      fiscalYear: 2023,
      dataDate: '2024-03-10T12:00:00.000Z',
    },
    financialData: {
      revenue: 200000000,
      netProfit: 40000000,
      totalAssets: 150000000,
      totalEquity: 80000000,
      totalDebt: 20000000,
      revenueGrowth: 45.0,
    },
    ratios: {
      returnOnEquity: 50.0,
      debtToEquity: 0.25,
      netProfitMargin: 20.0,
      assetTurnover: 1.33,
      returnOnAssets: 26.67,
      earningsPerShare: 100.0,
    },
    healthScore: {
      score: 92,
      category: 'STRONG',
      confidence: 'HIGH',
    },
    metadata: {
      dataQuality: {
        completeness: 100,
        quality: 'EXCELLENT',
      },
    },
  },
};

const techReport = generateFinancialAnalysisReport(techCompanyData);
console.log(techReport);

// Example 4: Insurance company
console.log('\n🛡️  Example 4: Insurance Company Report');
console.log('=' .repeat(60));

const insuranceCompanyData = {
  company: {
    id: 'company_004',
    name: 'Secure Insurance Limited',
    symbol: 'INSURE',
    sector: 'Insurance',
    listedYear: 2010,
  },
  analysis: {
    period: {
      year: 2023,
      fiscalYear: 2023,
      dataDate: '2024-03-10T12:00:00.000Z',
    },
    financialData: {
      revenue: 8000000000,
      netProfit: 800000000,
      totalAssets: 12000000000,
      totalEquity: 4000000000,
      totalDebt: 2000000000,
      revenueGrowth: 8.0,
    },
    ratios: {
      returnOnEquity: 20.0,
      debtToEquity: 0.5,
      netProfitMargin: 10.0,
      assetTurnover: 0.67,
      returnOnAssets: 6.67,
      earningsPerShare: 40.0,
    },
    healthScore: {
      score: 85,
      category: 'STRONG',
      confidence: 'HIGH',
    },
    metadata: {
      dataQuality: {
        completeness: 100,
        quality: 'EXCELLENT',
      },
    },
  },
};

const insuranceReport = generateFinancialAnalysisReport(insuranceCompanyData);
console.log(insuranceReport);

// Example 5: Integration with API
console.log('\n🔗 Example 5: Integration with API Endpoint');
console.log('=' .repeat(60));

/**
 * Example API endpoint that uses the report generator
 */
function createAnalysisEndpoint() {
  return {
    method: 'POST',
    path: '/v1/companies/:symbol/analysis-report',
    description: 'Generate human-readable financial analysis report',
    parameters: {
      symbol: {
        type: 'path',
        required: true,
        description: 'Company stock symbol',
      },
      format: {
        type: 'query',
        required: false,
        description: 'Output format (html, text, markdown)',
        default: 'markdown',
      },
    },
    handler: async (req, res) => {
      try {
        const { symbol } = req.params;
        const { format = 'markdown' } = req.query;

        // Get company analysis data (this would come from your service)
        const companyData = await getCompanyAnalysisData(symbol);
        
        if (!companyData) {
          return res.status(404).json({
            success: false,
            error: `Company '${symbol}' not found`,
          });
        }

        // Generate report
        const report = generateFinancialAnalysisReport(companyData);

        // Return in requested format
        switch (format.toLowerCase()) {
          case 'html':
            res.set('Content-Type', 'text/html');
            res.send(markdownToHtml(report));
            break;
          case 'text':
            res.set('Content-Type', 'text/plain');
            res.send(report);
            break;
          default:
            res.set('Content-Type', 'text/markdown');
            res.send(report);
        }

      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to generate analysis report',
        });
      }
    },
  };
}

// Mock function to get company analysis data
async function getCompanyAnalysisData(symbol) {
  // This would typically call your CompanyAnalysisService
  // For demo purposes, returning mock data based on symbol
  const mockData = {
    'NABIL': strongCompanyData,
    'STRUG': riskyCompanyData,
    'TECH': techCompanyData,
    'INSURE': insuranceCompanyData,
  };
  
  return mockData[symbol.toUpperCase()] || null;
}

// Helper function to convert markdown to HTML
function markdownToHtml(markdown) {
  // Simple markdown to HTML conversion
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Convert bold text
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert line breaks
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in basic HTML structure
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Financial Analysis Report</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; margin-top: 25px; }
        .positive { color: #27ae60; }
        .negative { color: #e74c3c; }
        .warning { color: #f39c12; }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
}

// Example usage demonstration
console.log('\n📋 Example API Usage:');
console.log('POST /v1/companies/NABIL/analysis-report?format=markdown');
console.log('POST /v1/companies/TECH/analysis-report?format=html');
console.log('POST /v1/companies/STRUG/analysis-report?format=text');

// Example 6: Batch report generation
console.log('\n📦 Example 6: Batch Report Generation');
console.log('=' .repeat(60));

async function generateBatchReports(symbols) {
  console.log(`Generating reports for ${symbols.length} companies...\n`);
  
  for (const symbol of symbols) {
    try {
      const companyData = await getCompanyAnalysisData(symbol);
      if (companyData) {
        const report = generateFinancialAnalysisReport(companyData);
        
        // Save to file or database
        const fileName = `${symbol}_analysis_${Date.now()}.md`;
        console.log(`✅ Generated report for ${symbol}: ${fileName}`);
        
        // Here you would save the report
        // await fs.writeFile(fileName, report);
      } else {
        console.log(`❌ No data available for ${symbol}`);
      }
    } catch (error) {
      console.error(`❌ Error generating report for ${symbol}: ${error.message}`);
    }
  }
}

// Example batch usage
const batchSymbols = ['NABIL', 'TECH', 'INSURE', 'STRUG'];
generateBatchReports(batchSymbols);

// Example 7: Custom template variables
console.log('\n⚙️  Example 7: Template Customization');
console.log('=' .repeat(60));

const customTemplate = `
# Custom Financial Analysis for {{company.name}}

## Quick Summary
- **Symbol:** {{company.symbol}}
- **Sector:** {{company.sector}}
- **Health Score:** {{healthScore.score}}/100 ({{healthScore.category}})

## Key Metrics
- **Revenue:** {{financialData.revenue}}
- **Net Profit:** {{financialData.netProfit}}
- **ROE:** {{ratios.returnOnEquity}}%
- **Debt/Equity:** {{ratios.debtToEquity}}

## Investment Recommendation
{{#if (healthScore.score > 80)}}
🟢 **BUY** - Strong financial fundamentals
{{else if (healthScore.score > 60)}}
🟡 **HOLD** - Moderate financial health
{{else}}
🔴 **SELL** - High financial risk
{{/if}}
`;

function createCustomReport(companyData) {
  let report = customTemplate;
  
  // Replace variables
  report = report.replace(/{{company\.name}}/g, companyData.company.name);
  report = report.replace(/{{company\.symbol}}/g, companyData.company.symbol);
  report = report.replace(/{{company\.sector}}/g, companyData.company.sector);
  report = report.replace(/{{healthScore\.score}}/g, companyData.analysis.healthScore.score);
  report = report.replace(/{{healthScore\.category}}/g, companyData.analysis.healthScore.category);
  report = report.replace(/{{financialData\.revenue}}/g, companyData.analysis.financialData.revenue);
  report = report.replace(/{{financialData\.netProfit}}/g, companyData.analysis.financialData.netProfit);
  report = report.replace(/{{ratios\.returnOnEquity}}/g, companyData.analysis.ratios.returnOnEquity);
  report = report.replace(/{{ratios\.debtToEquity}}/g, companyData.analysis.ratios.debtToEquity);
  
  return report;
}

console.log('\nCustom Report Example:');
console.log(createCustomReport(strongCompanyData));

console.log('\n🎯 Key Features Demonstrated:');
console.log('• Human-readable analysis with clear sections');
console.log('• Risk-appropriate warnings and recommendations');
console.log('• Sector-specific insights and considerations');
console.log('• Professional yet accessible language for retail investors');
console.log('• Multiple output formats (Markdown, HTML, Text)');
console.log('• Conditional logic based on financial health');
console.log('• Currency formatting for Nepali Rupees');
console.log('• Template customization capabilities');
console.log('• Batch processing support');
console.log('• API integration ready');

console.log('\n✅ Financial Analysis Report Generator - Ready for Production!');
