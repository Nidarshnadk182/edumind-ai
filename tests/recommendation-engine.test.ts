import { describe, it, expect } from 'vitest';
import { scoreTopics, type TopicSignal } from '@/lib/recommendations/engine';

describe('scoreTopics', () => {
  it('prioritises a topic with a low quiz score and repeated doubts', () => {
    const signals: TopicSignal[] = [
      {
        topicId: 't1',
        topicName: 'Weak Topic',
        masteryScore: 30,
        lastQuizScore: 40,
        doubtsCount: 5,
        isIncomplete: true,
        isExamRelevant: true,
      },
      {
        topicId: 't2',
        topicName: 'Strong Topic',
        masteryScore: 95,
        lastQuizScore: 98,
        doubtsCount: 0,
        isIncomplete: false,
        isExamRelevant: false,
      },
    ];

    const result = scoreTopics(signals);
    expect(result[0]!.topicId).toBe('t1');
    expect(result[0]!.priorityScore).toBeGreaterThan(result[1]!.priorityScore);
  });

  it('dampens priority for high-mastery topics', () => {
    const signals: TopicSignal[] = [
      {
        topicId: 't1',
        topicName: 'Mastered Topic',
        masteryScore: 90,
        lastQuizScore: 92,
        doubtsCount: 1,
        isIncomplete: false,
        isExamRelevant: true,
      },
    ];
    const result = scoreTopics(signals);
    expect(result[0]!.reasons).toContain('High mastery already achieved — lower priority');
  });

  it('explains every non-zero contribution with a human-readable reason', () => {
    const signals: TopicSignal[] = [
      {
        topicId: 't1',
        topicName: 'Gap Topic',
        masteryScore: 40,
        lastQuizScore: 50,
        doubtsCount: 2,
        isIncomplete: true,
        isExamRelevant: true,
      },
    ];
    const [result] = scoreTopics(signals);
    expect(result!.reasons.length).toBeGreaterThanOrEqual(4);
  });

  it('returns results sorted by descending priority score', () => {
    const signals: TopicSignal[] = [
      { topicId: 'low', topicName: 'Low', masteryScore: 95, lastQuizScore: 95, doubtsCount: 0, isIncomplete: false, isExamRelevant: false },
      { topicId: 'high', topicName: 'High', masteryScore: 10, lastQuizScore: 20, doubtsCount: 6, isIncomplete: true, isExamRelevant: true },
    ];
    const result = scoreTopics(signals);
    expect(result[0]!.topicId).toBe('high');
  });
});
