import { Target, BookOpen, NotebookPen, ListChecks, Layers, MessageCircleQuestion } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { DEMO_TOPICS, DEMO_PROGRESS } from '@/lib/database/demo-data';
import { cn } from '@/lib/utils';

function bucketFor(mastery: number): 'weak' | 'moderate' | 'strong' {
  if (mastery < 50) return 'weak';
  if (mastery < 80) return 'moderate';
  return 'strong';
}

const BUCKET_STYLES = {
  weak: { label: 'Weak', color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300' },
  moderate: { label: 'Moderate', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300' },
  strong: { label: 'Strong', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300' },
};

export default function WeakTopicsPage() {
  const rows = DEMO_PROGRESS.map((p) => ({
    topic: DEMO_TOPICS.find((t) => t.id === p.topic_id)!,
    progress: p,
    bucket: bucketFor(p.mastery_score),
  })).sort((a, b) => a.progress.mastery_score - b.progress.mastery_score);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50 flex items-center gap-2">
          <Target className="h-6 w-6 text-purple-600 dark:text-purple-300" /> Weak Topic Detection
        </h1>
        <p className="text-sm text-navy-500 dark:text-lavender-400">See exactly where to focus, and why.</p>
      </div>

      <div className="space-y-3">
        {rows.map(({ topic, progress, bucket }) => (
          <Card key={topic.id} className="!p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="font-medium text-navy-900 dark:text-lavender-50">{topic.name}</p>
                <p className="text-xs text-navy-400 dark:text-lavender-500 mt-0.5">
                  {progress.attempts_count} question attempts · confidence {Math.max(progress.mastery_score - 10, 0)}%
                </p>
              </div>
              <span className={cn('text-xs font-medium rounded-full px-2.5 py-1 shrink-0', BUCKET_STYLES[bucket].color)}>
                {BUCKET_STYLES[bucket].label}
              </span>
            </div>

            <div className="h-1.5 rounded-full bg-navy-100 dark:bg-navy-800 overflow-hidden mb-4">
              <div
                className={cn('h-full rounded-full', bucket === 'weak' ? 'bg-red-400' : bucket === 'moderate' ? 'bg-amber-400' : 'bg-emerald-400')}
                style={{ width: `${progress.mastery_score}%` }}
              />
            </div>

            {bucket !== 'strong' && (
              <div className="flex flex-wrap gap-2">
                <ActionBtn icon={BookOpen} label="Learn concept" />
                <ActionBtn icon={NotebookPen} label="Generate notes" />
                <ActionBtn icon={ListChecks} label="Practise 5 questions" />
                <ActionBtn icon={Layers} label="Review flashcards" />
                <ActionBtn icon={MessageCircleQuestion} label="Ask AI tutor" />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label }: { icon: typeof BookOpen; label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg border border-navy-200 dark:border-navy-700 px-2.5 py-1.5 text-navy-600 dark:text-lavender-300 hover:border-purple-300 hover:text-purple-700">
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
