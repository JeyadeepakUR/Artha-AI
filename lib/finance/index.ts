// Export all finance calculation utilities
export { calculateHealthScore, type HealthScoreResult, type ScoringBreakdown } from "./healthScore";
export { calculateFirePlan, checkRetirementReadiness, type FirePlanResult, type Projection, type AssetAllocation } from "./firePlan";
export {
  simulateScenario,
  runMultipleScenarios,
  getImpactfulScenarios,
  createCustomScenario,
  AVAILABLE_SCENARIOS,
  type Scenario,
  type ScenarioModification,
  type ScenarioResult,
} from "./scenarios";
export {
  generateInsights,
  formatInsight,
  type Insight,
  type InsightType,
  type InsightCategory,
} from "./insights";
