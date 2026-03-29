/**
 * Financial Health Score Engine
 * Calculates various health metrics based on user financial data
 */

export interface ScoringBreakdown {
  emergencyScore: number;
  insuranceScore: number;
  debtScore: number;
  diversificationScore: number;
  taxScore: number;
  retirementScore: number;
}

export interface HealthScoreResult {
  totalScore: number;
  breakdown: ScoringBreakdown;
  insights: string[];
  rating: "Critical" | "Poor" | "Fair" | "Good" | "Excellent";
}

interface UserFinancialData {
  age: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  investments: number;
  emi: number;
  insurance: number;
  riskProfile: string;
}

/**
 * Calculate Emergency Fund Score
 * Ideal: 6-12 months of expenses
 */
function calculateEmergencyScore(savings: number, monthlyExpenses: number): number {
  const months = monthlyExpenses > 0 ? savings / monthlyExpenses : 0;
  
  if (months >= 12) return 100;
  if (months >= 6) return 85 + (months - 6) * 2.5;
  if (months >= 3) return 60 + (months - 3) * 8.33;
  if (months >= 1) return 30 + months * 30;
  return Math.min(months * 30, 30);
}

/**
 * Calculate Insurance Adequacy Score
 * Ideal: 10-15x annual income
 */
function calculateInsuranceScore(coverage: number, annualIncome: number): number {
  const ratio = coverage / annualIncome;
  
  if (ratio >= 15) return 100;
  if (ratio >= 12) return 85 + (ratio - 12) * 5;
  if (ratio >= 10) return 70 + (ratio - 10) * 7.5;
  if (ratio >= 5) return 40 + (ratio - 5) * 6;
  return Math.min(ratio * 8, 40);
}

/**
 * Calculate EMI Ratio Score
 * Ideal: EMI < 30% of income
 */
function calculateDebtScore(emi: number, monthlyIncome: number): number {
  if (monthlyIncome === 0) return 0;
  
  const ratio = emi / monthlyIncome;
  
  if (ratio <= 0.1) return 100;
  if (ratio <= 0.2) return 85 + (0.2 - ratio) * 750;
  if (ratio <= 0.3) return 60 + (0.3 - ratio) * 250;
  if (ratio <= 0.4) return 40 + (0.4 - ratio) * 200;
  return Math.max(40 - (ratio - 0.4) * 50, 0);
}

/**
 * Calculate Asset Diversification Score
 */
function calculateDiversificationScore(
  liquidAssets: number,
  fixedAssets: number,
  investments: number,
  totalAssets: number
): number {
  if (totalAssets === 0) return 50;
  
  const liquidRatio = liquidAssets / totalAssets;
  const fixedRatio = fixedAssets / totalAssets;
  const investmentRatio = investments / totalAssets;
  
  // Ideal allocation: Liquid (30-40%), Fixed (30-40%), Investments (20-40%)
  let score = 50;
  
  // Reward balanced portfolio
  if (liquidRatio >= 0.2 && liquidRatio <= 0.5) score += 20;
  if (fixedRatio >= 0.2 && fixedRatio <= 0.5) score += 20;
  if (investmentRatio >= 0.2 && investmentRatio <= 0.5) score += 20;
  
  return Math.min(score, 100);
}

/**
 * Calculate Tax Efficiency Score (simplified)
 */
function calculateTaxScore(investments: number, monthlyIncome: number): number {
  void monthlyIncome;
  
  // Check if using tax-saving avenues (80C limit ~1.5L, 80D, etc)
  // This is simplified - assume 40% of investments are tax-efficient
  const taxEfficientAmount = investments * 0.4;
  const section80C = 150000; // Annual limit
  
  if (taxEfficientAmount <= 0) return 40;
  if (taxEfficientAmount >= section80C) return 100;
  
  return 40 + (taxEfficientAmount / section80C) * 60;
}

/**
 * Calculate Retirement Readiness Score
 */
function calculateRetirementScore(
  currentSavings: number,
  _monthlyIncome: number,
  monthlyExpenses: number,
  age: number
): number {
  // Rough estimate: need 25x annual expenses saved
  const annualExpenses = monthlyExpenses * 12;
  const requiredCorpus = annualExpenses * 25;
  
  // Inflation-adjusted for future value
  const yearsToRetirement = 60 - age;
  const inflationRate = 0.06; // 6% annually
  const futureSavingsRequired = requiredCorpus * Math.pow(1 + inflationRate, yearsToRetirement);
  
  const savingsRatio = currentSavings / futureSavingsRequired;
  
  if (savingsRatio >= 0.5) return 100;
  if (savingsRatio >= 0.3) return 70 + (savingsRatio - 0.3) * 100;
  if (savingsRatio >= 0.1) return 40 + (savingsRatio - 0.1) * 150;
  
  return Math.min(savingsRatio * 400, 40);
}

/**
 * Generate actionable insights
 */
function generateInsights(data: UserFinancialData, breakdown: ScoringBreakdown): string[] {
  const insights: string[] = [];
  const monthlyExpenses = data.monthlyExpenses;
  const monthlyIncome = data.monthlyIncome;
  const annualIncome = monthlyIncome * 12;
  
  // Emergency fund insights
  if (breakdown.emergencyScore < 60) {
    const needed = monthlyExpenses * 6 - data.currentSavings;
    insights.push(`Build emergency fund: Save ₹${Math.round(needed)} more for 6 months coverage`);
  }
  
  // Insurance insights
  if (breakdown.insuranceScore < 70) {
    const coverageNeeded = annualIncome * 12 - data.insurance;
    insights.push(`Increase insurance coverage by ₹${Math.round(coverageNeeded)} for adequate protection`);
  }
  
  // Debt insights
  const emiRatio = monthlyIncome > 0 ? data.emi / monthlyIncome : 0;
  if (emiRatio > 0.3) {
    insights.push(
      `Reduce EMI burden: Currently ${Math.round(emiRatio * 100)}% of income. Target: <30%`
    );
  }
  
  // Savings insights
  const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;
  if (savingsRate < 0.2) {
    insights.push(`Increase savings rate to at least 20% of income (currently ${Math.round(savingsRate * 100)}%)`);
  }
  
  // Investment insights
  if (data.investments < annualIncome * 0.5) {
    insights.push(
      `Invest at least 50% of annual income. Currently investing ${Math.round((data.investments / annualIncome) * 100)}%`
    );
  }
  
  // Tax efficiency
  if (breakdown.taxScore < 70) {
    insights.push(`Maximize tax-saving investments under Section 80C (≤₹1,50,000)`);
  }
  
  // Retirement readiness
  if (breakdown.retirementScore < 50) {
    const yearsToRetirement = 60 - data.age;
    if (yearsToRetirement > 0) {
      insights.push(
        `Increase monthly savings to be retirement-ready by 60. Time left: ${yearsToRetirement} years`
      );
    }
  }
  
  return insights.slice(0, 5); // Return top 5 insights
}

/**
 * Calculate overall health score
 */
export function calculateHealthScore(data: UserFinancialData): HealthScoreResult {
  const breakdown: ScoringBreakdown = {
    emergencyScore: calculateEmergencyScore(data.currentSavings, data.monthlyExpenses),
    insuranceScore: calculateInsuranceScore(data.insurance, data.monthlyIncome * 12),
    debtScore: calculateDebtScore(data.emi, data.monthlyIncome),
    diversificationScore: calculateDiversificationScore(
      data.currentSavings,
      0, // fixedAssets - would need more data
      data.investments,
      data.currentSavings + data.investments
    ),
    taxScore: calculateTaxScore(data.investments, data.monthlyIncome),
    retirementScore: calculateRetirementScore(
      data.currentSavings + data.investments,
      data.monthlyIncome,
      data.monthlyExpenses,
      data.age
    ),
  };

  // Weighted average (all equal weight for now)
  const totalScore = Math.round(
    (breakdown.emergencyScore +
      breakdown.insuranceScore +
      breakdown.debtScore +
      breakdown.diversificationScore +
      breakdown.taxScore +
      breakdown.retirementScore) /
      6
  );

  let rating: "Critical" | "Poor" | "Fair" | "Good" | "Excellent";
  if (totalScore >= 80) rating = "Excellent";
  else if (totalScore >= 60) rating = "Good";
  else if (totalScore >= 40) rating = "Fair";
  else if (totalScore >= 20) rating = "Poor";
  else rating = "Critical";

  const insights = generateInsights(data, breakdown);

  return {
    totalScore,
    breakdown,
    insights,
    rating,
  };
}
