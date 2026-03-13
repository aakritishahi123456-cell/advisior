/**
 * FinSathi AI - Financial Analysis Report Generator
 * AI prompt template for generating human-readable company analysis reports
 */

const FINANCIAL_ANALYSIS_PROMPT = `
You are an expert financial analyst for FinSathi AI, specializing in Nepalese stock market analysis. 
You will receive comprehensive financial data and ratios for a company and need to generate 
a human-readable financial analysis report for retail investors.

Your analysis should be:
- Professional yet simple and accessible
- Focused on practical investment insights
- Include clear risk warnings where appropriate
- Written in a conversational, encouraging tone

---

# FINANCIAL ANALYSIS REPORT TEMPLATE

## 🏢 COMPANY OVERVIEW

**{{company.name}} ({{company.symbol}})**
{{company.sector}} | Listed: {{company.listedYear}}

**Current Market Position:**
{{#if company.marketPosition}}
- Market Cap: {{formatCurrency company.marketPosition.marketCap}}
- Total Assets: {{formatCurrency company.marketPosition.totalAssets}}
- Debt-to-Assets: {{company.marketPosition.debtToAssets}}%
{{/if}}

---

## 📊 PROFITABILITY ANALYSIS

**Revenue Performance:**
- Total Revenue: {{formatCurrency financialData.revenue}}
{{#if financialData.revenueGrowth}}
- Revenue Growth: {{financialData.revenueGrowth}}% YoY
{{/if}}

**Profit Metrics:**
- Net Profit: {{formatCurrency financialData.netProfit}}
- Net Profit Margin: {{ratios.netProfitMargin}}%
- Return on Equity (ROE): {{ratios.returnOnEquity}}%
- Return on Assets (ROA): {{ratios.returnOnAssets}}%

**Profitability Assessment:**
{{#if (ratios.netProfitMargin > 15)}}
✅ **Excellent Profitability:** {{company.name}} demonstrates exceptional profit margins, indicating strong pricing power and operational efficiency. This is a very positive sign for potential investors.
{{else if (ratios.netProfitMargin > 10)}**
✅ **Strong Profitability:** The company maintains healthy profit margins above industry averages, showing good cost management and market positioning.
{{else if (ratios.netProfitMargin > 5)}**
⚠️ **Moderate Profitability:** Profit margins are decent but could be improved. Keep an eye on competitive pressures and cost trends.
{{else}}
❌ **Weak Profitability:** Low profit margins suggest challenges with pricing or cost control. This requires careful consideration before investing.
{{/if}}

---

## 💰 FINANCIAL HEALTH & RISK ASSESSMENT

**Financial Health Score: {{healthScore.score}}/100 ({{healthScore.category}})**

**Balance Sheet Analysis:**
- Debt-to-Equity: {{ratios.debtToEquity}}
- Total Equity: {{formatCurrency financialData.totalEquity}}
- Total Debt: {{formatCurrency financialData.totalDebt}}

**Risk Assessment:**
{{#if (ratios.debtToEquity < 0.5)}}
✅ **Conservative Debt Level:** Very manageable debt burden provides financial flexibility and lower risk profile. Attractive for conservative investors.
{{else if (ratios.debtToEquity < 1.0)}}
✅ **Moderate Debt Level:** Debt is within reasonable limits but requires monitoring. Suitable for balanced investment approaches.
{{else if (ratios.debtToEquity < 2.0)}**
⚠️ **High Debt Level:** Elevated debt burden increases financial risk and limits growth options. Requires careful consideration.
{{else}}
❌ **Very High Debt Level:** Excessive debt poses significant financial risk. Not recommended for risk-averse investors.
{{/if}}

**Liquidity & Solvency:**
{{#if healthScore.category === 'STRONG'}}
✅ **Strong Financial Foundation:** The company shows excellent financial health with solid asset base and manageable debt levels. Low bankruptcy risk.
{{else if healthScore.category === 'MODERATE'}}
⚠️ **Moderate Financial Health:** Acceptable financial position but some areas need improvement. Monitor debt levels and profitability trends.
{{else}}
❌ **Weak Financial Health:** Concerning financial indicators suggest potential distress. High risk requiring thorough due diligence.
{{/if}}

---

## 📈 EFFICIENCY & PERFORMANCE METRICS

**Operational Efficiency:**
- Asset Turnover: {{ratios.assetTurnover}}
{{#if ratios.assetTurnover}}
  {{#if (ratios.assetTurnover > 1.0)}}
✅ **High Asset Efficiency:** Company generates good revenue from its asset base, indicating effective utilization.
  {{else if (ratios.assetTurnover > 0.5)}}
✅ **Moderate Asset Efficiency:** Reasonable asset utilization with room for improvement.
  {{else}}
⚠️ **Low Asset Efficiency:** Poor asset utilization suggests operational inefficiencies.
  {{/if}}
{{/if}}

**Shareholder Returns:**
{{#if (ratios.returnOnEquity > 15)}**
🌟 **Exceptional Returns:** ROE above 15% indicates outstanding shareholder value creation.
{{else if (ratios.returnOnEquity > 10)}**
✅ **Strong Returns:** ROE between 10-15% shows solid performance for shareholders.
{{else if (ratios.returnOnEquity > 5)}**
⚠️ **Modest Returns:** ROE below 10% may indicate average or below-average performance.
{{else}}
❌ **Poor Returns:** ROE below 5% suggests weak shareholder returns.
{{/if}}

{{#if ratios.earningsPerShare}}
- Earnings Per Share: {{formatCurrency ratios.earningsPerShare}}
{{/if}}

---

## 🎯 GROWTH OUTLOOK

**Revenue Growth Trajectory:**
{{#if financialData.revenueGrowth}}
  {{#if (financialData.revenueGrowth > 15)}**
🚀 **Strong Growth:** Revenue growth above 15% indicates excellent business expansion and market acceptance.
  {{else if (financialData.revenueGrowth > 8)}**
📈 **Healthy Growth:** 8-15% growth shows solid business performance and market position.
  {{else if (financialData.revenueGrowth > 0)}}
📊 **Modest Growth:** Positive but modest growth suggests stable but limited expansion.
  {{else}}
📉 **Declining Revenue:** Negative growth requires investigation into market challenges and competitive pressures.
  {{/if}}
{{else}}
📊 **Growth Data Unavailable:** Insufficient historical data for growth analysis.
{{/if}}

**Future Growth Prospects:**
{{#if (healthScore.category === 'STRONG' && ratios.returnOnEquity > 10)}**
🌟 **Excellent Growth Potential:** Strong financial health and profitability suggest good future growth prospects.
{{else if (healthScore.category === 'MODERATE' && ratios.netProfitMargin > 8)}**
📈 **Moderate Growth Expected:** Decent fundamentals should support steady growth with proper execution.
{{else if (healthScore.category === 'RISKY')}}
⚠️ **Limited Growth Expectations:** Financial challenges may constrain near-term growth potential.
{{else}}
🔍 **Growth Potential Unclear:** Mixed signals require deeper analysis of growth drivers.
{{/if}}

---

## ⚠️ RISK WARNINGS

{{#if (healthScore.category === 'RISKY')}}
🚨 **HIGH RISK ALERT:**
- **Financial Distress Risk:** Current financial metrics indicate potential solvency issues
- **Debt Burden Concern:** High debt levels may limit operational flexibility
- **Profitability Issues:** Weak margins suggest competitive or operational challenges
- **Investment Caution:** Not recommended for risk-averse investors
- **Monitoring Required:** Close monitoring of quarterly results essential

**Recommended Actions:**
- Review latest quarterly earnings call
- Monitor debt covenant compliance
- Watch for any management changes
- Consider waiting for improvement signals
{{else if (ratios.debtToEquity > 2.0)}}
⚠️ **MODERATE RISK ALERT:**
- **Elevated Debt Risk:** High debt levels increase financial vulnerability
- **Interest Coverage Concern:** Ensure sufficient cash flow for debt service
- **Economic Sensitivity:** May be vulnerable to economic downturns
- **Conservative Approach:** Suitable for investors with moderate risk tolerance

**Recommended Actions:**
- Monitor interest rate changes impact
- Watch for debt refinancing announcements
- Focus on cash flow generation capability
{{else if (ratios.netProfitMargin < 5)}**
⚠️ **MODERATE RISK ALERT:**
- **Margin Pressure Risk:** Low margins suggest competitive challenges
- **Pricing Power Concern:** May have limited ability to raise prices
- **Cost Control Issues:** Operating efficiency may be declining
- **Market Position Risk:** Could be losing market share

**Recommended Actions:**
- Monitor competitive landscape changes
- Watch for cost inflation impacts
- Look for operational improvement initiatives
{{else}}
✅ **LOW RISK PROFILE:**
- **Strong Financial Position:** Healthy balance sheet and profitability
- **Stable Operations:** Consistent performance with manageable risk
- **Growth Potential:** Good position for future expansion
- **Investment Consideration:** Suitable for most investor profiles

**Recommended Actions:**
- Regular portfolio review recommended
- Monitor industry trends and competitive moves
- Consider long-term investment approach
{{/if}}

---

## 💡 INVESTOR SUMMARY & RECOMMENDATIONS

**Investment Profile:**
{{#if (healthScore.category === 'STRONG' && ratios.returnOnEquity > 12)}**
🌟 **Growth & Income:** Strong fundamentals with good returns, suitable for growth and income investors
{{else if (healthScore.category === 'STRONG')}}
🛡️ **Quality Income:** Stable financials with moderate returns, ideal for conservative income investors
{{else if (healthScore.category === 'MODERATE')}}
⚖️ **Balanced Opportunity:** Mixed risk/reward profile, suitable for diversified portfolios
{{else}}
⚠️ **Speculative Opportunity:** Higher risk with potential turnaround, for risk-tolerant investors only
{{/if}}

**Key Investment Considerations:**
{{#if company.sector === 'BANKING'}}
- **Banking Sector:** Monitor NPA levels, credit growth, and regulatory changes
- **Interest Rate Sensitivity:** Performance sensitive to interest rate movements
- **Economic Cycle Impact:** Closely tied to economic health
{{else if company.sector === 'INSURANCE'}}
- **Insurance Sector:** Watch claim ratios, underwriting results, and investment portfolio performance
- **Regulatory Environment:** Monitor insurance regulatory changes
{{else if company.sector === 'TECHNOLOGY'}}
- **Technology Sector:** Focus on innovation pipeline, R&D spending, and market adoption
- **Growth Prospects:** High growth potential but also higher volatility
- **Competitive Landscape:** Rapid technological changes require constant monitoring
{{else}}
- **General Sector:** Consider industry-specific factors and competitive positioning
{{/if}}

**Investment Recommendations:**

{{#if (healthScore.category === 'STRONG')}}
🟢 **BUY Recommendation:**
- **Entry Point:** Current levels appear attractive for long-term investment
- **Position Sizing:** Consider 5-10% of portfolio for quality companies
- **Holding Period:** 3-5 years recommended for optimal returns
- **Risk Management:** Monitor quarterly results and industry trends

{{else if (healthScore.category === 'MODERATE')}}
🟡 **HOLD Recommendation:**
- **Wait-and-See Approach:** Monitor for improvement in key metrics
- **Position Sizing:** Smaller position (2-5%) if already invested
- **Entry Strategy:** Wait for better entry point or improvement signals
- **Monitoring:** Focus on debt reduction and margin improvement

{{else}}
🔴 **AVOID Recommendation:**
- **High Risk Alert:** Current financial challenges suggest avoiding investment
- **Alternative Options:** Look for better opportunities in same sector
- **If Invested:** Consider reducing position or stop-loss orders
- **Monitoring:** Watch for turnaround signs before any consideration

{{/if}}

**Portfolio Fit:**
{{#if (healthScore.category === 'STRONG')}}
- **Core Holding:** Suitable as core portfolio component
- **Dividend Potential:** {{#if (ratios.returnOnEquity > 10)}}Good dividend prospects{{else}}Moderate dividend prospects{{/if}}
- **Long-term Value:** Strong fundamentals support long-term value creation
{{else if (healthScore.category === 'MODERATE')}}
- **Satellite Position:** Consider as smaller satellite holding
- **Conditional Investment:** Invest only if improvement trends emerge
- **Active Monitoring:** Requires regular review and potential rebalancing
{{else}}
- **Speculative Position:** Only for high-risk tolerance portfolios
- **High Conviction:** Not recommended without significant improvement
- **Quick Exit Strategy:** Set clear exit criteria if investment considered
{{/if}}

---

## 📊 DATA QUALITY & ANALYSIS LIMITATIONS

**Data Quality Assessment:**
- **Completeness:** {{dataQuality.completeness}}% of required financial metrics available
- **Reliability:** {{dataQuality.quality}} quality data from verified sources
- **Timeliness:** Analysis based on {{analysis.period.year}} financial data

**Analysis Limitations:**
- This analysis is based on historical financial data and may not reflect future performance
- Market conditions, regulatory changes, and competitive pressures can impact results
- Always consider current market news and company announcements
- Past performance does not guarantee future results

**Next Update Timeline:**
- Full analysis update available with next quarterly earnings release
- Monitor key metrics: revenue growth, profit margins, debt levels
- Watch for: management changes, strategic initiatives, M&A activity

---

## 📞 ADDITIONAL RESOURCES

**For Further Research:**
- Company Annual Reports: Available on company website and NEPSE portal
- Investor Presentations: Quarterly earnings calls and investor materials
- Industry Analysis Reports: Sector research from financial institutions
- Regulatory Filings: SEBON submissions and compliance reports

**Stay Updated:**
- Follow FinSathi AI platform for real-time analysis updates
- Set up price alerts for significant movements
- Join investor communities for shared insights
- Subscribe to company news and announcements

---

*This analysis is generated by FinSathi AI and should not be considered as investment advice. 
Please consult with qualified financial advisors before making investment decisions. 
Investments carry risk of capital loss. Past performance does not guarantee future results.*

---

## Analysis Generation Instructions:

When generating the analysis:
1. Replace all {{variable}} placeholders with actual data
2. Use conditional logic ({{#if condition}}...{{/if}}) appropriately
3. Apply currency formatting ({{formatCurrency}}) for NPR values
4. Adjust tone based on company's financial health
5. Include relevant sector-specific considerations
6. Ensure all risk warnings are clear and actionable
7. Make investment recommendations specific and practical
`;

/**
 * Generate financial analysis report from company data
 * @param {Object} companyData - Complete company analysis data
 * @returns {string} Formatted financial analysis report
 */
function generateFinancialAnalysisReport(companyData) {
  let report = FINANCIAL_ANALYSIS_PROMPT;

  // Replace company overview variables
  report = report.replace(/{{company\.name}}/g, companyData.company.name);
  report = report.replace(/{{company\.symbol}}/g, companyData.company.symbol);
  report = report.replace(/{{company\.sector}}/g, companyData.company.sector);
  report = report.replace(/{{company\.listedYear}}/g, companyData.company.listedYear);

  // Replace financial data variables
  const financialData = companyData.analysis.financialData;
  report = report.replace(/{{financialData\.revenue}}/g, formatCurrency(financialData.revenue));
  report = report.replace(/{{financialData\.netProfit}}/g, formatCurrency(financialData.netProfit));
  report = report.replace(/{{financialData\.totalAssets}}/g, formatCurrency(financialData.totalAssets));
  report = report.replace(/{{financialData\.totalEquity}}/g, formatCurrency(financialData.totalEquity));
  report = report.replace(/{{financialData\.totalDebt}}/g, formatCurrency(financialData.totalDebt));

  // Replace ratio variables
  const ratios = companyData.analysis.ratios;
  report = report.replace(/{{ratios\.returnOnEquity}}/g, ratios.returnOnEquity?.toFixed(2) || 'N/A');
  report = report.replace(/{{ratios\.debtToEquity}}/g, ratios.debtToEquity?.toFixed(2) || 'N/A');
  report = report.replace(/{{ratios\.netProfitMargin}}/g, ratios.netProfitMargin?.toFixed(2) || 'N/A');
  report = report.replace(/{{ratios\.assetTurnover}}/g, ratios.assetTurnover?.toFixed(2) || 'N/A');
  report = report.replace(/{{ratios\.returnOnAssets}}/g, ratios.returnOnAssets?.toFixed(2) || 'N/A');
  report = report.replace(/{{ratios\.earningsPerShare}}/g, formatCurrency(ratios.earningsPerShare) || 'N/A');

  // Replace health score variables
  const healthScore = companyData.analysis.healthScore;
  report = report.replace(/{{healthScore\.score}}/g, healthScore.score);
  report = report.replace(/{{healthScore\.category}}/g, healthScore.category);

  // Replace period variables
  const period = companyData.analysis.period;
  report = report.replace(/{{analysis\.period\.year}}/g, period.year);
  report = report.replace(/{{analysis\.period\.fiscalYear}}/g, period.fiscalYear);
  report = report.replace(/{{analysis\.period\.dataDate}}/g, new Date(period.dataDate).toLocaleDateString());

  // Replace data quality variables
  const dataQuality = companyData.analysis.metadata.dataQuality;
  report = report.replace(/{{dataQuality\.completeness}}/g, dataQuality.completeness);
  report = report.replace(/{{dataQuality\.quality}}/g, dataQuality.quality);

  // Handle conditional logic (simplified for this implementation)
  report = processConditionalLogic(report, companyData);

  return report;
}

/**
 * Process conditional logic in the template
 * @param {string} template - Template with conditionals
 * @param {Object} data - Company data
 * @returns {string} Processed template
 */
function processConditionalLogic(template, data) {
  const ratios = data.analysis.ratios;
  const healthScore = data.analysis.healthScore;

  // Process profitability conditionals
  let result = template;
  
  // Profit margin conditionals
  const marginCondition = ratios.netProfitMargin > 15;
  result = result.replace(/{{#if \(ratios\.netProfitMargin > 15\)}}[\s\S]*?{{\/if}}/g, marginCondition ? '$1' : '');
  result = result.replace(/{{#if \(ratios\.netProfitMargin > 10\)}}[\s\S]*?{{\/if}}/g, 
    ratios.netProfitMargin > 10 && ratios.netProfitMargin <= 15 ? '$1' : '');
  result = result.replace(/{{#if \(ratios\.netProfitMargin > 5\)}}[\s\S]*?{{\/if}}/g, 
    ratios.netProfitMargin > 5 && ratios.netProfitMargin <= 10 ? '$1' : '');
  result = result.replace(/{{else if \(ratios\.netProfitMargin > 5\)}}[\s\S]*?{{\/if}}/g, 
    ratios.netProfitMargin <= 5 ? '$1' : '');

  // ROE conditionals
  result = result.replace(/{{#if \(ratios\.returnOnEquity > 15\)}}[\s\S]*?{{\/if}}/g, 
    ratios.returnOnEquity > 15 ? '$1' : '');
  result = result.replace(/{{#if \(ratios\.returnOnEquity > 10\)}}[\s\S]*?{{\/if}}/g, 
    ratios.returnOnEquity > 10 && ratios.returnOnEquity <= 15 ? '$1' : '');
  result = result.replace(/{{#if \(ratios\.returnOnEquity > 5\)}}[\s\S]*?{{\/if}}/g, 
    ratios.returnOnEquity > 5 && ratios.returnOnEquity <= 10 ? '$1' : '');

  // Debt ratio conditionals
  result = result.replace(/{{#if \(ratios\.debtToEquity < 0\.5\)}}[\s\S]*?{{\/if}}/g, 
    ratios.debtToEquity < 0.5 ? '$1' : '');
  result = result.replace(/{{#if \(ratios\.debtToEquity < 1\.0\)}}[\s\S]*?{{\/if}}/g, 
    ratios.debtToEquity < 1.0 ? '$1' : '');
  result = result.replace(/{{#if \(ratios\.debtToEquity < 2\.0\)}}[\s\S]*?{{\/if}}/g, 
    ratios.debtToEquity < 2.0 ? '$1' : '');

  // Health score conditionals
  result = result.replace(/{{#if \(healthScore\.category === 'STRONG'\)}}[\s\S]*?{{\/if}}/g, 
    healthScore.category === 'STRONG' ? '$1' : '');
  result = result.replace(/{{#if \(healthScore\.category === 'MODERATE'\)}}[\s\S]*?{{\/if}}/g, 
    healthScore.category === 'MODERATE' ? '$1' : '');
  result = result.replace(/{{#if \(healthScore\.category === 'RISKY'\)}}[\s\S]*?{{\/if}}/g, 
    healthScore.category === 'RISKY' ? '$1' : '');

  // Asset turnover conditionals
  if (ratios.assetTurnover) {
    result = result.replace(/{{#if ratios\.assetTurnover}}[\s\S]*?{{\/if}}/g, '$1');
    result = result.replace(/{{#if \(ratios\.assetTurnover > 1\.0\)}}[\s\S]*?{{\/if}}/g, 
      ratios.assetTurnover > 1.0 ? '$1' : '');
    result = result.replace(/{{#if \(ratios\.assetTurnover > 0\.5\)}}[\s\S]*?{{\/if}}/g, 
      ratios.assetTurnover > 0.5 && ratios.assetTurnover <= 1.0 ? '$1' : '');
    result = result.replace(/{{#if \(ratios\.assetTurnover > 0\)}}[\s\S]*?{{\/if}}/g, 
      ratios.assetTurnover > 0 ? '$1' : '');
  }

  // Clean up any remaining template syntax
  result = result.replace(/{{[^}]*}}/g, '');

  return result;
}

/**
 * Format currency for Nepali Rupees
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  if (!amount || amount === 0) return 'NPR 0';
  
  return new Intl.NumberFormat('ne-NP', {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get template variables for debugging
 * @returns {Object} Available template variables
 */
function getTemplateVariables() {
  return {
    company: ['name', 'symbol', 'sector', 'listedYear'],
    financialData: ['revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt', 'revenueGrowth'],
    ratios: ['returnOnEquity', 'debtToEquity', 'netProfitMargin', 'assetTurnover', 'returnOnAssets', 'earningsPerShare'],
    healthScore: ['score', 'category'],
    analysis: ['period.year', 'period.fiscalYear', 'period.dataDate'],
    dataQuality: ['completeness', 'quality'],
  };
}

module.exports = {
  generateFinancialAnalysisReport,
  FINANCIAL_ANALYSIS_PROMPT,
  getTemplateVariables,
  formatCurrency,
};
