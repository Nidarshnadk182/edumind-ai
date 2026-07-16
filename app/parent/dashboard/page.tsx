import { Clock, Award, TrendingUp, CalendarClock, MessageSquare } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { DemoModeLabel } from '@/components/shared/ai-label';
import { isSupabaseConfigured } from '@/lib/database/supabase-server';

export default function ParentDashboardPage() {
  const demoMode = !isSupabaseConfigured();

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50">Demo Student's Progress</h1>
          <p className="text-sm text-navy-500 dark:text-lavender-400">MBA Finance · CHRIST (Deemed to be University)</p>
        </div>
        {demoMode && <DemoModeLabel />}
      </div>

      <div className="rounded-xl bg-lavender-50 dark:bg-navy-900/40 border border-lavender-200 dark:border-navy-800 p-4 text-sm text-navy-600 dark:text-lavender-300">
        Private AI-tutor conversations are not shown here by default, to protect student privacy.
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Learning time (week)" value="340 min" />
        <StatCard icon={Award} label="Avg quiz score" value="78%" />
        <StatCard icon={TrendingUp} label="Overall progress" value="66%" />
        <StatCard icon={CalendarClock} label="Next assessment" value="12 days" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="!text-base">Strengths</CardTitle>
          <ul className="mt-3 space-y-1.5 text-sm text-navy-600 dark:text-lavender-300">
            <li>• Net Present Value (95% mastery)</li>
            <li>• Weighted Average Cost of Capital (88%)</li>
          </ul>
        </Card>
        <Card>
          <CardTitle className="!text-base">Areas for improvement</CardTitle>
          <ul className="mt-3 space-y-1.5 text-sm text-navy-600 dark:text-lavender-300">
            <li>• Multiple Linear Regression (35%)</li>
            <li>• Option Greeks (42%)</li>
          </ul>
        </Card>
      </div>

      <Card>
        <CardTitle className="!text-base">Completed study goals</CardTitle>
        <CardDescription>4 of 6 this week</CardDescription>
        <div className="h-2 rounded-full bg-navy-100 dark:bg-navy-800 overflow-hidden mt-3">
          <div className="h-full bg-purple-500" style={{ width: '66%' }} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-300" />
          <CardTitle className="!text-base">Teacher comments</CardTitle>
        </div>
        <p className="text-sm text-navy-600 dark:text-lavender-300 mt-2">"Strong grasp of Corporate Finance fundamentals. Recommend extra practice on regression before the Econometrics mid-term."</p>
        <p className="text-xs text-navy-400 dark:text-lavender-500 mt-2">— Course instructor, 3 days ago</p>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <Card className="!p-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-navy-800 dark:text-purple-300 mb-3">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="text-lg font-display font-semibold text-navy-900 dark:text-lavender-50">{value}</p>
      <p className="text-xs text-navy-500 dark:text-lavender-400">{label}</p>
    </Card>
  );
}
