'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout, TopBar } from '@/components/Layout';
import { useAppStore } from '@/lib/store';
import { generateInsights } from '@/lib/finance';
import { AlertTriangle, Siren, Lightbulb, Info, LucideIcon, Loader2 } from 'lucide-react';

type InsightInput = {
  age: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  investments: number;
  emi: number;
  insurance: number;
  riskProfile: string;
};

const insightTypeIconMap: Record<string, LucideIcon> = {
  alert: AlertTriangle,
  warning: Siren,
  suggestion: Lightbulb,
  tip: Info,
};

export default function InsightsScreen() {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const authUser = useAppStore((state) => state.authUser);
  const userProfile = useAppStore((state) => state.userProfile);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!authUser) {
      router.replace('/auth/login?next=/insights');
      return;
    }

    if (!userProfile) {
      router.replace('/onboarding');
    }
  }, [hasHydrated, authUser, userProfile, router]);

  if (!hasHydrated || !userProfile) {
    return (
      <AppLayout>
        <TopBar title="Alerts & Nudges" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
      </AppLayout>
    );
  }

  const insightInput: InsightInput = {
    age: userProfile.age,
    monthlyIncome: userProfile.monthlyIncome,
    monthlyExpenses: userProfile.monthlyExpenses,
    currentSavings: userProfile.currentSavings,
    investments: userProfile.investments,
    emi: userProfile.emi,
    insurance: userProfile.insurance,
    riskProfile: userProfile.riskProfile,
  };

  const insights = generateInsights(insightInput);

  return (
    <AppLayout>
      <TopBar title="Alerts & Nudges" />
      <main className="px-8 pb-24 max-w-3xl mx-auto w-full pt-8">
        <div className="space-y-6">
          {insights.map((insight) => {
            const InsightIcon = insightTypeIconMap[insight.type] || Info;
            return (
            <div
              key={insight.id}
              className={`bg-white rounded-md p-6 border-l-4 shadow-sm ${
                insight.type === 'alert'
                  ? 'border-error'
                  : insight.type === 'warning'
                  ? 'border-amber-500'
                  : insight.type === 'suggestion'
                  ? 'border-blue-500'
                  : 'border-secondary'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    insight.type === 'alert'
                      ? 'bg-error-container'
                      : insight.type === 'warning'
                      ? 'bg-amber-100'
                      : insight.type === 'suggestion'
                      ? 'bg-blue-100'
                      : 'bg-secondary-container/30'
                  }`}
                >
                  <InsightIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">{insight.category}</span>
                  <h3 className="font-bold text-lg mt-1">{insight.title}</h3>
                  <p className="text-sm text-on-surface-variant mt-2">{insight.description}</p>
                  {insight.action && (
                    <div className="mt-4">
                      <button className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-md">{insight.action}</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </main>
    </AppLayout>
  );
}
