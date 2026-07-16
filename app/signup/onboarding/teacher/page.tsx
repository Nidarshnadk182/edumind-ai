'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SUBJECT_OPTIONS = ['Corporate Finance', 'Derivatives', 'Strategic Management', 'Econometrics', 'Marketing', 'Accounting'];

export default function TeacherOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    institution: '',
    subjectsTaught: [] as string[],
    gradeOrClass: '',
    teachingObjectives: '',
  });

  function toggleSubject(subject: string) {
    setForm((f) => ({
      ...f,
      subjectsTaught: f.subjectsTaught.includes(subject)
        ? f.subjectsTaught.filter((s) => s !== subject)
        : [...f.subjectsTaught, subject],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/onboarding/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      router.push('/teacher/dashboard');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas-light px-6 py-12">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center gap-2 justify-center font-display font-semibold text-navy-900 mb-8">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
            <Brain className="h-4.5 w-4.5" />
          </span>
          EduMind AI
        </div>

        <div className="card p-7">
          <h1 className="font-display text-xl font-semibold text-navy-900 mb-1">Set up your teaching profile</h1>
          <p className="text-sm text-navy-500 mb-6">This helps EduMind AI tailor your class tools.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Full name</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Institution</label>
              <input
                value={form.institution}
                onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
                placeholder="e.g. CHRIST (Deemed to be University)"
                className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Subjects taught</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors',
                      form.subjectsTaught.includes(s)
                        ? 'border-purple-400 bg-purple-50 text-purple-700'
                        : 'border-navy-200 text-navy-600'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Grade / class</label>
              <input
                value={form.gradeOrClass}
                onChange={(e) => setForm((f) => ({ ...f, gradeOrClass: e.target.value }))}
                placeholder="e.g. MBA Semester 2"
                className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Teaching objectives</label>
              <textarea
                rows={2}
                value={form.teachingObjectives}
                onChange={(e) => setForm((f) => ({ ...f, teachingObjectives: e.target.value }))}
                className="w-full rounded-xl border border-navy-200 px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finish setup'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
