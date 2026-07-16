'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isSupabaseConfigured, createSupabaseBrowserClient } from '@/lib/database/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const demoMode = !isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (demoMode) {
      // Demo mode: bypass real auth and go straight to the sample dashboard.
      router.push('/student/dashboard');
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-light px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 justify-center font-display font-semibold text-navy-900 mb-8">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
            <Brain className="h-4.5 w-4.5" />
          </span>
          EduMind AI
        </Link>

        <div className="card p-7">
          <h1 className="font-display text-xl font-semibold text-navy-900 mb-1">Welcome back</h1>
          <p className="text-sm text-navy-500 mb-6">Log in to continue your learning path.</p>

          {demoMode && (
            <div className="mb-5 rounded-xl bg-amber-50 text-amber-800 text-xs px-3 py-2.5">
              Demo mode is active — any credentials will sign you into a sample student account.
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-xl bg-red-50 text-red-700 text-xs px-3 py-2.5">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Log in'}
            </Button>
          </form>

          <p className="text-center text-sm text-navy-500 mt-6">
            New here?{' '}
            <Link href="/signup" className="text-purple-600 font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
