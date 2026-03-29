'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout, TopBar } from '@/components/Layout';
import { useAppStore } from '@/lib/store';
import { Loader2, ArrowRight } from 'lucide-react';

type DashboardSummary = {
  summary: {
    summary: string;
    opportunities: string[];
    risks: string[];
    forecastNarrative: string;
  };
  projections: {
    projected3Years: number;
    projected5Years: number;
  };
  metrics: {
    savingsRate: number;
    emergencyMonths: number;
    debtToIncomePct: number;
  };
};

export default function DashboardScreen() {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const authUser = useAppStore((state) => state.authUser);
  const userProfile = useAppStore((state) => state.userProfile);
  const metrics = useAppStore((state) => state.metrics);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!authUser) {
      router.replace('/auth/login?next=/dashboard');
      return;
    }

    if (!userProfile) {
      router.replace('/onboarding');
    }
  }, [hasHydrated, authUser, userProfile, router]);

  useEffect(() => {
    const loadSummary = async () => {
      if (!hasHydrated || !authUser || !userProfile) {
        return;
      }

      setSummaryLoading(true);
      try {
        const response = await fetch('/api/insights/summary', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { success?: boolean } & DashboardSummary;
        if (data.success) {
          setSummary(data);
        }
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSummary();
  }, [hasHydrated, authUser, userProfile]);

  if (!hasHydrated || !userProfile || !metrics.healthScore) {
    return (
      <AppLayout>
        <TopBar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
      </AppLayout>
    );
  }

  const score = metrics.healthScore.totalScore;
  const circumference = 691;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const savingsRate =
    userProfile.monthlyIncome > 0
      ? Math.round(((userProfile.monthlyIncome - userProfile.monthlyExpenses) / userProfile.monthlyIncome) * 100)
      : 0;
  const emergencyMonths =
    userProfile.monthlyExpenses > 0
      ? Number((userProfile.currentSavings / userProfile.monthlyExpenses).toFixed(1))
      : 0;
  const debtToIncome =
    userProfile.monthlyIncome > 0 ? Math.round((userProfile.emi / userProfile.monthlyIncome) * 100) : 0;

  return (
    <AppLayout>
      <TopBar subtitle={`Good morning, ${userProfile.name}`} title="Overview" />
      <main className="px-8 pb-24 max-w-6xl mx-auto space-y-12 w-full">
        <section className="flex flex-col items-center justify-center space-y-6 pt-8">
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle className="text-surface-container" cx="128" cy="128" fill="transparent" r="110" strokeWidth="12" stroke="currentColor"></circle>
              <circle
                className="text-primary transition-all"
                cx="128"
                cy="128"
                fill="transparent"
                r="110"
                strokeWidth="12"
                stroke="currentColor"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              ></circle>
            </svg>
            <div className="text-center">
              <span className="block text-5xl font-extrabold font-headline text-primary">
                {score}
                <span className="text-2xl text-on-surface-variant/50">/100</span>
              </span>
              <span className="block text-sm font-semibold tracking-wide text-on-surface-variant uppercase mt-1">Health Score</span>
            </div>
          </div>

          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold font-headline text-primary">{metrics.healthScore.rating}</h1>
            <p className="text-on-surface-variant mt-2">
              {metrics.healthScore.insights[0] || 'Your financial health is good'}
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.healthScore.insights.map((insight, i) => (
            <div key={i} className="bg-primary/5 p-6 rounded-md border-l-4 border-primary">
              <p className="text-sm text-on-surface-variant">{insight}</p>
            </div>
          ))}

          <div
            onClick={() => router.push('/plan')}
            className="bg-primary p-6 rounded-md text-white flex flex-col justify-center items-center text-center cursor-pointer hover:bg-primary/90 transition-colors"
          >
            <h4 className="font-bold mb-2">Ready to optimize?</h4>
            <span className="text-sm flex items-center gap-1 text-secondary-fixed">
              View Plan
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6">
          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Monthly Income</span>
            <div className="text-2xl font-bold text-primary mt-2">₹{(userProfile.monthlyIncome / 1000).toFixed(0)}k</div>
          </div>
          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Savings</span>
            <div className="text-2xl font-bold text-secondary mt-2">₹{(userProfile.currentSavings / 100000).toFixed(1)}L</div>
          </div>
          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">SIP Target</span>
            <div className="text-2xl font-bold text-primary mt-2">₹{(metrics.firePlan?.monthlySIP || 0) / 1000}k/mo</div>
          </div>
          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Savings Rate</span>
            <div className="text-2xl font-bold text-primary mt-2">{summary?.metrics.savingsRate ?? savingsRate}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <h3 className="font-bold text-lg text-primary mb-4">Personalized Risk Snapshot</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Emergency</p>
                <p className="text-xl font-bold text-primary mt-1">{summary?.metrics.emergencyMonths ?? emergencyMonths} mo</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Debt Ratio</p>
                <p className="text-xl font-bold text-primary mt-1">{summary?.metrics.debtToIncomePct ?? debtToIncome}%</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Risk Mode</p>
                <p className="text-xl font-bold text-primary mt-1 capitalize">{userProfile.riskProfile}</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant mt-5">
              {summary?.summary.summary || 'Building your personalized strategy from your latest profile data.'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <h3 className="font-bold text-lg text-primary mb-4">AI Forecast (OpenRouter)</h3>
            {summaryLoading ? (
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <Loader2 className="w-4 h-4 animate-spin" />
                Refreshing projections...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-primary/5 rounded-md p-3">
                    <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">3Y Potential</p>
                    <p className="text-lg font-bold text-primary mt-1">₹{((summary?.projections.projected3Years || 0) / 100000).toFixed(1)}L</p>
                  </div>
                  <div className="bg-primary/5 rounded-md p-3">
                    <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">5Y Potential</p>
                    <p className="text-lg font-bold text-primary mt-1">₹{((summary?.projections.projected5Years || 0) / 100000).toFixed(1)}L</p>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant">{summary?.summary.forecastNarrative || 'Forecast unavailable. Update your profile to unlock predictions.'}</p>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <h3 className="font-bold text-lg text-primary mb-3">Top Opportunities</h3>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              {(summary?.summary.opportunities || []).slice(0, 3).map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
              {!summary?.summary.opportunities?.length && <li>• Add or refresh profile data to generate opportunities.</li>}
            </ul>
          </div>
          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <h3 className="font-bold text-lg text-primary mb-3">Watchouts</h3>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              {(summary?.summary.risks || []).slice(0, 3).map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
              {!summary?.summary.risks?.length && <li>• Risks will appear as soon as forecast context is ready.</li>}
            </ul>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
