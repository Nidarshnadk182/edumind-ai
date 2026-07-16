'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SUBJECT_OPTIONS = ['Corporate Finance', 'Derivatives', 'Strategic Management', 'Econometrics', 'Marketing', 'Accounting', 'Operations', 'Economics'];
const LEARNING_STYLES = [
  { value: 'visual', label: 'Visual' },
  { value: 'auditory', label: 'Auditory' },
  { value: 'reading_writing', label: 'Reading / Writing' },
  { value: 'kinesthetic', label: 'Kinesthetic' },
] as const;

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    educationLevel: '',
    subjects: [] as string[],
    learningGoals: '',
    preferredLearningStyle: 'visual' as (typeof LEARNING_STYLES)[number]['value'],
    preferredLanguage: 'en',
    dailyStudyMinutes: 45,
    examDate: '',
  });

  function toggleSubject(subject: string) {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(subject) ? f.subjects.filter((s) => s !== subject) : [...f.subjects, subject],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/auth/onboarding/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      router.push('/student/dashboard');
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
          <h1 className="font-display text-xl font-semibold text-navy-900 mb-1">Tell us about your learning</h1>
          <p className="text-sm text-navy-500 mb-6">This helps EduMind AI personalise your path from day one.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Full name">
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="input"
              />
            </Field>

            <Field label="Education level">
              <input
                required
                placeholder="e.g. MBA - Finance"
                value={form.educationLevel}
                onChange={(e) => setForm((f) => ({ ...f, educationLevel: e.target.value }))}
                className="input"
              />
            </Field>

            <Field label="Subjects">
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSubject(s)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-medium border transition-colors',
                      form.subjects.includes(s)
                        ? 'border-purple-400 bg-purple-50 text-purple-700'
                        : 'border-navy-200 text-navy-600'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Learning goals">
              <textarea
                rows={2}
                placeholder="What do you want to achieve this term?"
                value={form.learningGoals}
                onChange={(e) => setForm((f) => ({ ...f, learningGoals: e.target.value }))}
                className="input resize-none"
              />
            </Field>

            <Field label="Preferred learning style">
              <div className="grid grid-cols-2 gap-2">
                {LEARNING_STYLES.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, preferredLearningStyle: style.value }))}
                    className={cn(
                      'rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                      form.preferredLearningStyle === style.value
                        ? 'border-purple-400 bg-purple-50 text-purple-700'
                        : 'border-navy-200 text-navy-600'
                    )}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Preferred language">
                <select
                  value={form.preferredLanguage}
                  onChange={(e) => setForm((f) => ({ ...f, preferredLanguage: e.target.value }))}
                  className="input"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="kn">Kannada</option>
                  <option value="es">Spanish</option>
                </select>
              </Field>
              <Field label="Daily study time (min)">
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={form.dailyStudyMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, dailyStudyMinutes: Number(e.target.value) }))}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Upcoming examination date (optional)">
              <input
                type="date"
                value={form.examDate}
                onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))}
                className="input"
              />
            </Field>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Finish setup'}
            </Button>
          </form>
        </div>
      </div>
      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(221 225 242);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(151, 105, 216, 0.5);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-navy-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
