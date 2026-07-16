import Link from 'next/link';
import { Flame, Clock, Award, Target, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { DemoModeLabel } from '@/components/shared/ai-label';
import { isSupabaseConfigured } from '@/lib/database/supabase-server';
import {
  DEMO_STUDENT,
  DEMO_TOPICS,
  DEMO_PROGRESS,
  DEMO_RECOMMENDATIONS,
  DEMO_WEEKLY_ACTIVITY,
  DEMO_SUBJECT_MASTERY,
  DEMO_QUIZZES,
} from '@/lib/database/demo-data';
import { WeeklyActivityChart, SubjectMasteryChart } from './charts';

export default function StudentDashboardPage() {
  const demoMode = !isSupabaseConfigured();

  const topicsMastered = DEMO_PROGRESS.filter((p) => p.status === 'completed').length;
  const topicsNeedingWork = DEMO_PROGRESS.filter((p) => p.mastery_score < 60).length;
  const overallProgress = Math.round(
    DEMO_PROGRESS.reduce((sum, p) => sum + p.mastery_score, 0) / DEMO_PROGRESS.length
  );
  const topRecommendation = DEMO_RECOMMENDATIONS[0];
  const topRecommendationTopic = DEMO_TOPICS.find((t) => t.id === topRecommendation?.topic_id);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-navy-500 dark:text-lavender-400">Welcome back,</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-navy-900 dark:text-lavender-50">
            {DEMO_STUDENT.fullName.split(' ')[0]} 👋
          </h1>
        </div>
        {demoMode && <DemoModeLabel />}
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="Study streak" value={`${DEMO_STUDENT.streakDays} days`} tint="text-orange-500 bg-orange-50" />
        <StatCard icon={Clock} label="This week" value={`${DEMO_STUDENT.weeklyLearningMinutes} min`} tint="text-blue-500 bg-blue-50" />
        <StatCard icon={Award} label="Avg quiz score" value={`${DEMO_STUDENT.averageQuizScore}%`} tint="text-purple-500 bg-purple-50" />
        <StatCard icon={TrendingUp} label="Overall progress" value={`${overallProgress}%`} tint="text-emerald-500 bg-emerald-50" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column: charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardTitle>Weekly learning time</CardTitle>
            <CardDescription>Minutes studied over the last 7 days</CardDescription>
            <div className="mt-4">
              <WeeklyActivityChart data={DEMO_WEEKLY_ACTIVITY} />
            </div>
          </Card>

          <Card>
            <CardTitle>Subject-wise mastery</CardTitle>
            <CardDescription>How much of each subject you've mastered so far</CardDescription>
            <div className="mt-4">
              <SubjectMasteryChart data={DEMO_SUBJECT_MASTERY} />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-1">
              <CardTitle>Recent learning activity</CardTitle>
            </div>
            <div className="mt-3 divide-y divide-navy-100 dark:divide-navy-800">
              <ActivityRow label="Completed quiz: WACC — Concept Check" meta="Score 90% · 2 days ago" />
              <ActivityRow label="Asked AI tutor about Delta and Gamma" meta="Option Greeks · 6 hours ago" />
              <ActivityRow label="Generated flashcard deck: Put-Call Parity Essentials" meta="20 hours ago" />
              <ActivityRow label="Reviewed notes: Porter's Five Forces" meta="1 day ago" />
            </div>
          </Card>
        </div>

        {/* Right column: today's goal + recommendation + upcoming */}
        <div className="space-y-6">
          <Card className="bg-navy-900 dark:bg-navy-950 border-none text-white">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-purple-300" />
              <p className="text-sm font-medium text-purple-200">Today's learning goal</p>
            </div>
            <p className="text-lg font-display font-semibold mb-1">Practice Option Greeks</p>
            <p className="text-sm text-navy-300 mb-4">15 minutes · builds on yesterday's session</p>
            <Link href="/student/ai-tutor" className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-300 hover:text-purple-200">
              Start now <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-300" />
              <CardTitle className="!text-base">Recommended next topic</CardTitle>
            </div>
            <p className="font-medium text-navy-900 dark:text-lavender-50">{topRecommendationTopic?.name}</p>
            <ul className="mt-2 space-y-1">
              {topRecommendation?.reasons.slice(0, 2).map((r) => (
                <li key={r} className="text-xs text-navy-500 dark:text-lavender-400">• {r}</li>
              ))}
            </ul>
            <Link href="/student/learning-path" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-300">
              View learning path <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <Card>
            <CardTitle className="!text-base">Upcoming quizzes</CardTitle>
            <div className="mt-3 space-y-3">
              {DEMO_QUIZZES.map((q) => (
                <div key={q.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-navy-800 dark:text-lavender-100">{q.title}</p>
                    <p className="text-xs text-navy-400 dark:text-lavender-400">{q.time_limit_minutes} min · {q.difficulty}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle className="!text-base">Topics needing improvement</CardTitle>
            <p className="text-sm text-navy-500 dark:text-lavender-400 mt-1">{topicsNeedingWork} topics below 60% mastery · {topicsMastered} completed</p>
            <Link href="/student/weak-topics" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-300">
              View weak topics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }: { icon: typeof Flame; label: string; value: string; tint: string }) {
  const [textColor, bgColor] = tint.split(' ');
  return (
    <Card className="!p-5">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${bgColor} ${textColor} dark:bg-navy-800 mb-3`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="text-xl font-display font-semibold text-navy-900 dark:text-lavender-50">{value}</p>
      <p className="text-xs text-navy-500 dark:text-lavender-400">{label}</p>
    </Card>
  );
}

function ActivityRow({ label, meta }: { label: string; meta: string }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <p className="text-sm text-navy-800 dark:text-lavender-100">{label}</p>
      <p className="text-xs text-navy-400 dark:text-lavender-400 mt-0.5">{meta}</p>
    </div>
  );
}
