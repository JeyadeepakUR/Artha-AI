/**
 * Insights & Alerts Engine
 * Generates financial nudges and actionable recommendations
 */

export type InsightType = "alert" | "warning" | "suggestion" | "tip";
export type InsightCategory = "spending" | "savings" | "investment" | "insurance" | "debt" | "tax" | "market";

export interface Insight {
  id: string;
  type: InsightType; // alert = critical, warning = important, suggestion = nice-to-have, tip = fyi
  category: InsightCategory;
  title: string;
  description: string;
  action?: string; // CTA button text
  actionType?: string; // adjust-budget, view-plan, etc
  severity: 1 | 2 | 3 | 4 | 5; // 5 = highest priority
}

interface UserData {
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
 * Generate spending alerts
 */
function generateSpendingAlerts(data: UserData): Insight[] {
  const insights: Insight[] = [];
  const savingsRate = (data.monthlyIncome - data.monthlyExpenses) / data.monthlyIncome;
  
  // Check if spending is too high
  if (savingsRate < 0.1) {
    insights.push({
      id: "low-savings-rate",
      type: "alert",
      category: "spending",
      title: "⚠️ Spending Alert",
      description: `Your spending is ${Math.round((1 - savingsRate) * 100)}% of income. Aim for <80% (savings >20%).`,
      action: "Adjust Budget",
      actionType: "adjust-budget",
      severity: 4,
    });
  }
  
  // High monthly emi
  if (data.emi > data.monthlyIncome * 0.3) {
    insights.push({
      id: "high-emi",
      type: "warning",
      category: "debt",
      title: "🚨 High EMI Burden",
      description: `EMI is ${Math.round((data.emi / data.monthlyIncome) * 100)}% of income (target: <30%).`,
      action: "View Options",
      actionType: "view-debt-options",
      severity: 4,
    });
  }
  
  return insights;
}

/**
 * Generate savings & emergency fund alerts
 */
function generateSavingsAlerts(data: UserData): Insight[] {
  const insights: Insight[] = [];
  const emergencyMonths = data.monthlyExpenses > 0 ? data.currentSavings / data.monthlyExpenses : 0;
  
  // Insufficient emergency fund
  if (emergencyMonths < 6) {
    const needed = data.monthlyExpenses * 6 - data.currentSavings;
    insights.push({
      id: "low-emergency-fund",
      type: "alert",
      category: "savings",
      title: "⚠️ Emergency Fund Short",
      description: `You have ${Math.round(emergencyMonths)} months of expenses saved. Ideal: 6-12 months. Short by ₹${Math.round(needed)}.`,
      action: "Build Fund",
      actionType: "build-emergency",
      severity: 5,
    });
  }
  
  // Good emergency fund
  if (emergencyMonths >= 12) {
    insights.push({
      id: "strong-emergency-fund",
      type: "tip",
      category: "savings",
      title: "✨ Strong Emergency Fund",
      description: `You have ${Math.round(emergencyMonths)} months covered. Consider redirecting excess to investments.`,
      action: "View Plan",
      actionType: "view-plan",
      severity: 1,
    });
  }
  
  return insights;
}

/**
 * Generate investment & diversification alerts
 */
function generateInvestmentAlerts(data: UserData): Insight[] {
  const insights: Insight[] = [];
  const annualIncome = data.monthlyIncome * 12;
  const investmentRatio = data.investments / annualIncome;
  
  // Low investment
  if (investmentRatio < 0.3) {
    insights.push({
      id: "low-investment",
      type: "suggestion",
      category: "investment",
      title: "💡 Increase Investments",
      description: `Investing only ${Math.round(investmentRatio * 100)}% of annual income. Target: 50%+.`,
      action: "Start SIP",
      actionType: "start-sip",
      severity: 3,
    });
  }
  
  // Good investment
  if (investmentRatio >= 0.5) {
    insights.push({
      id: "good-investment",
      type: "tip",
      category: "investment",
      title: "🎯 On Track",
      description: `You're investing ${Math.round(investmentRatio * 100)}% of annual income. Great commitment!`,
      severity: 1,
    });
  }
  
  return insights;
}

/**
 * Generate insurance & protection alerts
 */
function generateInsuranceAlerts(data: UserData): Insight[] {
  const insights: Insight[] = [];
  const annualIncome = data.monthlyIncome * 12;
  const coverageRatio = data.insurance / annualIncome;
  
  // Low insurance
  if (coverageRatio < 10) {
    const needed = annualIncome * 12 - data.insurance;
    insights.push({
      id: "low-insurance",
      type: "alert",
      category: "insurance",
      title: "🛡️ Insufficient Coverage",
      description: `Insurance is ${Math.round(coverageRatio)}x annual income. Recommended: 10-15x. Gap: ₹${Math.round(needed)}.`,
      action: "View Options",
      actionType: "view-insurance",
      severity: 4,
    });
  }
  
  // Adequate insurance
  if (coverageRatio >= 10 && coverageRatio <= 15) {
    insights.push({
      id: "adequate-insurance",
      type: "tip",
      category: "insurance",
      title: "✅ Adequate Coverage",
      description: `Insurance coverage is ${Math.round(coverageRatio)}x income. Well insured!`,
      severity: 1,
    });
  }
  
  return insights;
}

/**
 * Generate tax optimization alerts
 */
function generateTaxAlerts(data: UserData): Insight[] {
  const insights: Insight[] = [];
  const annualIncome = data.monthlyIncome * 12;
  
  // Check 80C utilization
  const section80CLimit = 150000;
  const taxSavingsInvestments = data.investments * 0.4; // Estimate 40% are tax-efficient
  
  if (taxSavingsInvestments < section80CLimit) {
    insights.push({
      id: "tax-80c-opportunity",
      type: "suggestion",
      category: "tax",
      title: "💰 Tax-Saving Opportunity",
      description: `You can invest up to ₹${section80CLimit} under Section 80C. Make the most of tax benefits!`,
      action: "Learn More",
      actionType: "view-tax-guide",
      severity: 2,
    });
  }
  
  // High income bracket
  if (annualIncome > 1500000) {
    insights.push({
      id: "tax-optimization",
      type: "suggestion",
      category: "tax",
      title: "📋 Tax Optimization",
      description: `Review your tax strategy. NPS, ELSS, health insurance can provide significant benefits.`,
      action: "View Strategy",
      actionType: "view-tax-strategy",
      severity: 2,
    });
  }
  
  return insights;
}

/**
 * Generate retirement & long-term planning alerts
 */
function generateRetirementAlerts(data: UserData, yearsToRetirement: number = 60 - data.age): Insight[] {
  const insights: Insight[] = [];
  const annualExpenses = data.monthlyExpenses * 12;
  const retirementCorpus = annualExpenses * 25;
  const inflationRate = 0.06;
  const futureCorpusNeeded = retirementCorpus * Math.pow(1 + inflationRate, yearsToRetirement);
  
  const currentAssets = data.currentSavings + data.investments;
  const corpusRatio = currentAssets / futureCorpusNeeded;
  
  // Check retirement readiness
  if (corpusRatio < 0.3) {
    insights.push({
      id: "low-retirement-savings",
      type: "alert",
      category: "savings",
      title: "⏰ Retirement Planning",
      description: `${yearsToRetirement} years to retirement. Accelerate savings to reach your ₹${Math.round(futureCorpusNeeded / 10000000)}Cr goal.`,
      action: "View Plan",
      actionType: "view-fire-plan",
      severity: 4,
    });
  }
  
  if (corpusRatio >= 0.5) {
    insights.push({
      id: "on-track-retirement",
      type: "tip",
      category: "savings",
      title: "🎉 Retirement On Track",
      description: `You are ${Math.round(corpusRatio * 100)}% towards your retirement goal!`,
      severity: 1,
    });
  }
  
  return insights;
}

/**
 * Generate market-related insights & tips
 */
function generateMarketInsights(): Insight[] {
  const insights: Insight[] = [];
  
  // Market tip (would be enhanced with real market data)
  insights.push({
    id: "market-tip-rebalancing",
    type: "tip",
    category: "market",
    title: "📈 Market Insight",
    description: `Markets have rallied. Consider rebalancing your portfolio to maintain target allocation.`,
    action: "Check Portfolio",
    actionType: "check-portfolio",
    severity: 2,
  });
  
  return insights;
}

/**
 * Generate comprehensive insights for user
 */
export function generateInsights(data: UserData): Insight[] {
  const allInsights: Insight[] = [
    ...generateSpendingAlerts(data),
    ...generateSavingsAlerts(data),
    ...generateInvestmentAlerts(data),
    ...generateInsuranceAlerts(data),
    ...generateTaxAlerts(data),
    ...generateRetirementAlerts(data),
    ...generateMarketInsights(),
  ];
  
  // Sort by severity (highest first) and remove duplicates
  return allInsights
    .sort((a, b) => b.severity - a.severity)
    .reduce<Insight[]>((unique, insight) => {
      return unique.find((i) => i.category === insight.category) ? unique : [...unique, insight];
    }, [])
    .slice(0, 6); // Return top 6 insights
}

/**
 * Format insight for display
 */
export function formatInsight(insight: Insight): {
  color: string;
  icon: string;
  typeLabel: string;
} {
  const typeConfig = {
    alert: { color: "text-red-600", icon: "warning", typeLabel: "CRITICAL" },
    warning: { color: "text-amber-600", icon: "priority_high", typeLabel: "WARNING" },
    suggestion: { color: "text-blue-600", icon: "lightbulb", typeLabel: "SUGGESTION" },
    tip: { color: "text-green-600", icon: "info", typeLabel: "TIP" },
  };
  
  return typeConfig[insight.type];
}
