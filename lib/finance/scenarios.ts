/**
 * Scenario Simulator
 * Modulates financial scenarios and recalculates plans
 */

import { calculateFirePlan, FirePlanResult } from "./firePlan";
import { calculateHealthScore } from "./healthScore";

export interface Scenario {
  name: string;
  description: string;
  icon: string;
  impacts: ScenarioModification;
}

export interface ScenarioModification {
  monthlyIncomeMultiplier?: number;
  monthlyIncomeAdd?: number;
  monthlyExpensesAdd?: number;
  savingsAdd?: number;
  investmentsAdd?: number;
  emiAdd?: number;
  durationMonths?: number; // For temporary scenarios like job loss
  description?: string;
}

export interface ScenarioResult {
  scenario: Scenario;
  baselineData: UserData;
  modifiedData: UserData;
  baseFirePlan: FirePlanResult;
  modifiedFirePlan: FirePlanResult;
  baselineFreedomAge: number;
  modifiedFreedomAge: number;
  freedomAgeChange: number;
  healthScoreChange: number;
  retirementAgeChange: number;
  sipChange: number;
  estimatedCashBurn: number;
  analysis: string;
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

function estimateFinancialFreedomAge(data: UserData, targetCorpus: number): number {
  const annualContribution = Math.max(0, (data.monthlyIncome - data.monthlyExpenses - data.emi) * 12);
  let corpus = Math.max(0, data.currentSavings + data.investments);
  let years = 0;
  const annualReturn = 0.09;

  while (corpus < targetCorpus && years < 45) {
    corpus = corpus * (1 + annualReturn) + annualContribution;
    years += 1;
  }

  return data.age + years;
}

/**
 * Available scenarios
 */
export const AVAILABLE_SCENARIOS: Scenario[] = [
  {
    name: "Salary Increase",
    description: "Model a 15-30% salary increase",
    icon: "trending_up",
    impacts: {
      monthlyIncomeMultiplier: 1.25, // 25% increase default
    },
  },
  {
    name: "Bonus Windfall",
    description: "Apply annual bonus to savings",
    icon: "gift",
    impacts: {
      savingsAdd: 300000, // ₹3L bonus
    },
  },
  {
    name: "Buy a House",
    description: "Evaluate impact of home purchase and EMI",
    icon: "home",
    impacts: {
      emiAdd: 35000,
      monthlyExpensesAdd: 12000,
    },
  },
  {
    name: "New Baby",
    description: "Plan for additional family expenses",
    icon: "child_care",
    impacts: {
      monthlyExpensesAdd: 15000,
    },
  },
  {
    name: "Career Break",
    description: "Temporary 12-month loss of income",
    icon: "work_off",
    impacts: {
      monthlyIncomeMultiplier: 0,
      durationMonths: 12,
    },
  },
  {
    name: "Job Loss",
    description: "Extended 6-month jobless period (stress test)",
    icon: "trending_down",
    impacts: {
      monthlyIncomeMultiplier: 0,
      durationMonths: 6,
    },
  },
  {
    name: "Medical Emergency",
    description: "Unexpected ₹5L medical expense",
    icon: "local_hospital",
    impacts: {
      savingsAdd: -500000, // Deduct from savings
      monthlyExpensesAdd: 10000, // Recovery costs
    },
  },
  {
    name: "Investment Growth",
    description: "Strong market rally boosts portfolio",
    icon: "auto_awesome",
    impacts: {
      investmentsAdd: 300000,
    },
  },
];

/**
 * Apply scenario modifications to user data
 */
function applyScenarioModifications(data: UserData, modifications: ScenarioModification): UserData {
  const modifiedData = { ...data };
  
  if (modifications.monthlyIncomeMultiplier !== undefined) {
    modifiedData.monthlyIncome = data.monthlyIncome * modifications.monthlyIncomeMultiplier;
  }
  
  if (modifications.monthlyIncomeAdd !== undefined) {
    modifiedData.monthlyIncome += modifications.monthlyIncomeAdd;
  }
  
  if (modifications.monthlyExpensesAdd !== undefined) {
    modifiedData.monthlyExpenses += modifications.monthlyExpensesAdd;
  }
  
  if (modifications.savingsAdd !== undefined) {
    modifiedData.currentSavings += modifications.savingsAdd;
  }
  
  if (modifications.investmentsAdd !== undefined) {
    modifiedData.investments += modifications.investmentsAdd;
  }
  
  if (modifications.emiAdd !== undefined) {
    modifiedData.emi += modifications.emiAdd;
  }

  // Temporary scenarios (job loss/career break) are modeled as a liquidity drawdown,
  // while long-term income returns to normal after the duration period.
  if (modifications.durationMonths && modifications.durationMonths > 0) {
    const tempIncome = modifiedData.monthlyIncome;
    const longTermIncome = Math.max(0, data.monthlyIncome + (modifications.monthlyIncomeAdd || 0));
    const tempNetCashflow = tempIncome - modifiedData.monthlyExpenses - modifiedData.emi;
    const requiredBurn = Math.max(0, -tempNetCashflow * modifications.durationMonths);

    let burnRemaining = requiredBurn;
    const fromSavings = Math.min(modifiedData.currentSavings, burnRemaining);
    modifiedData.currentSavings -= fromSavings;
    burnRemaining -= fromSavings;

    if (burnRemaining > 0) {
      const fromInvestments = Math.min(modifiedData.investments, burnRemaining);
      modifiedData.investments -= fromInvestments;
    }

    modifiedData.monthlyIncome = longTermIncome;
  }
  
  return modifiedData;
}

/**
 * Simulate a scenario and compare with baseline
 */
export function simulateScenario(
  userData: UserData,
  scenario: Scenario
): ScenarioResult {
  // Calculate baseline
  const basePlan = calculateFirePlan(userData);
  const baseHealth = calculateHealthScore(userData);
  
  // Apply scenario modifications
  const modifiedData = applyScenarioModifications(userData, scenario.impacts);
  
  // Calculate modified plan
  const modifiedPlan = calculateFirePlan(modifiedData);
  const modifiedHealth = calculateHealthScore(modifiedData);
  const baselineFreedomAge = estimateFinancialFreedomAge(userData, basePlan.retirementCorpus);
  const modifiedFreedomAge = estimateFinancialFreedomAge(modifiedData, modifiedPlan.retirementCorpus);
  const freedomAgeChange = modifiedFreedomAge - baselineFreedomAge;
  
  // Calculate changes
  const retirementAgeChange = modifiedPlan.retirementAge - basePlan.retirementAge;
  const sipChange = modifiedPlan.monthlySIP - basePlan.monthlySIP;
  const healthScoreChange = modifiedHealth.totalScore - baseHealth.totalScore;
  const estimatedCashBurn = Math.max(
    0,
    (userData.currentSavings + userData.investments) -
      (modifiedData.currentSavings + modifiedData.investments)
  );
  
  // Generate analysis
  let analysis = "";
  
  if (scenario.impacts.durationMonths) {
    analysis = `During a ${scenario.impacts.durationMonths}-month temporary shock, estimated cash burn is ₹${Math.round(estimatedCashBurn).toLocaleString("en-IN")}. `;
  }

  if (freedomAgeChange > 0) {
    analysis += `Estimated financial freedom age shifts later by ${freedomAgeChange} years. `;
  } else if (freedomAgeChange < 0) {
    analysis += `Estimated financial freedom age improves by ${Math.abs(freedomAgeChange)} years. `;
  }
  
  if (retirementAgeChange > 0) {
    analysis += `Retirement delayed by ${retirementAgeChange} years. `;
  } else if (retirementAgeChange < 0) {
    analysis += `Retirement accelerated by ${Math.abs(retirementAgeChange)} years. `;
  } else {
    analysis += `Retirement age remains unchanged. `;
  }
  
  if (sipChange > 0) {
    analysis += `SIP increased from ₹${Math.round(basePlan.monthlySIP)} to ₹${Math.round(modifiedPlan.monthlySIP)}/month.`;
  } else if (sipChange < 0) {
    analysis += `SIP reduced from ₹${Math.round(basePlan.monthlySIP)} to ₹${Math.round(modifiedPlan.monthlySIP)}/month.`;
  }
  
  if (healthScoreChange < 0) {
    analysis += ` Financial health worsens by ${Math.abs(Math.round(healthScoreChange))} points.`;
  } else if (healthScoreChange > 0) {
    analysis += ` Financial health improves by ${Math.round(healthScoreChange)} points.`;
  }
  
  return {
    scenario,
    baselineData: userData,
    modifiedData,
    baseFirePlan: basePlan,
    modifiedFirePlan: modifiedPlan,
    baselineFreedomAge,
    modifiedFreedomAge,
    freedomAgeChange,
    healthScoreChange,
    retirementAgeChange,
    sipChange,
    estimatedCashBurn,
    analysis,
  };
}

/**
 * Run multiple scenarios and rank them by impact
 */
export function runMultipleScenarios(
  userData: UserData,
  scenarios: Scenario[] = AVAILABLE_SCENARIOS
): ScenarioResult[] {
  return scenarios
    .map((scenario) => simulateScenario(userData, scenario))
    .sort((a, b) => {
      // Sort by positive impact on retirement age (earlier is better)
      return a.retirementAgeChange - b.retirementAgeChange;
    });
}

/**
 * Find most impactful scenarios (positive or negative)
 */
export function getImpactfulScenarios(
  userData: UserData,
  limit: number = 3
): { positive: ScenarioResult[]; negative: ScenarioResult[] } {
  const results = runMultipleScenarios(userData);
  
  const positive = results
    .filter((r) => r.retirementAgeChange < 0) // Negative change = earlier retirement
    .slice(0, limit);
  
  const negative = results
    .filter((r) => r.retirementAgeChange > 0) // Positive change = delayed retirement
    .reverse()
    .slice(0, limit);
  
  return { positive, negative };
}

/**
 * Get custom scenario
 */
export function createCustomScenario(
  name: string,
  modifications: ScenarioModification,
  description?: string
): Scenario {
  return {
    name,
    description: description || "Custom scenario",
    icon: "settings",
    impacts: modifications,
  };
}
