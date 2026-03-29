'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function SplashScreen() {
  const router = useRouter();
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const authUser = useAppStore((state) => state.authUser);
  const userProfile = useAppStore((state) => state.userProfile);
  const loadDemoProfile = useAppStore((state) => state.loadDemoProfile);

  useEffect(() => {
    if (!hasHydrated || !authUser) {
      return;
    }

    if (userProfile) {
      router.replace('/dashboard');
      return;
    }

    router.replace('/onboarding');
  }, [hasHydrated, authUser, userProfile, router]);

  const handleDemoMode = () => {
    loadDemoProfile();
    router.push('/dashboard');
  };

  return (
    <div className="bg-linear-to-br from-[#000666] to-[#1a237e] min-h-screen flex flex-col items-center justify-center font-body text-white relative overflow-hidden">
      <div className="z-10 text-center flex flex-col items-center">
        <div className="mb-8 w-20 h-20 bg-white/5 backdrop-blur-md rounded-md flex items-center justify-center shadow-2xl border border-white/10">
          <Sparkles className="w-10 h-10 text-secondary-fixed" />
        </div>
        <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight mb-4">ARTHA AI</h1>
        <p className="text-lg md:text-xl text-primary-fixed opacity-80 tracking-wide mb-12">Your Personal CFO</p>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push('/auth/signup')}
            className="bg-secondary hover:bg-[#00531e] text-white font-headline font-bold text-lg px-12 py-5 rounded-md transition-all active:scale-95 flex items-center gap-3"
          >
            Get Started
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/auth/login')}
            className="border border-white/30 text-white font-bold text-base px-12 py-3 rounded-md hover:bg-white/10 transition-colors"
          >
            I already have an account
          </button>
          <button
            onClick={handleDemoMode}
            className="text-sm text-white/70 underline underline-offset-4"
          >
            Try demo mode (optional)
          </button>
        </div>
      </div>
    </div>
  );
}
