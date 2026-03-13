import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Password hashing
export const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate random tokens
export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

export const generateVerificationToken = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Nepal format)
export const isValidPhone = (phone) => {
  const phoneRegex = /^(?:\+977)?[9][6-9]\d{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Format currency (NPR)
export const formatCurrency = (amount, locale = 'ne-NP') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'NPR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Format percentage
export const formatPercentage = (value, decimals = 2) => {
  return `${value.toFixed(decimals)}%`;
};

// Calculate EMI (Equated Monthly Installment)
export const calculateEMI = (principal, annualRate, tenureMonths) => {
  const monthlyRate = annualRate / 12 / 100;
  
  if (monthlyRate === 0) {
    return principal / tenureMonths;
  }
  
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  return Math.round(emi * 100) / 100;
};

// Generate amortization schedule
export const generateAmortizationSchedule = (principal, annualRate, tenureMonths) => {
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const monthlyRate = annualRate / 12 / 100;
  let balance = principal;
  const schedule = [];

  for (let month = 1; month <= tenureMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = emi - interestPayment;
    balance -= principalPayment;

    schedule.push({
      month,
      emi,
      principalPayment: Math.round(principalPayment * 100) / 100,
      interestPayment: Math.round(interestPayment * 100) / 100,
      balance: Math.round(Math.max(0, balance) * 100) / 100,
    });
  }

  return schedule;
};

// Calculate financial ratios
export const calculateFinancialRatios = (financialData) => {
  const {
    revenue,
    netProfit,
    totalAssets,
    totalLiabilities,
    equity,
    currentAssets,
    currentLiabilities,
    inventory,
    costOfGoodsSold,
  } = financialData;

  const ratios = {};

  // Profitability ratios
  if (equity && equity > 0) {
    ratios.roe = (netProfit / equity) * 100;
  }
  
  if (revenue && revenue > 0) {
    ratios.profitMargin = (netProfit / revenue) * 100;
    ratios.grossMargin = ((revenue - costOfGoodsSold) / revenue) * 100;
  }

  // Liquidity ratios
  if (currentLiabilities && currentLiabilities > 0) {
    ratios.currentRatio = currentAssets / currentLiabilities;
    
    if (inventory && inventory >= 0) {
      ratios.quickRatio = (currentAssets - inventory) / currentLiabilities;
    }
  }

  // Solvency ratios
  if (totalAssets && totalAssets > 0) {
    ratios.debtRatio = (totalLiabilities / totalAssets) * 100;
  }

  // Efficiency ratios
  if (totalAssets && totalAssets > 0) {
    ratios.assetTurnover = revenue / totalAssets;
  }

  if (inventory && inventory > 0) {
    ratios.inventoryTurnover = costOfGoodsSold / inventory;
  }

  return ratios;
};

// Sanitize input
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

// Validate pagination parameters
export const validatePagination = (page, limit) => {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
  return { page: validPage, limit: validLimit };
};

// Calculate pagination metadata
export const calculatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
  };
};

// Generate slug from string
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Date utilities
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  
  if (isNaN(d.getTime())) {
    return null;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day);
};

export const isDateValid = (date) => {
  const d = new Date(date);
  return !isNaN(d.getTime());
};

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

// Array utilities
export const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const uniqueArray = (array) => {
  return [...new Set(array)];
};

// Object utilities
export const pickKeys = (obj, keys) => {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
    return result;
  }, {});
};

export const omitKeys = (obj, keys) => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

// String utilities
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const truncate = (str, length, suffix = '...') => {
  if (str.length <= length) {
    return str;
  }
  return str.substring(0, length - suffix.length) + suffix;
};

export const camelCase = (str) => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace('-', '').replace('_', '')
  );
};

export const snakeCase = (str) => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

// Number utilities
export const roundTo = (num, decimals) => {
  const factor = Math.pow(10, decimals);
  return Math.round(num * factor) / factor;
};

export const clamp = (num, min, max) => {
  return Math.min(Math.max(num, min), max);
};

export const randomBetween = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Async utilities
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retry = async (fn, maxAttempts = 3, delayMs = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await delay(delayMs * attempt);
    }
  }
};
