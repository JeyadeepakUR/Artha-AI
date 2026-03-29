/**
 * FIRE Plan Engine
 * Calculates retirement plans and required SIP amounts
 */

export interface FirePlanResult {
  monthlySIP: number;
  retirementAge: number;
  retirementCorpus: number;
  projections: Projection[];
  allocation: AssetAllocation;
  insights: string[];
}

export interface Projection {
  age: number;
  corpus: number;
  sipTotal: number;
  annualIncome: number;
  annualExpenses: number;
}

export interface AssetAllocation {
  equity: number;
  debt: number;
  gold: number;
  cash: number;
}

interface UserData {
  age: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  investments: number;
  riskProfile: string;
}

/**
 * Get asset allocation based on risk profile
 */
function getAllocationByRiskProfile(age: number, riskProfile: string): AssetAllocation {
  void age;
  
  // Conservative allocation
  if (riskProfile === "conservative") {
    return {
      equity: 30,
      debt: 50,
      gold: 10,
      cash: 10,
    };
  }
  
  // Moderate allocation (adjusts with age)
  if (riskProfile === "moderate") {
    const equityTarget = 60 - (Math.max(0, 60 - age) / 40) * 20; // Reduces as age increases
    return {
      equity: Math.round(equityTarget),
      debt: Math.round(50 - equityTarget / 2),
      gold: 10,
      cash: 10,
    };
  }
  
  // Aggressive allocation (more equity for younger people)
  if (riskProfile === "aggressive") {
    const equityTarget = Math.min(80, 50 + (Math.max(0, 60 - age) / 40) * 30);
    return {
      equity: Math.round(equityTarget),
      debt: Math.round(40 - equityTarget / 2),
      gold: 5,
      cash: 5,
    };
  }
  
  return { equity: 60, debt: 25, gold: 10, cash: 5 };
}

/**
 * Calculate required monthly SIP using future value formula
 * FV = PV(1+r)^n + PMT * [((1+r)^n - 1) / r]
 */
function calculateRequiredSIP(
  currentCorpus: number,
  targetCorpus: number,
  yearsToRetirement: number,
  annualReturn: number
): number {
  if (yearsToRetirement <= 0) return 0;
  
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const months = yearsToRetirement * 12;
  
  // Future value of current corpus
  const futurePV = currentCorpus * Math.pow(1 + monthlyReturn, months);
  
  // Remaining corpus needed through SIP
  const remaining = Math.max(0, targetCorpus - futurePV);
  
  // Future value annuity formula: PMT = FV / [((1+r)^n - 1) / r]
  if (monthlyReturn === 0) {
    return remaining / months;
  }
  
  const sip = remaining / (Math.pow(1 + monthlyReturn, months) - 1) * monthlyReturn;
  
  return Math.max(0, sip);
}

/**
 * Estimate returns based on allocation and risk profile
 */
function estimateAnnualReturn(allocation: AssetAllocation): number {
  // Historical averages for India (conservative estimates)
  const equityReturn = 0.12; // 12% - equity returns
  const debtReturn = 0.07; // 7% - debt returns
  const goldReturn = 0.06; // 6% - gold returns
  const cashReturn = 0.05; // 5% - cash/savings
  
  const blendedReturn =
    (allocation.equity / 100) * equityReturn +
    (allocation.debt / 100) * debtReturn +
    (allocation.gold / 100) * goldReturn +
    (allocation.cash / 100) * cashReturn;
  
  return blendedReturn;
}

/**
 * Generate projections year by year
 */
function generateProjections(
  startAge: number,
  currentCorpus: number,
  monthlySIP: number,
  annualReturn: number,
  monthlyExpenses: number,
  monthlyIncome: number
): Projection[] {
  const projections: Projection[] = [];
  const monthlyReturn = Math.pow(1 + annualReturn, 1 / 12) - 1;
  const inflationRate = 0.06;
  
  let corpus = currentCorpus;
  const age = startAge;
  let salary = monthlyIncome;
  let expenses = monthlyExpenses;
  
  for (let year = 0; year <= 30; year++) {
    // Add 12 months of SIP
    for (let month = 0; month < 12; month++) {
      corpus = corpus * (1 + monthlyReturn) + monthlySIP;
    }
    
    // Inflation adj expenses
    expenses = expenses * Math.pow(1 + inflationRate, year);
    salary = salary * Math.pow(1 + inflationRate, year / 2); // Conservative salary growth
    
    projections.push({
      age: age + year,
      corpus: Math.round(corpus),
      sipTotal: Math.round(monthlySIP * 12 * (year + 1)),
      annualIncome: Math.round(salary * 12),
      annualExpenses: Math.round(expenses * 12),
    });
  }
  
  return projections;
}

/**
 * Calculate FIRE plan
 */
export function calculateFirePlan(data: UserData): FirePlanResult {
  const currentAge = data.age;
  const retirementAge = 60;
  const yearsToRetirement = Math.max(1, retirementAge - currentAge);
  
  // Calculate annual expenses (current + inflation)
  const annualExpenses = data.monthlyExpenses * 12;
  
  // Retirement corpus needed: 25x annual expenses (Safe Withdrawal Rate = 4%)
  const inflationRate = 0.06;
  const inflationAdjustedExpenses = annualExpenses * Math.pow(1 + inflationRate, yearsToRetirement);
  const retirementCorpus = inflationAdjustedExpenses * 25;
  
  // Get allocation based on risk profile
  const allocation = getAllocationByRiskProfile(currentAge, data.riskProfile);
  
  // Estimate annual return based on allocation
  const annualReturn = estimateAnnualReturn(allocation);
  
  // Current total investable assets
  const currentCorpus = data.currentSavings + data.investments;
  
  // Calculate required monthly SIP
  const monthlySIP = calculateRequiredSIP(currentCorpus, retirementCorpus, yearsToRetirement, annualReturn);
  
  // Generate year-by-year projections
  const projections = generateProjections(
    currentAge,
    currentCorpus,
    monthlySIP,
    annualReturn,
    data.monthlyExpenses,
    data.monthlyIncome
  );
  
  // Generate insights
  const insights: string[] = [];
  
  if (monthlySIP > data.monthlyIncome * 0.5) {
    insights.push(
      `Required SIP (₹${Math.round(monthlySIP)}/mo) is >50% of income. Consider extending retirement age.`
    );
  } else if (monthlySIP > data.monthlyIncome * 0.3) {
    insights.push(`To retire at 60, invest ₹${Math.round(monthlySIP)}/month (${Math.round((monthlySIP / data.monthlyIncome) * 100)}% of salary)`);
  } else {
    insights.push(`Your target SIP: ₹${Math.round(monthlySIP)}/month is achievable`);
  }
  
  // Check if current savings trajectory is on track
  const currentSavingsRate = (data.monthlyIncome - data.monthlyExpenses) / data.monthlyIncome;
  if (currentSavingsRate < 0.15) {
    insights.push(`Increase savings rate to 15-20% for sustainable retirement planning`);
  }
  
  // Asset allocation insight
  insights.push(
    `Recommended allocation: ${allocation.equity}% Equity, ${allocation.debt}% Debt, ${allocation.gold}% Gold, ${allocation.cash}% Cash`
  );
  
  // Tax-advantaged insight
  insights.push(`Use Section 80C (₹1.5L), NPS (₹2L), ELSS for tax-efficient investing`);
  
  return {
    monthlySIP: Math.round(monthlySIP),
    retirementAge,
    retirementCorpus: Math.round(retirementCorpus),
    projections,
    allocation,
    insights: insights.slice(0, 4),
  };
}

/**
 * Check if user is on track for retirement
 */
export function checkRetirementReadiness(data: UserData): {
  onTrack: boolean;
  message: string;
  yearsToFreedom: number;
} {
  const plan = calculateFirePlan(data);
  
  const currentMonthlyCapacity = data.monthlyIncome - data.monthlyExpenses;
  const onTrack = currentMonthlyCapacity >= plan.monthlySIP;
  
  // Calculate when they can actually retire based on current savings
  const yearsToAccumulate = calculateYearsToAccumulate(
    data.currentSavings + data.investments,
    plan.retirementCorpus,
    currentMonthlyCapacity * 12,
    0.09 // Conservative 9% blended return
  );
  
  return {
    onTrack,
    message: onTrack
      ? `You're on track to retire at ${plan.retirementAge}`
      : `Need ₹${Math.round(plan.monthlySIP - currentMonthlyCapacity)}/month more`,
    yearsToFreedom: Math.max(0, yearsToAccumulate),
  };
}

/**
 * Helper: Calculate years needed to reach target corpus
 */
function calculateYearsToAccumulate(
  currentCorpus: number,
  targetCorpus: number,
  annualContribution: number,
  annualReturn: number
): number {
  let corpus = currentCorpus;
  let years = 0;
  
  while (corpus < targetCorpus && years < 100) {
    corpus = corpus * (1 + annualReturn) + annualContribution;
    years++;
  }
  
  return years;
}
