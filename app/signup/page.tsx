'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Brain, GraduationCap, Presentation, Heart, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isSupabaseConfigured, createSupabaseBrowserClient } from '@/lib/database/supabase-browser';
import type { UserRole } from '@/types/database';

const roles: { value: UserRole; label: string; icon: typeof GraduationCap }[] = [
  { value: 'student', label: 'Student', icon: GraduationCap },
  { value: 'teacher', label: 'Teacher', icon: Presentation },
  { value: 'parent', label: 'Parent', icon: Heart },
  { value: 'institution', label: 'Institution admin', icon: Building2 },
];

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const demoMode = !isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (demoMode) {
      router.push(role === 'student' ? '/signup/onboarding/student' : `/${role}/dashboard`);
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError || !data.user) {
        setError(signUpError?.message ?? 'Could not create account.');
        return;
      }
      await supabase.from('profiles').insert({ id: data.user.id, role, full_name: fullName });
      router.push(role === 'student' || role === 'teacher' ? `/signup/onboarding/${role}` : `/${role}/dashboard`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas-light px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 justify-center font-display font-semibold text-navy-900 mb-8">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
            <Brain className="h-4.5 w-4.5" />
          </span>
          EduMind AI
        </Link>

        <div className="card p-7">
          <h1 className="font-display text-xl font-semibold text-navy-900 mb-1">Create your account</h1>
          <p className="text-sm text-navy-500 mb-6">Choose your role to get started.</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors',
                  role === r.value
                    ? 'border-purple-400 bg-purple-50 text-purple-700'
                    : 'border-navy-200 text-navy-600 hover:border-navy-300'
                )}
              >
                <r.icon className="h-5 w-5" />
                {r.label}
              </button>
            ))}
          </div>

          {error && <div className="mb-5 rounded-xl bg-red-50 text-red-700 text-xs px-3 py-2.5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Full name</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
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
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-navy-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-600 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
