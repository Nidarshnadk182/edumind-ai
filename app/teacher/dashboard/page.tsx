import { Users, TrendingDown, AlertCircle, Plus, Sparkles } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DemoModeLabel, AiGeneratedLabel } from '@/components/shared/ai-label';
import { isSupabaseConfigured } from '@/lib/database/supabase-server';

const CLASS_SUMMARY = [
  { student: 'Aarav Mehta', avgScore: 88, weakTopics: 0, engagement: 'High' },
  { student: 'Priya Sharma', avgScore: 54, weakTopics: 2, engagement: 'Medium' },
  { student: 'Rohan Iyer', avgScore: 41, weakTopics: 3, engagement: 'Low' },
  { student: 'Sneha Reddy', avgScore: 76, weakTopics: 1, engagement: 'High' },
];

const PENDING_REVIEWS = [
  { title: 'Notes: Multiple Linear Regression', topic: 'Econometrics' },
  { title: 'Quiz: Put-Call Parity — 5 questions', topic: 'Derivatives' },
];

export default function TeacherDashboardPage() {
  const demoMode = !isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-navy-900 dark:text-lavender-50">Teacher Dashboard</h1>
          <p className="text-sm text-navy-500 dark:text-lavender-400">MBA Finance Elective · Semester 2</p>
        </div>
        {demoMode && <DemoModeLabel />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students" value="42" icon={Users} />
        <StatCard label="Average score" value="68%" icon={TrendingDown} />
        <StatCard label="Weak topics flagged" value="6" icon={AlertCircle} />
        <StatCard label="Pending reviews" value={String(PENDING_REVIEWS.length)} icon={Sparkles} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-1">
              <CardTitle>Class performance</CardTitle>
              <Button size="sm" variant="secondary"><Plus className="h-3.5 w-3.5" /> Create assignment</Button>
            </div>
            <CardDescription>Students requiring support are flagged in red.</CardDescription>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-navy-400 dark:text-lavender-500 border-b border-navy-100 dark:border-navy-800">
                    <th className="pb-2 font-medium">Student</th>
                    <th className="pb-2 font-medium">Avg score</th>
                    <th className="pb-2 font-medium">Weak topics</th>
                    <th className="pb-2 font-medium">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {CLASS_SUMMARY.map((s) => (
                    <tr key={s.student} className="border-b border-navy-50 dark:border-navy-800/60 last:border-0">
                      <td className="py-2.5 text-navy-800 dark:text-lavender-100">{s.student}</td>
                      <td className={`py-2.5 font-medium ${s.avgScore < 60 ? 'text-red-500' : 'text-navy-800 dark:text-lavender-100'}`}>{s.avgScore}%</td>
                      <td className="py-2.5 text-navy-500 dark:text-lavender-400">{s.weakTopics}</td>
                      <td className="py-2.5 text-navy-500 dark:text-lavender-400">{s.engagement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle className="!text-base">AI content pending review</CardTitle>
            <div className="mt-3 space-y-3">
              {PENDING_REVIEWS.map((r) => (
                <div key={r.title} className="rounded-xl border border-navy-100 dark:border-navy-800 p-3">
                  <AiGeneratedLabel pendingReview />
                  <p className="text-sm font-medium text-navy-800 dark:text-lavender-100 mt-2">{r.title}</p>
                  <p className="text-xs text-navy-400 dark:text-lavender-500">{r.topic}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">View all reviews</Button>
          </Card>

          <Card>
            <CardTitle className="!text-base">Class code</CardTitle>
            <p className="font-mono text-lg font-semibold text-purple-600 dark:text-purple-300 mt-2">FIN-2528</p>
            <p className="text-xs text-navy-400 dark:text-lavender-500 mt-1">Share this code so students can join.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return (
    <Card className="!p-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-navy-800 dark:text-purple-300 mb-3">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="text-xl font-display font-semibold text-navy-900 dark:text-lavender-50">{value}</p>
      <p className="text-xs text-navy-500 dark:text-lavender-400">{label}</p>
    </Card>
  );
}
