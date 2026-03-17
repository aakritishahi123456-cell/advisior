/**
 * FinSathi AI - Financial Data Normalization
 * Utility functions for cleaning and normalizing financial values extracted from PDFs
 */

/**
 * Main normalization function for financial values
 * @param {string|number|null|undefined} value - Raw value from PDF extraction
 * @param {Object} options - Normalization options
 * @returns {number|null} Normalized numeric value
 */
function normalizeFinancialValue(value, options = {}) {
  const {
    defaultValue = 0,
    allowNegative = true,
    roundTo = 2,
    removeCurrency = true,
  } = options;

  // Handle null/undefined/empty values
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }

  // Convert to string for processing
  let stringValue = String(value).trim();

  // Convert Devanagari digits to Arabic before other processing
  stringValue = convertDevanagariDigits(stringValue);

  // Remove currency symbols and text
  if (removeCurrency) {
    stringValue = removeCurrencySymbols(stringValue);
  }

  // Handle Nepali lakh/crore notation before other processing
  const nepaliMultipliers = {
    'CRORES?': 10000000,
    'LAKHS?': 100000,
    'ARABS?': 1000000000,
    'KARBS?': 1000000000,
  };
  for (const [word, multiplier] of Object.entries(nepaliMultipliers)) {
    const pattern = new RegExp(`([\\d,\\.]+)\\s*${word}`, 'i');
    const match = stringValue.match(pattern);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num)) return round(num * multiplier, roundTo !== null && roundTo !== undefined ? roundTo : 2);
    }
  }

  // Handle parentheses for negative numbers
  stringValue = handleParentheses(stringValue);

  // Check for mixed alphanumeric (malformed) - letters mixed with digits
  const trimmed = stringValue.trim();
  if (/[a-zA-Z]/.test(trimmed) && /\d/.test(trimmed)) {
    return defaultValue;
  }

  // Remove commas and other formatting
  stringValue = removeFormatting(stringValue);

  // Reject strings with multiple decimal points (malformed like "1.2.3.4")
  const dotCount = (stringValue.match(/\./g) || []).length;
  if (dotCount > 1) {
    return defaultValue;
  }

  // Convert to number
  let numericValue = parseFloat(stringValue);

  // Handle invalid numbers
  if (isNaN(numericValue)) {
    return defaultValue;
  }

  // Handle negative numbers
  if (!allowNegative && numericValue < 0) {
    numericValue = Math.abs(numericValue);
  }

  // Round if specified
  if (roundTo !== null && roundTo !== undefined) {
    numericValue = round(numericValue, roundTo);
  }

  return numericValue;
}

/**
 * Remove currency symbols and text
 * @param {string} value - String with currency symbols
 * @returns {string} Clean string
 */
function removeCurrencySymbols(value) {
  // Nepali and common currency symbols
  const currencyPatterns = [
    /NPR/gi,
    /Rs\.?/gi,
    /रू\s*\.?/g, // Devanagari Rs
    /₹/g, // Indian Rupee
    /\$/g, // Dollar
    /€/g, // Euro
    /£/g, // Pound
    /¥/g, // Yen/Yuan
    /रु\.?/g, // Devanagari Rupee
    /रू/g, // Devanagari
  ];

  let cleaned = value;
  currencyPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  // Remove currency words
  const currencyWords = [
    /\bnpr\b/gi,
    /\brupees?\b/gi,
    /\bdollars?\b/gi,
    /\beuros?\b/gi,
    /\bpounds?\b/gi,
    /\byen\b/gi,
    /\bरुपैयाँ?\b/gi,
    /\bरू\b/gi,
  ];

  currencyWords.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });

  return cleaned.trim();
}

/**
 * Handle parentheses for negative numbers
 * @param {string} value - String with potential parentheses
 * @returns {string} String with proper negative sign
 */
function handleParentheses(value) {
  // Handle (1,200,000) -> -1,200,000
  const parenthesesPattern = /^\(([\d,\.\s-]+)\)$/;
  const match = value.match(parenthesesPattern);
  
  if (match) {
    return '-' + match[1];
  }
  
  return value;
}

/**
 * Remove formatting characters
 * @param {string} value - String with formatting
 * @returns {string} Clean string
 */
function removeFormatting(value) {
  // Remove commas, spaces, and other formatting
  return value
    .replace(/,/g, '') // Remove commas
    .replace(/\s+/g, '') // Remove spaces
    .replace(/[^\d\.-]/g, '') // Keep only digits, decimal, negative sign
    .trim();
}

/**
 * Round number to specified decimal places
 * @param {number} value - Number to round
 * @param {number} decimals - Decimal places
 * @returns {number} Rounded number
 */
function round(value, decimals) {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}

/**
 * Batch normalize multiple financial fields
 * @param {Object} data - Object with financial fields
 * @param {Array} fields - Array of field names to normalize
 * @param {Object} options - Normalization options
 * @returns {Object} Object with normalized values
 */
function normalizeFinancialData(data, fields, options = {}) {
  const normalized = { ...data };
  
  fields.forEach(field => {
    if (data.hasOwnProperty(field)) {
      normalized[field] = normalizeFinancialValue(data[field], options);
    }
  });
  
  return normalized;
}

/**
 * Specialized function for Nepali number formats
 * @param {string} value - Nepali formatted number
 * @returns {number} Normalized number
 */
function normalizeNepaliNumber(value) {
  if (typeof value !== 'string') {
    return normalizeFinancialValue(value);
  }

  // Handle Nepali lakh/crore notation
  let cleaned = value.toUpperCase().trim();
  
  // Convert words to numbers
  const numberWords = {
    'LAKH': 100000,
    'LAKHS': 100000,
    'CRORE': 10000000,
    'CRORES': 10000000,
    'ARAB': 1000000000,
    'ARABS': 1000000000,
    'KARB': 1000000000,
    'KARBS': 1000000000,
  };

  for (const [word, multiplier] of Object.entries(numberWords)) {
    const pattern = new RegExp(`([\\d,\\.]+)\\s*${word}`, 'i');
    const match = cleaned.match(pattern);
    
    if (match) {
      const number = normalizeFinancialValue(match[1]);
      return number * multiplier;
    }
  }

  // Handle Devanagari digits
  cleaned = convertDevanagariDigits(cleaned);
  
  return normalizeFinancialValue(cleaned);
}

/**
 * Convert Devanagari digits to Arabic digits
 * @param {string} value - String with Devanagari digits
 * @returns {string} String with Arabic digits
 */
function convertDevanagariDigits(value) {
  const devanagariMap = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  
  let converted = value;
  Object.entries(devanagariMap).forEach(([devanagari, arabic]) => {
    converted = converted.replace(new RegExp(devanagari, 'g'), arabic);
  });
  
  return converted;
}

/**
 * Validate and normalize financial statement data
 * @param {Object} financialData - Raw financial statement data
 * @returns {Object} Validated and normalized data
 */
function validateAndNormalizeFinancialData(financialData) {
  const requiredFields = [
    'revenue',
    'netProfit', 
    'totalAssets',
    'totalEquity',
    'totalDebt'
  ];

  const validationRules = {
    revenue: { min: 0, max: 1000000000000, required: true }, // Max 1000 billion NPR
    netProfit: { min: -100000000000, max: 100000000000, required: true },
    totalAssets: { min: 0, max: 1000000000000, required: true },
    totalEquity: { min: 0, max: 1000000000000, required: true },
    totalDebt: { min: 0, max: 1000000000000, required: true },
  };

  const errors = [];
  const warnings = [];

  // Check for missing required fields BEFORE normalization
  requiredFields.forEach(field => {
    if (financialData[field] === null || financialData[field] === undefined) {
      errors.push(`${field} is required but missing`);
    } else if (typeof financialData[field] === 'string') {
      // Check if string value is parseable as a number (after normalization)
      const normalized = normalizeFinancialValue(financialData[field]);
      if (normalized === 0 && financialData[field].trim() !== '0' && !/\d/.test(financialData[field])) {
        errors.push(`${field} has invalid value: "${financialData[field]}"`);
      }
    }
  });

  const normalized = normalizeFinancialData(financialData, requiredFields);

  // Validate each field
  Object.entries(validationRules).forEach(([field, rules]) => {
    // Skip if already flagged as missing
    if (financialData[field] === null || financialData[field] === undefined) return;

    const value = normalized[field];

    if (typeof value === 'number') {
      if (value < rules.min) {
        errors.push(`${field} (${value}) is below minimum (${rules.min})`);
      }
      if (value > rules.max) {
        warnings.push(`${field} (${value}) seems unusually high`);
      }
    }
  });

  // Business logic validation
  if (normalized.totalAssets && normalized.totalEquity && normalized.totalDebt) {
    if (normalized.totalEquity + normalized.totalDebt > normalized.totalAssets * 1.1) {
      warnings.push('Equity + Debt exceeds Assets (possible data error)');
    }
  }

  return {
    data: normalized,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create normalization pipeline for batch processing
 * @param {Array} rawData - Array of raw financial data objects
 * @param {Object} options - Pipeline options
 * @returns {Object} Processing results
 */
function createNormalizationPipeline(rawData, options = {}) {
  const {
    fields = ['revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt'],
    parallel = false,
    onProgress = null,
  } = options;

  const results = {
    processed: [],
    errors: [],
    summary: {
      total: rawData.length,
      successful: 0,
      failed: 0,
      warnings: 0,
    }
  };

  const processItem = (item, index) => {
    try {
      const validation = validateAndNormalizeFinancialData(item);
      
      if (validation.valid) {
        results.processed.push(validation.data);
        results.summary.successful++;
      } else {
        results.errors.push({
          index,
          item,
          errors: validation.errors,
        });
        results.summary.failed++;
      }

      if (validation.warnings.length > 0) {
        results.summary.warnings += validation.warnings.length;
      }

      if (onProgress) {
        onProgress(index + 1, rawData.length, validation);
      }

    } catch (error) {
      results.errors.push({
        index,
        item,
        error: error.message,
      });
      results.summary.failed++;
    }
  };

  if (parallel) {
    // Process items in parallel (for large datasets)
    const promises = rawData.map((item, index) => 
      Promise.resolve().then(() => processItem(item, index))
    );
    return Promise.all(promises).then(() => results);
  } else {
    // Process items sequentially
    rawData.forEach(processItem);
    return Promise.resolve(results);
  }
}

// Export all functions
module.exports = {
  normalizeFinancialValue,
  normalizeFinancialData,
  normalizeNepaliNumber,
  normalizeDevanagariDigits: convertDevanagariDigits,
  validateAndNormalizeFinancialData,
  createNormalizationPipeline,
  removeCurrencySymbols,
  handleParentheses,
  removeFormatting,
  round,
  // Utility constants
  NEPALI_CURRENCY_PATTERNS: [
    /NPR/gi, /Rs\.?/gi, /रू\s*\.?/g, /रु\.?/g
  ],
  NEPALI_NUMBER_WORDS: {
    'LAKH': 100000, 'LAKHS': 100000,
    'CRORE': 10000000, 'CRORES': 10000000,
    'ARAB': 1000000000, 'ARABS': 1000000000,
  },
  VALIDATION_RULES: {
    revenue: { min: 0, max: 1000000000000 },
    netProfit: { min: -100000000000, max: 100000000000 },
    totalAssets: { min: 0, max: 1000000000000 },
    totalEquity: { min: 0, max: 1000000000000 },
    totalDebt: { min: 0, max: 1000000000000 },
  },
};
