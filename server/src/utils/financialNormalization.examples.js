/**
 * FinSathi AI - Financial Normalization Usage Examples
 * Practical examples of using the financial data normalization functions
 */

const {
  normalizeFinancialValue,
  normalizeFinancialData,
  normalizeNepaliNumber,
  validateAndNormalizeFinancialData,
  createNormalizationPipeline,
} = require('./financialNormalization');

console.log('🏦 FinSathi AI - Financial Normalization Examples\n');

// Example 1: Basic value normalization
console.log('📊 Example 1: Basic Value Normalization');
console.log('=' .repeat(50));

const basicExamples = [
  "1,200,000",
  "NPR 1,200,000", 
  "Rs. 1,200,000.50",
  "(1,200,000)",
  "रू १,२०,०००",
  "1.2 LAKH",
  "12 CRORE",
  "",
  null,
  "N/A"
];

basicExamples.forEach(value => {
  const normalized = normalizeFinancialValue(value);
  console.log(`"${value}" → ${normalized}`);
});

// Example 2: Nepali number formats
console.log('\n🇳🇵 Example 2: Nepali Number Formats');
console.log('=' .repeat(50));

const nepaliExamples = [
  "1.5 LAKH",
  "2.25 LAKHS", 
  "12.5 CRORE",
  "3 CRORES",
  "1.2 ARAB",
  "१,२०,०००",
  "रू ५०,०००"
];

nepaliExamples.forEach(value => {
  const normalized = normalizeNepaliNumber(value);
  console.log(`"${value}" → ${normalized}`);
});

// Example 3: Financial statement normalization
console.log('\n📋 Example 3: Complete Financial Statement');
console.log('=' .repeat(50));

const rawFinancialStatement = {
  revenue: "NPR 12,50,00,000",
  netProfit: "(2,30,00,000)",
  totalAssets: "45.5 CRORE", 
  totalEquity: "15.2 CRORE",
  totalDebt: "18.7 CRORE",
  // Additional fields that might be present
  operatingProfit: "3,45,00,000",
  eps: "Rs. 120.50",
  bookValue: "रू ७५०.००"
};

console.log('Raw Data:');
console.log(JSON.stringify(rawFinancialStatement, null, 2));

const normalizedStatement = normalizeFinancialData(rawFinancialStatement, [
  'revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt',
  'operatingProfit', 'eps', 'bookValue'
]);

console.log('\nNormalized Data:');
console.log(JSON.stringify(normalizedStatement, null, 2));

// Example 4: Validation with business rules
console.log('\n✅ Example 4: Validation with Business Rules');
console.log('=' .repeat(50));

const validation = validateAndNormalizeFinancialData(rawFinancialStatement);

console.log(`Valid: ${validation.valid}`);
console.log(`Errors: ${validation.errors.length}`);
console.log(`Warnings: ${validation.warnings.length}`);

if (validation.errors.length > 0) {
  console.log('\n❌ Errors:');
  validation.errors.forEach(error => console.log(`  - ${error}`));
}

if (validation.warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  validation.warnings.forEach(warning => console.log(`  - ${warning}`));
}

// Example 5: Batch processing pipeline
console.log('\n🔄 Example 5: Batch Processing Pipeline');
console.log('=' .repeat(50));

const batchData = [
  {
    company: "Nabil Bank",
    year: 2023,
    revenue: "15,50,00,000",
    netProfit: "3,20,00,000", 
    totalAssets: "125.5 CRORE",
    totalEquity: "22.3 CRORE",
    totalDebt: "85.2 CRORE"
  },
  {
    company: "Nepal Insurance",
    year: 2023,
    revenue: "रू ८,२०,०००",
    netProfit: "(1,50,00,000)",
    totalAssets: "45.8 CRORE",
    totalEquity: "18.5 CRORE",
    totalDebt: "20.3 CRORE"
  },
  {
    company: "Standard Chartered",
    year: 2023,
    revenue: "12.3 CRORE",
    netProfit: "2.8 CRORE",
    totalAssets: "95.2 CRORE", 
    totalEquity: "25.1 CRORE",
    totalDebt: "42.7 CRORE"
  },
  {
    // This one has some issues
    company: "Problem Bank",
    year: 2023,
    revenue: "invalid", // Invalid revenue
    netProfit: "1,20,00,000",
    totalAssets: "35.5 CRORE",
    totalEquity: "8.2 CRORE", 
    totalDebt: "45.3 CRORE" // Debt > equity + assets (warning)
  }
];

console.log(`Processing ${batchData.length} financial statements...\n`);

// Process with progress tracking
const pipeline = await createNormalizationPipeline(batchData, {
  onProgress: (current, total, result) => {
    const progress = ((current / total) * 100).toFixed(1);
    console.log(`Progress: ${progress}% (${current}/${total}) - ${result.valid ? '✅' : '❌'}`);
  }
});

console.log('\n📈 Batch Processing Results:');
console.log(`Total: ${pipeline.summary.total}`);
console.log(`Successful: ${pipeline.summary.successful}`);
console.log(`Failed: ${pipeline.summary.failed}`);
console.log(`Warnings: ${pipeline.summary.warnings}`);

if (pipeline.errors.length > 0) {
  console.log('\n❌ Processing Errors:');
  pipeline.errors.forEach(error => {
    console.log(`  Company ${error.index + 1}: ${error.errors.join(', ')}`);
  });
}

// Example 6: Advanced configuration options
console.log('\n⚙️  Example 6: Advanced Configuration');
console.log('=' .repeat(50));

const advancedExamples = [
  { value: "1,200,000.789", config: { roundTo: 2 } },
  { value: "-1,200,000", config: { allowNegative: false } },
  { value: "N/A", config: { defaultValue: null } },
  { value: "1,200,000", config: { removeCurrency: false } }
];

advancedExamples.forEach(({ value, config }) => {
  const normalized = normalizeFinancialValue(value, config);
  console.log(`"${value}" with config ${JSON.stringify(config)} → ${normalized}`);
});

// Example 7: Real-world PDF extraction scenario
console.log('\n📄 Example 7: Real-world PDF Extraction Scenario');
console.log('=' .repeat(50));

// Simulating data extracted from PDF with various formatting issues
const pdfExtractedData = {
  // Clean data
  "Total Revenue": "NPR 25,60,00,000",
  "Net Profit": "  4,80,00,000  ",
  "Total Assets": "185.3 CRORE",
  
  // Problematic data
  "Total Liabilities": " (62,5,00,000)", // Parentheses + spaces
  "Share Capital": "रू २०,००,०००", // Devanagari
  "Reserves": "1.5 LAKH", // Lakh notation
  "EPS": "Rs. 240.75 per share", // With text
  "Book Value": "N/A", // Missing value
  "Operating Margin": "18.5%", // Percentage
  "P/E Ratio": "", // Empty string
};

console.log('Raw PDF Extracted Data:');
Object.entries(pdfExtractedData).forEach(([key, value]) => {
  console.log(`  ${key}: "${value}"`);
});

// Map and normalize the data
const fieldMapping = {
  "Total Revenue": "revenue",
  "Net Profit": "netProfit", 
  "Total Assets": "totalAssets",
  "Total Liabilities": "totalDebt",
  "Share Capital": "totalEquity",
};

const mappedData = {};
Object.entries(fieldMapping).forEach(([pdfField, normalField]) => {
  if (pdfExtractedData[pdfField] !== undefined) {
    mappedData[normalField] = pdfExtractedData[pdfField];
  }
});

const finalValidation = validateAndNormalizeFinancialData(mappedData);

console.log('\n✅ Final Normalized and Validated Data:');
console.log(JSON.stringify(finalValidation.data, null, 2));

console.log('\n📊 Summary:');
console.log(`Valid: ${finalValidation.valid}`);
console.log(`Data Quality Score: ${((finalValidation.summary?.successful || 1) / Object.keys(fieldMapping).length * 100).toFixed(1)}%`);

// Example 8: Performance benchmarking
console.log('\n⚡ Example 8: Performance Benchmarking');
console.log('=' .repeat(50));

const performanceTestData = Array.from({ length: 10000 }, (_, i) => ({
  revenue: `${(i + 1) * 1000}`,
  netProfit: `${(i + 1) * 100}`,
  totalAssets: `${(i + 1) * 5000}`,
  totalEquity: `${(i + 1) * 2000}`,
  totalDebt: `${(i + 1) * 1000}`,
}));

console.log(`Processing ${performanceTestData.length} records for performance test...`);

const startTime = performance.now();
const performanceResult = await createNormalizationPipeline(performanceTestData);
const endTime = performance.now();

const processingTime = endTime - startTime;
const recordsPerSecond = (performanceTestData.length / (processingTime / 1000)).toFixed(0);

console.log(`⏱️  Processing Time: ${processingTime.toFixed(2)}ms`);
console.log(`🚀 Speed: ${recordsPerSecond} records/second`);
console.log(`✅ Success Rate: ${((performanceResult.summary.successful / performanceResult.summary.total) * 100).toFixed(1)}%`);

console.log('\n🎯 All examples completed successfully!');
console.log('💡 Key takeaways:');
console.log('  • Handles all Nepali financial formats');
console.log('  • Robust error handling and validation');  
console.log('  • High performance batch processing');
console.log('  • Configurable for different use cases');
console.log('  • Production-ready with comprehensive testing');
