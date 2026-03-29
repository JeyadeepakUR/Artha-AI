'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout, TopBar } from '@/components/Layout';
import { useAppStore } from '@/lib/store';
import { AVAILABLE_SCENARIOS, simulateScenario, type Scenario, type ScenarioResult } from '@/lib/finance';
import { calculateFirePlan, calculateHealthScore } from '@/lib/finance';
import {
  Loader2,
  LineChart,
  TrendingUp,
  Gift,
  House,
  Baby,
  Briefcase,
  TrendingDown,
  Cross,
  Sparkles,
  LucideIcon,
  X,
} from 'lucide-react';

type ApplyTarget = 'save-scenario' | 'apply-profile';

const scenarioIconMap: Record<string, LucideIcon> = {
  trending_up: TrendingUp,
  gift: Gift,
  home: House,
  child_care: Baby,
  work_off: Briefcase,
  trending_down: TrendingDown,
  local_hospital: Cross,
  auto_awesome: Sparkles,
  settings: LineChart,
};

export default function SimulateScreen() {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const authUser = useAppStore((state) => state.authUser);
  const userProfile = useAppStore((state) => state.userProfile);
  const metrics = useAppStore((state) => state.metrics);
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const setMetrics = useAppStore((state) => state.setMetrics);
  const addScenarioHistory = useAppStore((state) => state.addScenarioHistory);
  const addProfileSnapshot = useAppStore((state) => state.addProfileSnapshot);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyTarget, setApplyTarget] = useState<ApplyTarget>('save-scenario');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!authUser) {
      router.replace('/auth/login?next=/simulate');
      return;
    }

    if (!userProfile) {
      router.replace('/onboarding');
    }
  }, [hasHydrated, authUser, userProfile, router]);

  const handleScenarioClick = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setApplyTarget('save-scenario');
    if (userProfile && metrics.firePlan) {
      const result = simulateScenario(
        {
          age: userProfile.age,
          monthlyIncome: userProfile.monthlyIncome,
          monthlyExpenses: userProfile.monthlyExpenses,
          currentSavings: userProfile.currentSavings,
          investments: userProfile.investments,
          emi: userProfile.emi,
          insurance: userProfile.insurance,
          riskProfile: userProfile.riskProfile,
        },
        scenario
      );
      setScenarioResult(result);
    }
  };

  const handleApplyScenario = async () => {
    if (!userProfile || !selectedScenario || !scenarioResult) {
      return;
    }

    setApplyLoading(true);
    setApplyError(null);
    setApplyMessage(null);

    try {
      const updatedProfile = {
        ...userProfile,
        monthlyIncome: scenarioResult.modifiedData.monthlyIncome,
        monthlyExpenses: scenarioResult.modifiedData.monthlyExpenses,
        currentSavings: scenarioResult.modifiedData.currentSavings,
        investments: scenarioResult.modifiedData.investments,
        emi: scenarioResult.modifiedData.emi,
      };

      addScenarioHistory({
        id: `scenario-${Date.now()}`,
        scenarioName: selectedScenario.name,
        baseline: {
          monthlyIncome: userProfile.monthlyIncome,
          monthlyExpenses: userProfile.monthlyExpenses,
          currentSavings: userProfile.currentSavings,
          investments: userProfile.investments,
          emi: userProfile.emi,
          retirementAge: scenarioResult.baseFirePlan.retirementAge,
          monthlySip: scenarioResult.baseFirePlan.monthlySIP,
        },
        projected: {
          monthlyIncome: updatedProfile.monthlyIncome,
          monthlyExpenses: updatedProfile.monthlyExpenses,
          currentSavings: updatedProfile.currentSavings,
          investments: updatedProfile.investments,
          emi: updatedProfile.emi,
          retirementAge: scenarioResult.modifiedFirePlan.retirementAge,
          monthlySip: scenarioResult.modifiedFirePlan.monthlySIP,
        },
        analysis: scenarioResult.analysis,
        appliedToProfile: applyTarget === 'apply-profile',
        createdAt: Date.now(),
      });

      if (applyTarget === 'save-scenario') {
        setApplyMessage(`Saved \"${selectedScenario.name}\" as a scenario plan. Your real profile was not changed.`);
        setShowApplyModal(false);
        return;
      }

      const healthScore = calculateHealthScore({
        age: updatedProfile.age,
        monthlyIncome: updatedProfile.monthlyIncome,
        monthlyExpenses: updatedProfile.monthlyExpenses,
        currentSavings: updatedProfile.currentSavings,
        investments: updatedProfile.investments,
        emi: updatedProfile.emi,
        insurance: updatedProfile.insurance,
        riskProfile: updatedProfile.riskProfile,
      });

      const firePlan = calculateFirePlan({
        age: updatedProfile.age,
        monthlyIncome: updatedProfile.monthlyIncome,
        monthlyExpenses: updatedProfile.monthlyExpenses,
        currentSavings: updatedProfile.currentSavings,
        investments: updatedProfile.investments,
        riskProfile: updatedProfile.riskProfile,
      });

      setUserProfile(updatedProfile);
      setMetrics({
        healthScore,
        firePlan,
        lastUpdated: Date.now(),
      });

      addProfileSnapshot({
        id: `snapshot-${Date.now()}`,
        source: 'simulation-apply',
        createdAt: Date.now(),
        profile: updatedProfile,
      });

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to persist scenario changes');
      }

      setApplyMessage(`Applied "${selectedScenario.name}" to your financial profile.`);
      setShowApplyModal(false);
    } catch (error) {
      console.error(error);
      setApplyError('Could not apply this scenario right now. Please try again.');
    } finally {
      setApplyLoading(false);
    }
  };

  const formatCurrency = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

  if (!hasHydrated || !userProfile || !metrics.firePlan) {
    return (
      <AppLayout>
        <TopBar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
      </AppLayout>
    );
  }

  const previewProfile = selectedScenario
    ? scenarioResult?.modifiedData || null
    : null;

  return (
    <AppLayout>
      <TopBar title="What-if Scenarios" />
      <main className="px-8 pb-24 max-w-6xl mx-auto w-full pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="grid grid-cols-2 gap-4">
            {AVAILABLE_SCENARIOS.map((scenario) => {
              const ScenarioIcon = scenarioIconMap[scenario.icon] || LineChart;
              return (
              <button
                key={scenario.name}
                onClick={() => handleScenarioClick(scenario)}
                className={`p-6 rounded-md text-left flex flex-col items-start transition-all ${
                  selectedScenario?.name === scenario.name
                    ? 'bg-primary-container/10 border-2 border-primary'
                    : 'bg-white border border-outline-variant/30 hover:bg-surface-container-low'
                }`}
              >
                <ScenarioIcon className="w-5 h-5 mb-4" />
                <span className="font-bold mb-1">{scenario.name}</span>
                <span className="text-xs text-on-surface-variant">{scenario.description}</span>
              </button>
              );
            })}
          </div>

          <div className="bg-white rounded-md p-8 border border-outline-variant/20 shadow-sm">
            {scenarioResult ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-bold text-xl text-primary">Scenario Impact</h2>
                  <span className="px-2 py-1 bg-primary-container text-xs font-bold rounded-md text-primary">
                    {scenarioResult.retirementAgeChange < 0 ? 'Better 🎉' : scenarioResult.retirementAgeChange > 0 ? 'Challenging 📊' : 'Neutral'}
                  </span>
                </div>

                <div className="space-y-6">
                  {scenarioResult.scenario.impacts.durationMonths && scenarioResult.estimatedCashBurn > 0 && (
                    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                      Temporary shock modeled for {scenarioResult.scenario.impacts.durationMonths} months. Estimated corpus drawdown:
                      <span className="ml-1 font-bold">{formatCurrency(scenarioResult.estimatedCashBurn)}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-md bg-primary/5 p-3">
                      <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Freedom Age Shift</p>
                      <p className="mt-1 text-lg font-bold text-primary">{scenarioResult.freedomAgeChange > 0 ? '+' : ''}{scenarioResult.freedomAgeChange} yrs</p>
                    </div>
                    <div className="rounded-md bg-primary/5 p-3">
                      <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">SIP Change</p>
                      <p className="mt-1 text-lg font-bold text-primary">{scenarioResult.sipChange > 0 ? '+' : ''}{formatCurrency(scenarioResult.sipChange)}</p>
                    </div>
                    <div className="rounded-md bg-primary/5 p-3">
                      <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Health Score</p>
                      <p className="mt-1 text-lg font-bold text-primary">{scenarioResult.healthScoreChange > 0 ? '+' : ''}{Math.round(scenarioResult.healthScoreChange)} pts</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Retirement Age</span>
                      <span className="font-bold text-primary">
                        {scenarioResult.modifiedFirePlan.retirementAge} Years
                        {scenarioResult.retirementAgeChange !== 0 && (
                          <span className={`text-xs ml-2 ${scenarioResult.retirementAgeChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({scenarioResult.retirementAgeChange > 0 ? '+' : ''}{scenarioResult.retirementAgeChange} years)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-3/4"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Monthly SIP</span>
                      <span className="font-bold text-primary">
                        ₹{(scenarioResult.modifiedFirePlan.monthlySIP / 1000).toFixed(0)}k
                        {scenarioResult.sipChange !== 0 && (
                          <span className={`text-xs ml-2 ${scenarioResult.sipChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({scenarioResult.sipChange > 0 ? '+' : ''}₹{(scenarioResult.sipChange / 1000).toFixed(0)}k)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/5 rounded-md border-l-4 border-primary">
                    <p className="text-sm text-on-surface">{scenarioResult.analysis}</p>
                  </div>

                  <div className="overflow-hidden rounded-md border border-outline-variant/30">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-container-low">
                        <tr>
                          <th className="px-3 py-2 text-left">Metric</th>
                          <th className="px-3 py-2 text-right">Current</th>
                          <th className="px-3 py-2 text-right">Scenario</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-outline-variant/20">
                          <td className="px-3 py-2">Monthly Income</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(userProfile.monthlyIncome)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(previewProfile?.monthlyIncome || userProfile.monthlyIncome)}</td>
                        </tr>
                        <tr className="border-t border-outline-variant/20">
                          <td className="px-3 py-2">Monthly Expenses</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(userProfile.monthlyExpenses)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(previewProfile?.monthlyExpenses || userProfile.monthlyExpenses)}</td>
                        </tr>
                        <tr className="border-t border-outline-variant/20">
                          <td className="px-3 py-2">Current Savings</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(userProfile.currentSavings)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(previewProfile?.currentSavings || userProfile.currentSavings)}</td>
                        </tr>
                        <tr className="border-t border-outline-variant/20">
                          <td className="px-3 py-2">Investments</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(userProfile.investments)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(previewProfile?.investments || userProfile.investments)}</td>
                        </tr>
                        <tr className="border-t border-outline-variant/20">
                          <td className="px-3 py-2">EMI</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(userProfile.emi)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(previewProfile?.emi || userProfile.emi)}</td>
                        </tr>
                        <tr className="border-t border-outline-variant/20">
                          <td className="px-3 py-2">Retirement Age</td>
                          <td className="px-3 py-2 text-right">{scenarioResult.baseFirePlan.retirementAge}</td>
                          <td className="px-3 py-2 text-right">{scenarioResult.modifiedFirePlan.retirementAge}</td>
                        </tr>
                        <tr className="border-t border-outline-variant/20">
                          <td className="px-3 py-2">Estimated Freedom Age</td>
                          <td className="px-3 py-2 text-right">{scenarioResult.baselineFreedomAge}</td>
                          <td className="px-3 py-2 text-right">{scenarioResult.modifiedFreedomAge}</td>
                        </tr>
                        <tr className="border-t border-outline-variant/20">
                          <td className="px-3 py-2">Monthly SIP</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(scenarioResult.baseFirePlan.monthlySIP)}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(scenarioResult.modifiedFirePlan.monthlySIP)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => setShowApplyModal(true)}
                    disabled={applyLoading}
                    className="w-full py-3 bg-primary text-white rounded-md font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {applyLoading ? 'Applying Scenario...' : 'Save / Apply Scenario'}
                  </button>

                  {applyMessage && <p className="text-sm text-green-700">{applyMessage}</p>}
                  {applyError && <p className="text-sm text-error">{applyError}</p>}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <LineChart className="w-10 h-10 text-on-surface-variant/30 mx-auto" />
                  <p className="text-on-surface-variant mt-2">Select a scenario to see the impact</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {showApplyModal && selectedScenario && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-md bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-primary">Apply Scenario</h3>
                <button onClick={() => setShowApplyModal(false)} className="text-on-surface-variant hover:text-on-surface">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-4 text-sm text-on-surface-variant">
                \"{selectedScenario.name}\" is currently a simulation preview. Choose how you want to proceed.
              </p>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-outline-variant/30 p-3">
                  <input
                    type="radio"
                    name="applyTarget"
                    checked={applyTarget === 'save-scenario'}
                    onChange={() => setApplyTarget('save-scenario')}
                  />
                  <div>
                    <p className="font-semibold">Save as Scenario Plan Only</p>
                    <p className="text-sm text-on-surface-variant">Keeps your real profile unchanged and saves this what-if for later review.</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border border-outline-variant/30 p-3">
                  <input
                    type="radio"
                    name="applyTarget"
                    checked={applyTarget === 'apply-profile'}
                    onChange={() => setApplyTarget('apply-profile')}
                    disabled={Boolean(selectedScenario.impacts.durationMonths)}
                  />
                  <div>
                    <p className="font-semibold">Apply to Real Profile</p>
                    <p className="text-sm text-on-surface-variant">
                      {selectedScenario.impacts.durationMonths
                        ? 'Disabled for temporary scenarios. Use Save-only and review impact in simulator.'
                        : 'Updates your live numbers, recalculates your plan, and reflects changes on dashboard and profile.'}
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-md border border-outline-variant/40 px-4 py-2 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyScenario}
                  disabled={applyLoading}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {applyLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
