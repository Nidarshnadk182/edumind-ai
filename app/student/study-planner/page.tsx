'use client';

import { useState } from 'react';
import { CalendarClock, Loader2, List, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlannedTask {
  date: string;
  subject: string;
  taskType: 'study' | 'revision' | 'mock_test';
  durationMinutes: number;
}

const TASK_STYLES: Record<PlannedTask['taskType'], string> = {
  study: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  revision: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  mock_test: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
};

export default function StudyPlannerPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<PlannedTask[]>([]);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    examName: 'MBA Finance Elective — Final',
    examDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    subjects: 'Corporate Finance, Derivatives',
    availableHoursPerDay: 2,
  });

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch('/api/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examName: form.examName,
          examDate: form.examDate,
          subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
          availableHoursPerDay: form.availableHoursPerDay,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setTasks(json.data.tasks);
        setCompleted(new Set());
      }
    } finally {
      setLoading(false);
    }
  }

  const groupedByDate = tasks.reduce<Record<string, PlannedTask[]>>((acc, t) => {
    acc[t.date] = acc[t.date] ?? [];
    acc[t.date]!.push(t);
    return acc;
  }, {});

  const progressPercent = tasks.length ? Math.round((completed.size / tasks.length) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50 flex items-center gap-2">
          <CalendarClock className="h-6 w-6 text-purple-600 dark:text-purple-300" /> Study Planner
        </h1>
        <p className="text-sm text-navy-500 dark:text-lavender-400">A day-by-day plan built around your exam date and free hours.</p>
      </div>

      <Card>
        <CardTitle className="!text-base">Plan details</CardTitle>
        <CardDescription>We'll allocate revision days near the end and one mock-test day before that.</CardDescription>
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">Exam name</label>
            <input value={form.examName} onChange={(e) => setForm((f) => ({ ...f, examName: e.target.value }))} className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">Exam date</label>
            <input type="date" value={form.examDate} onChange={(e) => setForm((f) => ({ ...f, examDate: e.target.value }))} className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">Subjects (comma-separated)</label>
            <input value={form.subjects} onChange={(e) => setForm((f) => ({ ...f, subjects: e.target.value }))} className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">Hours available per day</label>
            <input type="number" step={0.5} min={0.5} max={12} value={form.availableHoursPerDay} onChange={(e) => setForm((f) => ({ ...f, availableHoursPerDay: Number(e.target.value) }))} className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-sm" />
          </div>
        </div>
        <Button className="w-full mt-5" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate plan'}
        </Button>
      </Card>

      {tasks.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-navy-600 dark:text-lavender-300">{progressPercent}% complete</p>
            <div className="flex gap-1 rounded-lg border border-navy-200 dark:border-navy-700 p-1">
              <button onClick={() => setView('list')} className={cn('p-1.5 rounded-md', view === 'list' && 'bg-purple-50 text-purple-700 dark:bg-purple-900/30')}>
                <List className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setView('calendar')} className={cn('p-1.5 rounded-md', view === 'calendar' && 'bg-purple-50 text-purple-700 dark:bg-purple-900/30')}>
                <CalendarIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedByDate).map(([date, dayTasks]) => (
              <Card key={date} className="!p-4">
                <p className="text-xs font-medium text-navy-500 dark:text-lavender-400 mb-3">
                  {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <div className="space-y-2">
                  {dayTasks.map((t, i) => {
                    const key = tasks.indexOf(t);
                    return (
                      <label key={i} className="flex items-center gap-3 text-sm">
                        <input type="checkbox" checked={completed.has(key)} onChange={() => setCompleted((c) => {
                          const next = new Set(c);
                          next.has(key) ? next.delete(key) : next.add(key);
                          return next;
                        })} className="h-4 w-4 rounded accent-purple-600" />
                        <span className={cn('flex-1', completed.has(key) && 'line-through text-navy-400 dark:text-lavender-500')}>{t.subject} · {t.durationMinutes} min</span>
                        <span className={cn('text-[10px] font-medium rounded-full px-2 py-0.5', TASK_STYLES[t.taskType])}>{t.taskType.replace('_', ' ')}</span>
                      </label>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
