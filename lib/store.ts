/**
 * Global App Store using Zustand
 * Manages user profile, financial plan, and app state
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { HealthScoreResult } from "@/lib/finance/healthScore";
import { FirePlanResult } from "@/lib/finance/firePlan";
import { calculateHealthScore, calculateFirePlan } from "@/lib/finance";

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  age: number;
  maritalStatus: "single" | "married" | "divorced";
  monthlyIncome: number;
  monthlyExpenses: number;
  currentSavings: number;
  investments: number;
  emi: number;
  insurance: number;
  emergencyFund: number;
  riskProfile: "conservative" | "moderate" | "aggressive";
  goals: Array<{name: string; target: number; deadline: number}>;
  fixedAssets: number;
  liquidAssets: number;
}

export interface FinancialMetrics {
  healthScore: HealthScoreResult | null;
  firePlan: FirePlanResult | null;
  lastUpdated: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ScenarioHistoryItem {
  id: string;
  scenarioName: string;
  baseline: {
    monthlyIncome: number;
    monthlyExpenses: number;
    currentSavings: number;
    investments: number;
    emi: number;
    retirementAge: number;
    monthlySip: number;
  };
  projected: {
    monthlyIncome: number;
    monthlyExpenses: number;
    currentSavings: number;
    investments: number;
    emi: number;
    retirementAge: number;
    monthlySip: number;
  };
  analysis: string;
  appliedToProfile: boolean;
  createdAt: number;
}

export interface ProfileSnapshot {
  id: string;
  source: "manual-update" | "simulation-apply";
  createdAt: number;
  profile: UserProfile;
}

export interface AuthUser {
  id: string;
  email: string;
}

interface AppStore {
  authUser: AuthUser | null;
  setAuthUser: (user: AuthUser | null) => void;
  resetSessionState: () => void;
  clearUserData: () => void;

  // User profile
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;

  // Financial metrics
  metrics: FinancialMetrics;
  setMetrics: (metrics: FinancialMetrics) => void;

  // Onboarding
  isOnboardingComplete: boolean;
  completeOnboarding: () => void;

  // Chat
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // Scenario/history tracking
  scenarioHistory: ScenarioHistoryItem[];
  addScenarioHistory: (entry: ScenarioHistoryItem) => void;
  profileSnapshots: ProfileSnapshot[];
  addProfileSnapshot: (snapshot: ProfileSnapshot) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;

  // Demo mode
  loadDemoProfile: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state
      authUser: null,
      userProfile: null,
      metrics: {
        healthScore: null,
        firePlan: null,
        lastUpdated: 0,
      },
      isOnboardingComplete: false,
      chatMessages: [],
      scenarioHistory: [],
      profileSnapshots: [],
      isLoading: false,
      error: null,
      hasHydrated: false,

      // Actions
      setAuthUser: (user) => set({ authUser: user }),

      resetSessionState: () =>
        set({
          authUser: null,
          userProfile: null,
          metrics: {
            healthScore: null,
            firePlan: null,
            lastUpdated: 0,
          },
          isOnboardingComplete: false,
          chatMessages: [],
          scenarioHistory: [],
          profileSnapshots: [],
        }),

      clearUserData: () =>
        set({
          userProfile: null,
          metrics: {
            healthScore: null,
            firePlan: null,
            lastUpdated: 0,
          },
          isOnboardingComplete: false,
          chatMessages: [],
        }),

      setUserProfile: (profile) => set({ userProfile: profile }),

      updateUserProfile: (updates) =>
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, ...updates }
            : null,
        })),

      setMetrics: (metrics) => set({ metrics }),

      completeOnboarding: () => set({ isOnboardingComplete: true }),

      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),

      clearChat: () => set({ chatMessages: [] }),

      addScenarioHistory: (entry) =>
        set((state) => ({
          scenarioHistory: [entry, ...state.scenarioHistory].slice(0, 30),
        })),

      addProfileSnapshot: (snapshot) =>
        set((state) => ({
          profileSnapshots: [snapshot, ...state.profileSnapshots].slice(0, 50),
        })),

      setIsLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),

      loadDemoProfile: () => {
        const demoProfile: UserProfile = {
          name: "Alex Rivera",
          email: "alex@example.com",
          age: 28,
          maritalStatus: "single",
          monthlyIncome: 80000,
          monthlyExpenses: 40000,
          currentSavings: 200000,
          investments: 150000,
          emi: 15000,
          insurance: 300000,
          emergencyFund: 200000,
          riskProfile: "moderate",
          goals: [
            { name: "Retirement at 50", target: 5000000, deadline: 22 },
            { name: "House Purchase", target: 3000000, deadline: 5 },
            { name: "Travel Sabbatical", target: 500000, deadline: 3 },
          ],
          fixedAssets: 0,
          liquidAssets: 200000,
        };

        const healthScore = calculateHealthScore({
          age: demoProfile.age,
          monthlyIncome: demoProfile.monthlyIncome,
          monthlyExpenses: demoProfile.monthlyExpenses,
          currentSavings: demoProfile.currentSavings,
          investments: demoProfile.investments,
          emi: demoProfile.emi,
          insurance: demoProfile.insurance,
          riskProfile: demoProfile.riskProfile,
        });

        const firePlan = calculateFirePlan({
          age: demoProfile.age,
          monthlyIncome: demoProfile.monthlyIncome,
          monthlyExpenses: demoProfile.monthlyExpenses,
          currentSavings: demoProfile.currentSavings,
          investments: demoProfile.investments,
          riskProfile: demoProfile.riskProfile,
        });

        set({
          userProfile: demoProfile,
          metrics: {
            healthScore,
            firePlan,
            lastUpdated: Date.now(),
          },
          isOnboardingComplete: true,
        });
      },
    }),
    {
      name: "artha-ai-store",
      version: 1,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
