import { Sparkles } from 'lucide-react';

/**
 * Transparent label shown on any AI-generated content, per the
 * Responsible AI commitments described on /responsible-ai.
 */
export function AiGeneratedLabel({ pendingReview = false }: { pendingReview?: boolean }) {
  return (
    <span className="badge-ai">
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      AI-generated{pendingReview ? ' · pending teacher review' : ''}
    </span>
  );
}

export function DemoModeLabel() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 dark:bg-amber-900/30 dark:text-amber-300">
      Demo mode — sample data
    </span>
  );
}
