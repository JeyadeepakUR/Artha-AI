'use client';

import { useEffect, useMemo } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { useAppStore } from '@/lib/store';
import { calculateFirePlan, calculateHealthScore } from '@/lib/finance';

export function AuthHydrator() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const setAuthUser = useAppStore((state) => state.setAuthUser);
  const resetSessionState = useAppStore((state) => state.resetSessionState);
  const clearUserData = useAppStore((state) => state.clearUserData);
  const setUserProfile = useAppStore((state) => state.setUserProfile);
  const setMetrics = useAppStore((state) => state.setMetrics);

  useEffect(() => {
    const syncProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const email = session?.user?.email;
      const id = session?.user?.id;

      if (!email || !id) {
        setAuthUser(null);
        return;
      }

      setAuthUser({ id, email });

      const response = await fetch('/api/profile', { cache: 'no-store' });
      if (response.status === 401) {
        resetSessionState();
        return;
      }

      if (response.status === 404) {
        clearUserData();
        return;
      }

      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as {
        profile?: {
          id?: string;
          name?: string;
          email?: string;
          age?: number;
          maritalStatus?: 'single' | 'married' | 'divorced';
          monthlyIncome?: number;
          monthlyExpenses?: number;
          currentSavings?: number;
          investments?: number;
          emi?: number;
          insurance?: number;
          emergencyFund?: number;
          riskProfile?: 'conservative' | 'moderate' | 'aggressive';
          goals?: Array<{ name: string; target: number; deadline: number }>;
          fixedAssets?: number;
          liquidAssets?: number;
        };
      };

      if (!payload.profile) {
        return;
      }

      const normalizedProfile = {
        id: payload.profile.id,
        name: payload.profile.name || '',
        email: payload.profile.email || email,
        age: payload.profile.age || 0,
        maritalStatus: payload.profile.maritalStatus || 'single',
        monthlyIncome: payload.profile.monthlyIncome || 0,
        monthlyExpenses: payload.profile.monthlyExpenses || 0,
        currentSavings: payload.profile.currentSavings || 0,
        investments: payload.profile.investments || 0,
        emi: payload.profile.emi || 0,
        insurance: payload.profile.insurance || 0,
        emergencyFund: payload.profile.emergencyFund || 0,
        riskProfile: payload.profile.riskProfile || 'moderate',
        goals: payload.profile.goals || [],
        fixedAssets: payload.profile.fixedAssets || 0,
        liquidAssets: payload.profile.liquidAssets || 0,
      };

      setUserProfile(normalizedProfile);

      const healthScore = calculateHealthScore({
        age: normalizedProfile.age,
        monthlyIncome: normalizedProfile.monthlyIncome,
        monthlyExpenses: normalizedProfile.monthlyExpenses,
        currentSavings: normalizedProfile.currentSavings,
        investments: normalizedProfile.investments,
        emi: normalizedProfile.emi,
        insurance: normalizedProfile.insurance,
        riskProfile: normalizedProfile.riskProfile,
      });

      const firePlan = calculateFirePlan({
        age: normalizedProfile.age,
        monthlyIncome: normalizedProfile.monthlyIncome,
        monthlyExpenses: normalizedProfile.monthlyExpenses,
        currentSavings: normalizedProfile.currentSavings,
        investments: normalizedProfile.investments,
        riskProfile: normalizedProfile.riskProfile,
      });

      setMetrics({
        healthScore,
        firePlan,
        lastUpdated: Date.now(),
      });
    };

    syncProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        resetSessionState();
        return;
      }
      syncProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, clearUserData, resetSessionState, setAuthUser, setMetrics, setUserProfile]);

  return null;
}
