'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import type { UserProfile } from '@/lib/store';
import { calculateHealthScore, calculateFirePlan } from '@/lib/finance';

export default function OnboardingScreen() {
  const router = useRouter();
  const authUser = useAppStore((state) => state.authUser);
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const setMetrics = useAppStore((state) => state.setMetrics);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UserProfile>({
    name: '',
    email: authUser?.email || '',
    age: 28,
    maritalStatus: 'single',
    monthlyIncome: 80000,
    monthlyExpenses: 40000,
    currentSavings: 200000,
    investments: 150000,
    emi: 15000,
    insurance: 300000,
    emergencyFund: 200000,
    riskProfile: 'moderate',
    goals: [],
    fixedAssets: 0,
    liquidAssets: 200000,
  });

  useEffect(() => {
    if (hasHydrated && !authUser) {
      router.replace('/auth/login?next=/onboarding');
      return;
    }

    if (authUser?.email) {
      setFormData((prev) => ({ ...prev, email: authUser.email }));
    }
  }, [authUser, hasHydrated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'age' || name === 'monthlyIncome' || name === 'monthlyExpenses' ||
              name === 'currentSavings' || name === 'investments' || name === 'emi' ||
              name === 'insurance' || name === 'emergencyFund' || name === 'fixedAssets' ||
              name === 'liquidAssets'
        ? parseFloat(value)
        : value,
    }));
  };

  const handleComplete = async () => {
    if (!authUser?.email) {
      router.replace('/auth/login?next=/onboarding');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        email: authUser.email,
      };

      // Calculate metrics
      const healthScore = calculateHealthScore({
        age: payload.age,
        monthlyIncome: payload.monthlyIncome,
        monthlyExpenses: payload.monthlyExpenses,
        currentSavings: payload.currentSavings,
        investments: payload.investments,
        emi: payload.emi,
        insurance: payload.insurance,
        riskProfile: payload.riskProfile,
      });

      const firePlan = calculateFirePlan({
        age: payload.age,
        monthlyIncome: payload.monthlyIncome,
        monthlyExpenses: payload.monthlyExpenses,
        currentSavings: payload.currentSavings,
        investments: payload.investments,
        riskProfile: payload.riskProfile,
      });

      // Save to store
      setUserProfile(payload);
      setMetrics({
        healthScore,
        firePlan,
        lastUpdated: Date.now(),
      });

      // Save to database
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        completeOnboarding();
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 py-4 bg-white/70 backdrop-blur-xl z-50">
        <div className="text-xl font-extrabold tracking-tight text-primary">ARTHA AI</div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold font-label uppercase tracking-widest text-on-surface-variant">Step {step} of 3</span>
          <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-secondary transition-all" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-6 max-w-2xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="font-headline text-3xl font-extrabold text-primary tracking-tight mb-3">
            {step === 1 ? "Let's set up your profile" : step === 2 ? 'Tell us about your finances' : 'Your risk profile'}
          </h1>
          <p className="text-on-surface-variant leading-relaxed">
            {step === 1
              ? 'Basic information to personalize your experience'
              : step === 2
              ? 'Help us understand your financial situation'
              : 'Choose your investment comfort level'}
          </p>
        </div>

        <div className="space-y-8">
          {step === 1 && (
            <section className="bg-surface-container-low p-8 rounded-md">
              <h2 className="font-headline text-lg font-bold text-primary mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Alex"
                    className="w-full bg-white border border-outline-variant/30 rounded-md p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    readOnly
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-md p-3 text-on-surface-variant"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full bg-white border border-outline-variant/30 rounded-md p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Status</label>
                  <select
                    name="maritalStatus"
                    value={formData.maritalStatus}
                    onChange={handleChange}
                    className="w-full bg-white border border-outline-variant/30 rounded-md p-3"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="bg-surface-container-low p-8 rounded-md">
              <h2 className="font-headline text-lg font-bold text-primary mb-6">Financial Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Monthly Income (₹)</label>
                  <input
                    type="number"
                    name="monthlyIncome"
                    value={formData.monthlyIncome}
                    onChange={handleChange}
                    className="w-full bg-white border border-outline-variant/30 rounded-md p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Monthly Expenses (₹)</label>
                  <input
                    type="number"
                    name="monthlyExpenses"
                    value={formData.monthlyExpenses}
                    onChange={handleChange}
                    className="w-full bg-white border border-outline-variant/30 rounded-md p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Savings (₹)</label>
                  <input
                    type="number"
                    name="currentSavings"
                    value={formData.currentSavings}
                    onChange={handleChange}
                    className="w-full bg-white border border-outline-variant/30 rounded-md p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Investments (₹)</label>
                  <input
                    type="number"
                    name="investments"
                    value={formData.investments}
                    onChange={handleChange}
                    className="w-full bg-white border border-outline-variant/30 rounded-md p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    name="emi"
                    value={formData.emi}
                    onChange={handleChange}
                    className="w-full bg-white border border-outline-variant/30 rounded-md p-3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2">Insurance Coverage (₹)</label>
                  <input
                    type="number"
                    name="insurance"
                    value={formData.insurance}
                    onChange={handleChange}
                    className="w-full bg-white border border-outline-variant/30 rounded-md p-3"
                  />
                </div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="bg-surface-container-low p-8 rounded-md">
              <h2 className="font-headline text-lg font-bold text-primary mb-6">Risk Profile</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  {
                    key: 'conservative',
                    title: 'Conservative',
                    description: 'Prefer capital protection and steady, lower-volatility returns.',
                  },
                  {
                    key: 'moderate',
                    title: 'Moderate',
                    description: 'Balance growth with safety through a mixed allocation approach.',
                  },
                  {
                    key: 'aggressive',
                    title: 'Aggressive',
                    description: 'Prioritize long-term growth and can handle higher short-term volatility.',
                  },
                ].map((option) => {
                  const isSelected = formData.riskProfile === option.key;

                  return (
                    <label
                      key={option.key}
                      className={`relative flex cursor-pointer flex-col gap-3 rounded-md border-2 p-5 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-sm'
                          : 'border-outline-variant/30 bg-white hover:border-primary/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="riskProfile"
                        value={option.key}
                        checked={isSelected}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-4 w-4 rounded-full border ${
                            isSelected ? 'border-primary' : 'border-outline-variant'
                          }`}
                        >
                          <span
                            className={`block h-full w-full rounded-full transition-transform ${
                              isSelected ? 'scale-60 bg-primary' : 'scale-0'
                            }`}
                          />
                        </span>
                        <span className="font-semibold text-on-surface">{option.title}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-on-surface-variant">{option.description}</p>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          <div className="flex gap-4 pt-6">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 px-8 py-4 bg-surface-container-highest text-on-surface font-bold rounded-md hover:bg-surface-variant transition-colors"
              >
                Back
              </button>
            )}
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                className="grow-2 px-8 py-4 bg-primary text-white font-bold rounded-md transition-all active:scale-95"
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="grow-2 px-8 py-4 bg-primary text-white font-bold rounded-md transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
