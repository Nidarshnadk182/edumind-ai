import { Route, Lock, CheckCircle2, Circle, Info } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { DEMO_TOPICS, DEMO_PROGRESS, DEMO_SUBJECTS } from '@/lib/database/demo-data';
import { RECOMMENDATION_FACTORS_EXPLAINED } from '@/lib/recommendations/engine';
import { cn } from '@/lib/utils';

export default function LearningPathPage() {
  const derivatives = DEMO_SUBJECTS.find((s) => s.slug === 'derivatives')!;
  const derivativeTopics = DEMO_TOPICS.filter((t) => t.subject_id === derivatives.id).sort((a, b) => a.order_index - b.order_index);

  const withProgress = derivativeTopics.map((t) => ({
    topic: t,
    progress: DEMO_PROGRESS.find((p) => p.topic_id === t.id),
  }));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50 flex items-center gap-2">
          <Route className="h-6 w-6 text-purple-600 dark:text-purple-300" /> Learning Path
        </h1>
        <p className="text-sm text-navy-500 dark:text-lavender-400">A sequence built around your actual gaps in {derivatives.name}.</p>
      </div>

      <Card>
        <CardTitle className="!text-base">Current objective</CardTitle>
        <CardDescription>Build strong intuition for options pricing and risk before the mid-term.</CardDescription>
        <p className="text-xs text-navy-400 dark:text-lavender-500 mt-3">Estimated completion: 12 more days at your current pace</p>
      </Card>

      <div className="space-y-3">
        {withProgress.map(({ topic, progress }, i) => {
          const locked = i > 0 && (withProgress[i - 1]?.progress?.status !== 'completed');
          const completed = progress?.status === 'completed';
          return (
            <Card key={topic.id} className={cn('!p-5 flex items-center gap-4', locked && 'opacity-60')}>
              <span className="shrink-0">
                {locked ? (
                  <Lock className="h-5 w-5 text-navy-300 dark:text-navy-600" />
                ) : completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-purple-500" />
                )}
              </span>
              <div className="flex-1">
                <p className="font-medium text-navy-900 dark:text-lavender-50">{topic.name}</p>
                <p className="text-xs text-navy-400 dark:text-lavender-500 capitalize">{topic.difficulty}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-navy-800 dark:text-lavender-100">{progress?.mastery_score ?? 0}%</p>
                <p className="text-xs text-navy-400 dark:text-lavender-500">mastery</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="bg-navy-50/60 dark:bg-navy-900/40 border-navy-100 dark:border-navy-800">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-navy-500 dark:text-lavender-400" />
          <CardTitle className="!text-sm">How recommendations are calculated</CardTitle>
        </div>
        <ul className="space-y-2">
          {RECOMMENDATION_FACTORS_EXPLAINED.map((f) => (
            <li key={f.factor} className="text-xs text-navy-500 dark:text-lavender-400">
              <span className="font-medium text-navy-700 dark:text-lavender-200">{f.factor}:</span> {f.effect}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
