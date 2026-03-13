/**
 * FinSathi AI - Goal-Based Investment Planner
 * Calculate monthly investment requirements to reach financial goals
 */

/**
 * Calculate monthly investment required to reach financial goal
 * @param {Object} inputs - Investment planning inputs
 * @param {number} inputs.goalAmount - Target amount to achieve
 * @param {number} inputs.currentSavings - Current amount saved
 * @param {number} inputs.yearsToGoal - Years to reach the goal
 * @param {number} inputs.expectedReturnRate - Expected annual return rate (percentage)
 * @returns {Object} Comprehensive investment plan
 */
function calculateMonthlyInvestment(inputs) {
  try {
    // Validate inputs
    const validation = validateInputs(inputs);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
        code: validation.code,
      };
    }

    const {
      goalAmount,
      currentSavings,
      yearsToGoal,
      expectedReturnRate,
    } = inputs;

    // Convert annual return rate to monthly rate
    const monthlyReturnRate = expectedReturnRate / 100 / 12;
    const totalMonths = yearsToGoal * 12;

    // Calculate future value of current savings
    const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + monthlyReturnRate, totalMonths);

    // Calculate remaining amount needed from future value
    const remainingAmount = Math.max(0, goalAmount - futureValueOfCurrentSavings);

    // Calculate monthly investment using future value of annuity formula
    let monthlyInvestmentRequired;
    
    if (monthlyReturnRate === 0) {
      // Simple division for zero return rate
      monthlyInvestmentRequired = remainingAmount / totalMonths;
    } else {
      // Future value of annuity formula
      monthlyInvestmentRequired = remainingAmount * monthlyReturnRate / (Math.pow(1 + monthlyReturnRate, totalMonths) - 1);
    }

    // Calculate additional metrics
    const totalInvestmentNeeded = monthlyInvestmentRequired * totalMonths;
    const totalContributionIncludingCurrent = totalInvestmentNeeded + currentSavings;
    const interestEarnedOnCurrent = futureValueOfCurrentSavings - currentSavings;
    const interestEarnedOnNew = goalAmount - futureValueOfCurrentSavings - totalInvestmentNeeded;
    const totalInterestEarned = interestEarnedOnCurrent + interestEarnedOnNew;

    // Calculate investment schedule
    const investmentSchedule = generateInvestmentSchedule(
      currentSavings,
      monthlyInvestmentRequired,
      monthlyReturnRate,
      totalMonths,
      goalAmount
    );

    // Calculate risk metrics
    const riskMetrics = calculateRiskMetrics(inputs, monthlyInvestmentRequired);

    // Generate recommendations
    const recommendations = generateRecommendations(inputs, monthlyInvestmentRequired, riskMetrics);

    // Calculate alternative scenarios
    const scenarios = calculateAlternativeScenarios(inputs);

    return {
      success: true,
      data: {
        goalAnalysis: {
          goalAmount,
          currentSavings,
          remainingAmount,
          yearsToGoal,
          monthsToGoal: totalMonths,
          percentageCompleted: (currentSavings / goalAmount) * 100,
          expectedReturnRate,
          monthlyReturnRate,
        },
        monthlyInvestment: {
          required: Math.round(monthlyInvestmentRequired * 100) / 100,
          totalInvestment: Math.round(totalInvestmentNeeded * 100) / 100,
          totalContribution: Math.round(totalContributionIncludingCurrent * 100) / 100,
        },
        projections: {
          futureValueOfCurrentSavings: Math.round(futureValueOfCurrentSavings * 100) / 100,
          interestEarnedOnCurrent: Math.round(interestEarnedOnCurrent * 100) / 100,
          interestEarnedOnNew: Math.round(interestEarnedOnNew * 100) / 100,
          totalInterestEarned: Math.round(totalInterestEarned * 100) / 100,
          finalValue: goalAmount,
        },
        schedule: investmentSchedule,
        riskMetrics,
        recommendations,
        scenarios,
        affordability: calculateAffordability(inputs, monthlyInvestmentRequired),
      },
      meta: {
        calculatedAt: new Date().toISOString(),
        version: '1.0.0',
        assumptions: {
          constantReturnRate: true,
          monthlyCompounding: true,
          ignoresInflation: true,
          ignoresTaxes: true,
        },
      },
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to calculate monthly investment',
      code: 'CALCULATION_ERROR',
      details: error.message,
    };
  }
}

/**
 * Generate detailed investment schedule
 * @param {number} currentSavings - Current savings
 * @param {number} monthlyInvestment - Monthly investment amount
 * @param {number} monthlyReturnRate - Monthly return rate
 * @param {number} totalMonths - Total number of months
 * @param {number} goalAmount - Goal amount
 * @returns {Array} Investment schedule
 */
function generateInvestmentSchedule(currentSavings, monthlyInvestment, monthlyReturnRate, totalMonths, goalAmount) {
  const schedule = [];
  let balance = currentSavings;
  let cumulativeInvestment = currentSavings;

  // Generate yearly summary
  for (let year = 1; year <= Math.ceil(totalMonths / 12); year++) {
    const startOfYear = balance;
    const yearStartMonth = (year - 1) * 12;
    const yearEndMonth = Math.min(year * 12, totalMonths);
    
    for (let month = yearStartMonth; month < yearEndMonth; month++) {
      balance = balance * (1 + monthlyReturnRate) + monthlyInvestment;
      cumulativeInvestment += monthlyInvestment;
    }

    const yearEndBalance = balance;
    const yearInvestment = monthlyInvestment * Math.min(12, yearEndMonth - yearStartMonth);
    const yearInterest = yearEndBalance - startOfYear - yearInvestment;
    const yearReturn = ((yearEndBalance - startOfYear) / startOfYear) * 100;

    schedule.push({
      year,
      startBalance: Math.round(startOfYear * 100) / 100,
      endBalance: Math.round(yearEndBalance * 100) / 100,
      monthlyInvestment: Math.round(monthlyInvestment * 100) / 100,
      totalInvestment: Math.round(yearInvestment * 100) / 100,
      interestEarned: Math.round(yearInterest * 100) / 100,
      annualReturn: Math.round(yearReturn * 100) / 100,
      percentageOfGoal: Math.round((yearEndBalance / goalAmount) * 100),
      monthsInYear: yearEndMonth - yearStartMonth,
    });

    // Stop if goal reached
    if (balance >= goalAmount) {
      break;
    }
  }

  return schedule;
}

/**
 * Calculate risk metrics for the investment plan
 * @param {Object} inputs - Investment inputs
 * @param {number} monthlyInvestment - Required monthly investment
 * @returns {Object} Risk metrics
 */
function calculateRiskMetrics(inputs, monthlyInvestment) {
  const { goalAmount, currentSavings, yearsToGoal, expectedReturnRate } = inputs;
  
  // Calculate investment concentration risk
  const investmentConcentration = monthlyInvestment / (inputs.monthlyIncome || 100000);
  
  // Calculate time horizon risk
  const timeHorizonRisk = yearsToGoal < 5 ? 'HIGH' : yearsToGoal < 10 ? 'MEDIUM' : 'LOW';
  
  // Calculate return rate risk
  const returnRateRisk = expectedReturnRate > 15 ? 'HIGH' : expectedReturnRate > 10 ? 'MEDIUM' : 'LOW';
  
  // Calculate goal size risk
  const goalSizeRisk = goalAmount > 10000000 ? 'HIGH' : goalAmount > 5000000 ? 'MEDIUM' : 'LOW';
  
  // Calculate overall risk score
  const riskFactors = [
    investmentConcentration > 0.3 ? 1 : 0,  // High concentration
    timeHorizonRisk === 'HIGH' ? 1 : 0,     // Short time horizon
    returnRateRisk === 'HIGH' ? 1 : 0,       // High expected return
    goalSizeRisk === 'HIGH' ? 1 : 0,         // Large goal
  ];
  
  const overallRiskScore = riskFactors.reduce((sum, factor) => sum + factor, 0);
  const overallRiskLevel = overallRiskScore >= 3 ? 'HIGH' : overallRiskScore >= 2 ? 'MEDIUM' : 'LOW';

  return {
    investmentConcentration: Math.round(investmentConcentration * 100) / 100,
    timeHorizonRisk,
    returnRateRisk,
    goalSizeRisk,
    overallRiskScore,
    overallRiskLevel,
    riskFactors: riskFactors,
  };
}

/**
 * Generate personalized recommendations
 * @param {Object} inputs - Investment inputs
 * @param {number} monthlyInvestment - Required monthly investment
 * @param {Object} riskMetrics - Risk metrics
 * @returns {Array} Recommendations
 */
function generateRecommendations(inputs, monthlyInvestment, riskMetrics) {
  const recommendations = [];
  const { goalAmount, currentSavings, yearsToGoal, expectedReturnRate } = inputs;

  // Affordability recommendations
  if (riskMetrics.investmentConcentration > 0.3) {
    recommendations.push({
      type: 'AFFORDABILITY',
      priority: 'HIGH',
      title: 'High Investment Concentration',
      description: `Your monthly investment represents ${Math.round(riskMetrics.investmentConcentration * 100)}% of your income. Consider extending the time horizon or reducing the goal amount.`,
    });
  }

  // Time horizon recommendations
  if (yearsToGoal < 3) {
    recommendations.push({
      type: 'TIME_HORIZON',
      priority: 'HIGH',
      title: 'Short Time Horizon',
      description: 'With less than 3 years to reach your goal, consider conservative investments with lower risk to protect your capital.',
    });
  } else if (yearsToGoal > 20) {
    recommendations.push({
      type: 'TIME_HORIZON',
      priority: 'MEDIUM',
      title: 'Long Time Horizon',
      description: 'With a long time horizon, consider increasing your expected return rate through equity investments for better compounding effects.',
    });
  }

  // Return rate recommendations
  if (expectedReturnRate < 5) {
    recommendations.push({
      type: 'RETURN_RATE',
      priority: 'MEDIUM',
      title: 'Low Expected Return',
      description: 'Consider exploring higher return investment options like mutual funds or ETFs to reach your goal faster.',
    });
  } else if (expectedReturnRate > 15) {
    recommendations.push({
      type: 'RETURN_RATE',
      priority: 'HIGH',
      title: 'High Expected Return',
      description: 'High return expectations come with increased risk. Ensure you understand the investment instruments and associated risks.',
    });
  }

  // Goal size recommendations
  if (goalAmount > 20000000) {
    recommendations.push({
      type: 'GOAL_SIZE',
      priority: 'MEDIUM',
      title: 'Large Goal Amount',
      description: 'For large goals, consider breaking them into smaller sub-goals and diversifying across different investment instruments.',
    });
  }

  // Current savings recommendations
  if (currentSavings < goalAmount * 0.1) {
    recommendations.push({
      type: 'CURRENT_SAVINGS',
      priority: 'HIGH',
      title: 'Low Current Savings',
      description: `Your current savings represent only ${Math.round((currentSavings / goalAmount) * 100)}% of your goal. Consider increasing your initial investment if possible.`,
    });
  }

  // Risk-based recommendations
  if (riskMetrics.overallRiskLevel === 'HIGH') {
    recommendations.push({
      type: 'RISK_MANAGEMENT',
      priority: 'HIGH',
      title: 'High Risk Profile',
      description: 'Your investment plan has multiple risk factors. Consider diversifying investments and setting up regular portfolio reviews.',
    });
  }

  // General investment recommendations
  recommendations.push({
    type: 'GENERAL',
    priority: 'MEDIUM',
    title: 'Systematic Investment Plan',
    description: 'Consider setting up a Systematic Investment Plan (SIP) to automate your monthly investments and benefit from rupee cost averaging.',
  });

  recommendations.push({
    type: 'GENERAL',
    priority: 'MEDIUM',
    title: 'Emergency Fund',
    description: 'Maintain an emergency fund separate from your goal investments to avoid withdrawing from your investments during emergencies.',
  });

  recommendations.push({
    type: 'GENERAL',
    priority: 'LOW',
    title: 'Regular Review',
    description: 'Review your investment progress quarterly and adjust your strategy based on performance and changing market conditions.',
  });

  return recommendations;
}

/**
 * Calculate affordability metrics
 * @param {Object} inputs - Investment inputs
 * @param {number} monthlyInvestment - Required monthly investment
 * @returns {Object} Affordability analysis
 */
function calculateAffordability(inputs, monthlyInvestment) {
  const { monthlyIncome = 100000 } = inputs; // Default income for calculation
  
  const investmentToIncomeRatio = monthlyInvestment / monthlyIncome;
  const fiftyPercentRule = monthlyIncome * 0.5;
  const thirtyPercentRule = monthlyIncome * 0.3;
  
  let affordabilityLevel = 'AFFORDABLE';
  let affordabilityScore = 100;
  
  if (monthlyInvestment > fiftyPercentRule) {
    affordabilityLevel = 'VERY_DIFFICULT';
    affordabilityScore = 20;
  } else if (monthlyInvestment > thirtyPercentRule) {
    affordabilityLevel = 'DIFFICULT';
    affordabilityScore = 40;
  } else if (monthlyInvestment > monthlyIncome * 0.2) {
    affordabilityLevel = 'MODERATE';
    affordabilityScore = 60;
  } else if (monthlyInvestment > monthlyIncome * 0.1) {
    affordabilityLevel = 'EASY';
    affordabilityScore = 80;
  }

  return {
    monthlyInvestment,
    monthlyIncome,
    investmentToIncomeRatio: Math.round(investmentToIncomeRatio * 100) / 100,
    affordabilityLevel,
    affordabilityScore,
    recommendedMaximum: monthlyIncome * 0.3,
    fiftyPercentRule,
    thirtyPercentRule,
  };
}

/**
 * Calculate alternative scenarios
 * @param {Object} inputs - Base investment inputs
 * @returns {Array} Alternative scenarios
 */
function calculateAlternativeScenarios(inputs) {
  const scenarios = [];
  const { goalAmount, currentSavings, yearsToGoal, expectedReturnRate } = inputs;

  // Scenario 1: Different time horizons
  const shorterHorizon = Math.max(1, yearsToGoal - 5);
  const longerHorizon = yearsToGoal + 5;
  
  scenarios.push({
    name: 'Shorter Time Horizon',
    description: `Reach your goal in ${shorterHorizon} years instead of ${yearsToGoal}`,
    inputs: { ...inputs, yearsToGoal: shorterHorizon },
  });

  scenarios.push({
    name: 'Longer Time Horizon',
    description: `Reach your goal in ${longerHorizon} years instead of ${yearsToGoal}`,
    inputs: { ...inputs, yearsToGoal: longerHorizon },
  });

  // Scenario 2: Different return rates
  const conservativeReturn = Math.max(1, expectedReturnRate - 3);
  const aggressiveReturn = expectedReturnRate + 3;
  
  scenarios.push({
    name: 'Conservative Returns',
    description: `Assume ${conservativeReturn}% annual return instead of ${expectedReturnRate}%`,
    inputs: { ...inputs, expectedReturnRate: conservativeReturn },
  });

  scenarios.push({
    name: 'Aggressive Returns',
    description: `Assume ${aggressiveReturn}% annual return instead of ${expectedReturnRate}%`,
    inputs: { ...inputs, expectedReturnRate: aggressiveReturn },
  });

  // Scenario 3: Different monthly investments
  const increasedMonthly = calculateMonthlyInvestment({
    ...inputs,
    yearsToGoal: yearsToGoal - 2,
  });
  
  scenarios.push({
    name: 'Increased Monthly Investment',
    description: `Invest more monthly to reach goal 2 years earlier`,
    inputs: { ...inputs },
    result: increasedMonthly,
  });

  // Calculate results for each scenario
  return scenarios.map(scenario => {
    const result = calculateMonthlyInvestment(scenario.inputs);
    return {
      ...scenario,
      result: result.success ? result.data : null,
    };
  });
}

/**
 * Validate input parameters
 * @param {Object} inputs - Input parameters
 * @returns {Object} Validation result
 */
function validateInputs(inputs) {
  const { goalAmount, currentSavings, yearsToGoal, expectedReturnRate } = inputs;
  const errors = [];

  if (!goalAmount || goalAmount <= 0) {
    errors.push('Goal amount must be a positive number');
  }

  if (currentSavings === undefined || currentSavings < 0) {
    errors.push('Current savings must be a non-negative number');
  }

  if (!yearsToGoal || yearsToGoal <= 0 || yearsToGoal > 50) {
    errors.push('Years to goal must be between 1 and 50');
  }

  if (expectedReturnRate === undefined || expectedReturnRate < -50 || expectedReturnRate > 100) {
    errors.push('Expected return rate must be between -50% and 100%');
  }

  if (currentSavings >= goalAmount) {
    errors.push('Current savings already meet or exceed the goal amount');
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.join('; '),
      code: 'VALIDATION_ERROR',
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Calculate multiple goals simultaneously
 * @param {Array} goals - Array of goal objects
 * @param {number} totalMonthlyIncome - Total monthly income
 * @returns {Object} Multiple goals analysis
 */
function calculateMultipleGoals(goals, totalMonthlyIncome = 100000) {
  try {
    const results = goals.map(goal => calculateMonthlyInvestment(goal));
    
    const totalMonthlyInvestment = results.reduce((sum, result) => 
      sum + (result.success ? result.data.monthlyInvestment.required : 0), 0
    );

    const investmentToIncomeRatio = totalMonthlyInvestment / totalMonthlyIncome;
    const affordable = totalMonthlyInvestment <= totalMonthlyIncome * 0.5; // 50% rule

    const priority = goals.map((goal, index) => {
      const result = results[index];
      if (!result.success) return null;

      return {
        goal: goal.goalAmount || `Goal ${index + 1}`,
        monthlyInvestment: result.data.monthlyInvestment.required,
        priority: result.data.riskMetrics.overallRiskLevel === 'HIGH' ? 'HIGH' : 
                 result.data.riskMetrics.overallRiskLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW',
        urgency: goal.yearsToGoal < 5 ? 'HIGH' : goal.yearsToGoal < 10 ? 'MEDIUM' : 'LOW',
        percentageOfTotal: (result.data.monthlyInvestment.required / totalMonthlyInvestment) * 100,
      };
    }).filter(Boolean);

    return {
      success: true,
      data: {
        goals: results,
        summary: {
          totalGoals: goals.length,
          totalMonthlyInvestment: Math.round(totalMonthlyInvestment * 100) / 100,
          investmentToIncomeRatio: Math.round(investmentToIncomeRatio * 100) / 100,
          affordable,
          remainingCapacity: totalMonthlyIncome * 0.5 - totalMonthlyInvestment,
        },
        priority,
        recommendations: totalMonthlyInvestment > totalMonthlyIncome * 0.5 ? [
          {
            type: 'AFFORDABILITY',
            priority: 'HIGH',
            title: 'Exceeds Recommended Investment Limit',
            description: 'Total monthly investments exceed 50% of income. Consider prioritizing goals or extending time horizons.',
          }
        ] : [],
      },
    };

  } catch (error) {
    return {
      success: false,
      error: 'Failed to calculate multiple goals',
      code: 'CALCULATION_ERROR',
      details: error.message,
    };
  }
}

/**
 * Calculate inflation-adjusted goals
 * @param {Object} inputs - Base inputs
 * @param {number} inflationRate - Annual inflation rate
 * @returns {Object} Inflation-adjusted analysis
 */
function calculateInflationAdjustedGoal(inputs, inflationRate) {
  try {
    const { goalAmount, yearsToGoal, expectedReturnRate } = inputs;
    
    // Calculate inflation-adjusted goal amount
    const inflationFactor = Math.pow(1 + inflationRate / 100, yearsToGoal);
    const inflationAdjustedGoal = goalAmount * inflationFactor;
    
    // Calculate real return rate (Fisher equation approximation)
    const realReturnRate = ((1 + expectedReturnRate / 100) / (1 + inflationRate / 100) - 1) * 100;
    
    // Calculate with inflation-adjusted parameters
    const inflationAdjustedInputs = {
      ...inputs,
      goalAmount: inflationAdjustedGoal,
      expectedReturnRate: realReturnRate,
    };

    const result = calculateMonthlyInvestment(inflationAdjustedInputs);

    if (result.success) {
      result.data.inflationAnalysis = {
        originalGoal: goalAmount,
        inflationAdjustedGoal: Math.round(inflationAdjustedGoal * 100) / 100,
        inflationRate,
        inflationImpact: Math.round((inflationAdjustedGoal - goalAmount) * 100) / 100,
        realReturnRate: Math.round(realReturnRate * 100) / 100,
        nominalReturnRate: expectedReturnRate,
      };
    }

    return result;

  } catch (error) {
    return {
      success: false,
      error: 'Failed to calculate inflation-adjusted goal',
      code: 'CALCULATION_ERROR',
      details: error.message,
    };
  }
}

// Export the main function and utilities
module.exports = {
  calculateMonthlyInvestment,
  calculateMultipleGoals,
  calculateInflationAdjustedGoal,
  // Utility functions for advanced usage
  generateInvestmentSchedule,
  calculateRiskMetrics,
  generateRecommendations,
  calculateAffordability,
  calculateAlternativeScenarios,
};
