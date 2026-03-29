'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout, TopBar } from '@/components/Layout';
import { useAppStore } from '@/lib/store';
import type { AssetAllocation } from '@/lib/finance';
import { Loader2, Sparkles } from 'lucide-react';

export default function PlanScreen() {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const authUser = useAppStore((state) => state.authUser);
  const userProfile = useAppStore((state) => state.userProfile);
  const metrics = useAppStore((state) => state.metrics);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!authUser) {
      router.replace('/auth/login?next=/plan');
      return;
    }

    if (!userProfile) {
      router.replace('/onboarding');
    }
  }, [hasHydrated, authUser, userProfile, router]);

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

  const plan = metrics.firePlan;
  const projectionPoints = plan.projections.slice(0, 10);
  const maxCorpus = Math.max(1, ...projectionPoints.map((p) => p.corpus));

  return (
    <AppLayout>
      <TopBar title="Financial Plan" />
      <main className="px-8 pb-24 max-w-5xl mx-auto w-full pt-8">
        <section className="mb-8">
          <h1 className="text-3xl font-extrabold font-headline text-primary">Your Path to Freedom</h1>
          <p className="text-on-surface-variant">Blueprint to accelerate independence.</p>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-md p-8 shadow-sm border border-outline-variant/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-xl text-primary">Retirement Projection</h2>
              <span className="text-xs bg-secondary/10 text-secondary px-3 py-1 rounded-full">
                30-year horizon
              </span>
            </div>
            
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="bg-surface-container p-3 rounded-md">
                <span className="text-xs text-on-surface-variant uppercase tracking-wide">Current Corpus</span>
                <p className="font-bold text-lg text-primary">₹{(projectionPoints[0].corpus / 100000).toFixed(1)}L</p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-md">
                <span className="text-xs text-secondary uppercase tracking-wide">Target Corpus @ {plan.retirementAge}</span>
                <p className="font-bold text-lg text-secondary">₹{(plan.retirementCorpus / 10000000).toFixed(1)}Cr</p>
              </div>
            </div>

            <div className="relative">
              <div className="flex items-end gap-1.5 h-56 border-b-2 border-l-2 border-outline-variant/30 pb-3 pl-3">
                {projectionPoints.map((proj, i) => {
                  const heightPercent = (proj.corpus / maxCorpus) * 100;
                  const isRetirementAge = proj.age === plan.retirementAge;
                  
                  return (
                    <div key={i} className="flex-1 h-full flex flex-col items-center justify-end group relative">
                      {/* Retirement age marker */}
                      {isRetirementAge && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                          <div className="w-0.5 h-3 bg-error mb-1"></div>
                          <span className="text-xs font-bold text-error whitespace-nowrap">Retirement</span>
                        </div>
                      )}
                      
                      {/* Bar */}
                      <div
                        className={`w-full rounded-t-md transition-all cursor-pointer ${
                          isRetirementAge
                            ? 'bg-secondary hover:bg-secondary/80'
                            : 'bg-primary/20 hover:bg-primary/40'
                        }`}
                        style={{ height: `${Math.max(6, heightPercent)}%` }}
                      ></div>
                      
                      {/* Age label */}
                      <span className="text-xs font-semibold mt-2 text-on-surface-variant group-hover:text-primary">
                        {proj.age}
                      </span>
                      
                      {/* Hover tooltip */}
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-surface-container text-on-surface text-xs rounded-md p-2 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-md border border-outline-variant/20">
                        <p className="font-bold">₹{(proj.corpus / 100000).toFixed(1)}L</p>
                        <p className="text-on-surface-variant">Age {proj.age}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs text-on-surface-variant uppercase tracking-wide">Start</span>
                <p className="font-bold text-primary">Age {projectionPoints[0].age}</p>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant uppercase tracking-wide">Monthly SIP</span>
                <p className="font-bold text-primary">₹{(plan.monthlySIP / 1000).toFixed(0)}k</p>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant uppercase tracking-wide">Assumed Return</span>
                <p className="font-bold text-primary">9-12%<span className="text-xs font-normal">/yr</span></p>
              </div>
            </div>
          </div>

          <div className="bg-primary text-white rounded-md p-8 flex flex-col justify-center">
            <Sparkles className="w-6 h-6 mb-2 text-secondary-fixed" />
            <h3 className="font-bold text-lg">Master Recommendation</h3>
            <p className="text-3xl font-extrabold mt-2 mb-1">
              ₹{(plan.monthlySIP / 1000).toFixed(0)}k
              <span className="text-sm font-normal">/mo</span>
            </p>
            <p className="text-sm opacity-90">to unlock retirement by {plan.retirementAge}.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <h3 className="font-bold text-lg text-primary mb-4">Asset Allocation</h3>
            <div className="space-y-3">
              {Object.entries(plan.allocation as AssetAllocation).map(([asset, percent]) => (
                <div key={asset}>
                  <div className="flex justify-between mb-1">
                    <span className="capitalize font-semibold text-sm">{asset}</span>
                    <span className="font-bold text-primary">{percent}%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <h3 className="font-bold text-lg text-primary mb-4">Key Metrics</h3>
            <div className="space-y-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Retirement Corpus Needed</span>
                <div className="text-2xl font-bold text-primary mt-1">₹{(plan.retirementCorpus / 10000000).toFixed(2)}Cr</div>
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Years to Retirement</span>
                <div className="text-2xl font-bold text-primary mt-1">{plan.retirementAge - userProfile.age} years</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 p-6 rounded-md border-l-4 border-blue-500">
          <h4 className="font-bold text-blue-900 mb-2">💡 Insights</h4>
          <ul className="space-y-2">
            {plan.insights.map((insight, i) => (
              <li key={i} className="text-sm text-blue-800">{insight}</li>
            ))}
          </ul>
        </div>
      </main>
    </AppLayout>
  );
}
