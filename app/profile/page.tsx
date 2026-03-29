'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout, TopBar } from '@/components/Layout';
import { useAppStore } from '@/lib/store';
import { calculateFirePlan, calculateHealthScore } from '@/lib/finance';
import { Loader2 } from 'lucide-react';

export default function ProfileScreen() {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const authUser = useAppStore((state) => state.authUser);
  const userProfile = useAppStore((state) => state.userProfile);
  const scenarioHistory = useAppStore((state) => state.scenarioHistory);
  const profileSnapshots = useAppStore((state) => state.profileSnapshots);
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const setMetrics = useAppStore((state) => state.setMetrics);
  const addProfileSnapshot = useAppStore((state) => state.addProfileSnapshot);
  const [form, setForm] = useState(userProfile);
  const [saveLoading, setSaveLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setForm(userProfile);
  }, [userProfile]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!authUser) {
      router.replace('/auth/login?next=/profile');
      return;
    }

    if (!userProfile) {
      router.replace('/onboarding');
    }
  }, [hasHydrated, authUser, userProfile, router]);

  if (!hasHydrated || !userProfile) {
    return (
      <AppLayout>
        <TopBar title="Profile" />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </main>
      </AppLayout>
    );
  }

  if (!form) {
    return null;
  }

  const updateField = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const saveProfile = async () => {
    if (!form) {
      return;
    }

    setSaveLoading(true);
    setStatus(null);

    try {
      const healthScore = calculateHealthScore({
        age: form.age,
        monthlyIncome: form.monthlyIncome,
        monthlyExpenses: form.monthlyExpenses,
        currentSavings: form.currentSavings,
        investments: form.investments,
        emi: form.emi,
        insurance: form.insurance,
        riskProfile: form.riskProfile,
      });

      const firePlan = calculateFirePlan({
        age: form.age,
        monthlyIncome: form.monthlyIncome,
        monthlyExpenses: form.monthlyExpenses,
        currentSavings: form.currentSavings,
        investments: form.investments,
        riskProfile: form.riskProfile,
      });

      setUserProfile(form);
      setMetrics({
        healthScore,
        firePlan,
        lastUpdated: Date.now(),
      });

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      addProfileSnapshot({
        id: `manual-${Date.now()}`,
        source: 'manual-update',
        createdAt: Date.now(),
        profile: form,
      });

      setStatus('Profile updated and snapshot saved.');
    } catch {
      setStatus('Unable to save right now. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const formatMoney = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;
  const savingsRate = form.monthlyIncome > 0 ? Math.round(((form.monthlyIncome - form.monthlyExpenses) / form.monthlyIncome) * 100) : 0;

  return (
    <AppLayout>
      <TopBar title="Profile" subtitle="Money Hub" />
      <main className="px-8 pb-24 max-w-6xl mx-auto w-full pt-8 space-y-8">
        <section className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-surface-container overflow-hidden flex items-center justify-center">
            <span className="text-2xl font-bold text-primary">{form.name.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">{form.name}</h1>
            <span className="text-sm font-bold px-3 py-1 bg-primary/10 text-primary rounded-full mt-2 inline-block capitalize">
              {form.riskProfile} Risk
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-linear-to-br from-primary to-primary-container text-white p-6 rounded-md md:col-span-2 shadow-sm">
            <span className="text-xs uppercase tracking-widest font-bold opacity-80">Net Worth</span>
            <div className="text-4xl font-extrabold mt-2">
              ₹{((form.currentSavings + form.investments + form.fixedAssets) / 100000).toFixed(2)}L
            </div>
            <div className="text-sm text-secondary-fixed mt-1 font-bold">Savings rate: {savingsRate}%</div>
          </div>
          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Liabilities</span>
            <div className="text-2xl font-bold text-primary mt-2">₹{(form.emi * 12 / 100000).toFixed(2)}L/yr</div>
          </div>
          <div className="bg-white p-6 rounded-md border border-outline-variant/20">
            <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">Monthly Surplus</span>
            <div className="text-2xl font-bold text-primary mt-2">{formatMoney(form.monthlyIncome - form.monthlyExpenses)}</div>
          </div>
        </div>

        <section className="bg-white rounded-md border border-outline-variant/20 p-6 space-y-4">
          <h2 className="text-xl font-bold text-primary">Editable Financial Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="text-sm font-semibold">Name
              <input value={form.name} onChange={(e) => updateField('name', e.target.value)} className="mt-1 w-full rounded-md border border-outline-variant/30 px-3 py-2" />
            </label>
            <label className="text-sm font-semibold">Age
              <input type="number" value={form.age} onChange={(e) => updateField('age', Number(e.target.value))} className="mt-1 w-full rounded-md border border-outline-variant/30 px-3 py-2" />
            </label>
            <label className="text-sm font-semibold">Risk Profile
              <select value={form.riskProfile} onChange={(e) => updateField('riskProfile', e.target.value)} className="mt-1 w-full rounded-md border border-outline-variant/30 px-3 py-2">
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </label>
            <label className="text-sm font-semibold">Monthly Income
              <input type="number" value={form.monthlyIncome} onChange={(e) => updateField('monthlyIncome', Number(e.target.value))} className="mt-1 w-full rounded-md border border-outline-variant/30 px-3 py-2" />
            </label>
            <label className="text-sm font-semibold">Monthly Expenses
              <input type="number" value={form.monthlyExpenses} onChange={(e) => updateField('monthlyExpenses', Number(e.target.value))} className="mt-1 w-full rounded-md border border-outline-variant/30 px-3 py-2" />
            </label>
            <label className="text-sm font-semibold">Current Savings
              <input type="number" value={form.currentSavings} onChange={(e) => updateField('currentSavings', Number(e.target.value))} className="mt-1 w-full rounded-md border border-outline-variant/30 px-3 py-2" />
            </label>
            <label className="text-sm font-semibold">Investments
              <input type="number" value={form.investments} onChange={(e) => updateField('investments', Number(e.target.value))} className="mt-1 w-full rounded-md border border-outline-variant/30 px-3 py-2" />
            </label>
            <label className="text-sm font-semibold">EMI
              <input type="number" value={form.emi} onChange={(e) => updateField('emi', Number(e.target.value))} className="mt-1 w-full rounded-md border border-outline-variant/30 px-3 py-2" />
            </label>
            <label className="text-sm font-semibold">Insurance Coverage
              <input type="number" value={form.insurance} onChange={(e) => updateField('insurance', Number(e.target.value))} className="mt-1 w-full rounded-md border border-outline-variant/30 px-3 py-2" />
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={saveProfile}
              disabled={saveLoading}
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saveLoading ? 'Saving...' : 'Save Changes'}
            </button>
            {status && <p className="text-sm text-on-surface-variant">{status}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-sm">
            <div className="rounded-md border border-outline-variant/20 p-3">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Income</p>
              <p className="mt-1 font-semibold">{formatMoney(form.monthlyIncome)}</p>
            </div>
            <div className="rounded-md border border-outline-variant/20 p-3">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Expenses</p>
              <p className="mt-1 font-semibold">{formatMoney(form.monthlyExpenses)}</p>
            </div>
            <div className="rounded-md border border-outline-variant/20 p-3">
              <p className="text-xs uppercase tracking-wider text-on-surface-variant font-bold">Savings Rate</p>
              <p className="mt-1 font-semibold">{savingsRate}%</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-md border border-outline-variant/20 p-6">
            <h3 className="text-lg font-bold text-primary mb-3">Scenario History</h3>
            <div className="max-h-80 overflow-auto text-sm">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-on-surface-variant">
                    <th className="pb-2">Scenario</th>
                    <th className="pb-2">Action</th>
                    <th className="pb-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {scenarioHistory.map((entry) => (
                    <tr key={entry.id} className="border-t border-outline-variant/20">
                      <td className="py-2">{entry.scenarioName}</td>
                      <td className="py-2">{entry.appliedToProfile ? 'Applied' : 'Saved only'}</td>
                      <td className="py-2">{new Date(entry.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {scenarioHistory.length === 0 && (
                    <tr>
                      <td className="py-3 text-on-surface-variant" colSpan={3}>No scenarios saved yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-md border border-outline-variant/20 p-6">
            <h3 className="text-lg font-bold text-primary mb-3">Snapshots</h3>
            <div className="max-h-80 overflow-auto text-sm">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-on-surface-variant">
                    <th className="pb-2">Source</th>
                    <th className="pb-2">Income</th>
                    <th className="pb-2">When</th>
                  </tr>
                </thead>
                <tbody>
                  {profileSnapshots.map((entry) => (
                    <tr key={entry.id} className="border-t border-outline-variant/20">
                      <td className="py-2">{entry.source}</td>
                      <td className="py-2">{formatMoney(entry.profile.monthlyIncome)}</td>
                      <td className="py-2">{new Date(entry.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {profileSnapshots.length === 0 && (
                    <tr>
                      <td className="py-3 text-on-surface-variant" colSpan={3}>No snapshots yet. Save profile once to create one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
