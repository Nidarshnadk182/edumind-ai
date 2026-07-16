import { describe, expect, it } from 'vitest';
import { predictPerformance } from '@/lib/prediction/engine';

describe('predictPerformance', () => {
  it('gives stronger students a higher score and pass probability', () => {
    const strong = predictPerformance({ quizAverage: 85, masteryAverage: 82, completionRate: 90, revisionConsistency: 88, inactivityDays: 0 });
    const weak = predictPerformance({ quizAverage: 42, masteryAverage: 38, completionRate: 50, revisionConsistency: 35, inactivityDays: 12 });
    expect(strong.expectedScore).toBeGreaterThan(weak.expectedScore);
    expect(strong.passProbability).toBeGreaterThan(weak.passProbability);
    expect(strong.riskLevel).toBe('low');
  });

  it('returns bounded probabilities and score ranges', () => {
    const result = predictPerformance({ quizAverage: 100, masteryAverage: 100, completionRate: 100, revisionConsistency: 100 });
    expect(result.passProbability).toBeLessThanOrEqual(100);
    expect(result.scoreRange.low).toBeGreaterThanOrEqual(0);
    expect(result.scoreRange.high).toBeLessThanOrEqual(100);
  });
});
