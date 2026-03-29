'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState('/dashboard');

  useEffect(() => {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next) {
      setNextPath(next);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-md border border-outline-variant/30 bg-white p-8 shadow-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-headline font-extrabold text-primary">Welcome back</h1>
          <p className="text-sm text-on-surface-variant mt-2">Sign in to continue with your real financial profile.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-outline-variant/40 px-3 py-2"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary text-white py-2.5 font-bold disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          className="w-full rounded-md border border-outline-variant/40 py-2.5 font-semibold disabled:opacity-60"
        >
          Continue with Google
        </button>

        <p className="text-sm text-center text-on-surface-variant">
          New here?{' '}
          <Link href="/auth/signup" className="text-primary font-semibold">
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}
