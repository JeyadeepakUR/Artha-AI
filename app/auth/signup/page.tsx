'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);

    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent('/onboarding')}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) {
      // If signup emails are throttled but account may already exist, try direct sign-in.
      if (signupError.message.toLowerCase().includes('rate limit')) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!loginError) {
          router.push('/onboarding');
          router.refresh();
          return;
        }
      }

      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      // Some Supabase configurations create user but do not return session; try immediate sign-in.
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!loginError) {
        router.push('/onboarding');
        router.refresh();
        return;
      }

      setNotice('Account created successfully. Please sign in to continue.');
      setLoading(false);
      setTimeout(() => {
        router.push('/auth/login?next=/onboarding');
      }, 900);
      return;
    }

    router.push('/onboarding');
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-md border border-outline-variant/30 bg-white p-8 shadow-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-headline font-extrabold text-primary">Create account</h1>
          <p className="text-sm text-on-surface-variant mt-2">Start with real profile data and personalized calculations.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}
          {notice && <p className="text-sm text-secondary">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary text-white py-2.5 font-bold disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignup}
            className="w-full rounded-md border border-outline-variant/40 py-2.5 font-semibold disabled:opacity-60"
          >
            Continue with Google
          </button>
        </form>

        <p className="text-sm text-center text-on-surface-variant">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-semibold">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
