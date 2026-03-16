const fs = require('fs');
const path = require('path');
const axios = require('axios');

class DocumentCollector {
  constructor(config = {}) {
    this.sources = config.sources || [];
    this.outputDir = config.outputDir || './documents';
    this.downloadedFiles = [];
  }

  async initialize() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    const subdirs = ['annual_reports', 'quarterly_reports', 'investor_presentations', 'disclosures'];
    subdirs.forEach(dir => {
      const dirPath = path.join(this.outputDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  async downloadFromSource(source) {
    const { type, url, company, year, quarter, category } = source;
    
    console.log(`Downloading: ${company} - ${category} - ${year}${quarter ? ` Q${quarter}` : ''}`);
    
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
          'User-Agent': 'FinSathi-Document-Collector/1.0'
        }
      });

      const filename = this.generateFilename(company, year, quarter, category, type);
      const filepath = path.join(this.outputDir, category, filename);
      
      fs.writeFileSync(filepath, Buffer.from(response.data));
      
      this.downloadedFiles.push({
        filepath,
        company,
        year,
        quarter,
        category,
        type,
        downloadedAt: new Date().toISOString()
      });

      console.log(`✓ Saved: ${filename}`);
      return filepath;
    } catch (error) {
      console.error(`✗ Failed to download ${url}: ${error.message}`);
      return null;
    }
  }

  generateFilename(company, year, quarter, category, type) {
    const sanitizedCompany = company.replace(/[^a-zA-Z0-9]/g, '_');
    const quarterStr = quarter ? `_Q${quarter}` : '';
    const ext = type === 'pdf' ? '.pdf' : '.xlsx';
    return `${sanitizedCompany}_${category}_${year}${quarterStr}${ext}`;
  }

  async collectFromNEPSE() {
    const nepalSources = [
      { type: 'pdf', url: 'https://nepalstock.com/api/notices/annual/2023', company: 'NABIL', year: 2023, quarter: null, category: 'annual_reports' },
      { type: 'pdf', url: 'https://nepalstock.com/api/notices/quarterly/2023/Q4', company: 'NABIL', year: 2023, quarter: 4, category: 'quarterly_reports' },
    ];

    for (const source of nepalSources) {
      await this.downloadFromSource(source);
    }
  }

  async collectSampleDocuments() {
    const sampleDocuments = [
      {
        company: 'NABIL',
        year: 2024,
        category: 'annual_reports',
        content: `NABIL Bank Limited
Annual Report 2024
FINANCIAL HIGHLIGHTS

Total Assets: NPR 589.52 billion (↑15.2%)
Total Deposits: NPR 478.34 billion (↑12.8%)
Loan and Advances: NPR 402.18 billion (↑18.5%)
Capital Adequacy Ratio (CAR): 14.22%
Net Interest Margin (NIM): 2.89%
Non-Performing Loan (NPL): 0.98%
Return on Equity (ROE): 18.45%
Earnings Per Share (EPS): NPR 58.72

BUSINESS PERFORMANCE

The bank has demonstrated robust growth during the fiscal year 2023/24. Total assets reached NPR 589.52 billion, representing a growth of 15.2% compared to the previous year.

Key Financial Ratios:
- Current Ratio: 1.25
- Debt-to-Equity Ratio: 6.8
- Quick Ratio: 1.15
- Net Profit Margin: 22.3%

DIVIDEND

The Board of Directors has recommended cash dividend of NPR 35 per share (35%) and 10% stock dividend.

OUTLOOK

The banking sector in Nepal shows positive momentum with improving asset quality and strong credit growth. The bank is well-positioned to leverage these opportunities.`
      },
      {
        company: 'NICBL',
        year: 2024,
        category: 'quarterly_reports',
        content: `NIC Asia Bank Limited
Quarterly Report Q4 2024
FINANCIAL SUMMARY

Quarterly Net Profit: NPR 2.85 billion (↑8.2%)
Total Income: NPR 12.45 billion
Interest Income: NPR 10.82 billion
Non-Interest Income: NPR 1.63 billion
Operating Expenses: NPR 6.28 billion

KEY METRICS

Total Assets: NPR 425.18 billion
Total Loans: NPR 312.45 billion
Total Deposits: NPR 352.18 billion
NIM: 2.65%
NPL Ratio: 1.12%

OPERATIONAL HIGHLIGHTS

- Digital transaction volume increased by 45%
- Mobile banking users reached 1.2 million
- Branch network expanded to 280 locations
- Customer base grew to 3.5 million

FUTURE STRATEGIES

The bank plans to focus on digital transformation, SME lending, and expanding its renewable energy financing portfolio.`
      },
      {
        company: 'HBL',
        year: 2024,
        category: 'annual_reports',
        content: `HBL Bank Limited
Annual Report 2024
EXECUTIVE SUMMARY

HBL Bank has maintained its position as one of the leading commercial banks in Nepal with a market capitalization of NPR 52.8 billion.

FINANCIAL PERFORMANCE

- Total Assets: NPR 612.45 billion (↑18.2%)
- Net Profit: NPR 12.85 billion (↑22.5%)
- EPS: NPR 64.25
- ROE: 20.12%
- CAR: 15.8%

SECTOR-WISE LOAN DISTRIBUTION

1. Commercial & Industrial: 35%
2. Wholesale & Retail: 22%
3. Services: 15%
4. Agriculture: 12%
5. Manufacturing: 10%
6. Others: 6%

RISK MANAGEMENT

The bank has implemented robust risk management frameworks including:
- Credit Risk Assessment
- Market Risk Monitoring
- Operational Risk Controls
- Liquidity Risk Management

CORPORATE SOCIAL RESPONSIBILITY

HBL invested NPR 250 million in CSR activities focusing on education, healthcare, and environmental sustainability.`
      }
    ];

    for (const doc of sampleDocuments) {
      const filename = `${doc.company}_${doc.category}_${doc.year}.txt`;
      const filepath = path.join(this.outputDir, doc.category, filename);
      fs.writeFileSync(filepath, doc.content);
      
      this.downloadedFiles.push({
        filepath,
        company: doc.company,
        year: doc.year,
        category: doc.category,
        downloadedAt: new Date().toISOString()
      });
      
      console.log(`✓ Created sample: ${filename}`);
    }
  }

  async collectAll() {
    await this.initialize();
    console.log('\n📥 Starting document collection...\n');
    
    await this.collectSampleDocuments();
    console.log(`\n✓ Collected ${this.downloadedFiles.length} documents`);
    
    return this.downloadedFiles;
  }

  getDownloadedFiles() {
    return this.downloadedFiles;
  }

  getDocumentsByCompany(company) {
    return this.downloadedFiles.filter(doc => 
      doc.company.toLowerCase() === company.toLowerCase()
    );
  }

  getDocumentsByCategory(category) {
    return this.downloadedFiles.filter(doc => doc.category === category);
  }

  getDocumentsByYear(year) {
    return this.downloadedFiles.filter(doc => doc.year === year);
  }
}

module.exports = DocumentCollector;
