// ─────────────────────────────────────────────────────────
// EduMind AI — Recommendation engine (MVP)
// A transparent, rule-based scoring system. Deliberately kept
// separate from any route handler so it can later be swapped
// for a machine-learning model without touching API code.
//
// Every factor below is surfaced back to the student as a
// human-readable "reason" string — nothing is a black box.
// ─────────────────────────────────────────────────────────

export interface TopicSignal {
  topicId: string;
  topicName: string;
  masteryScore: number; // 0-100
  lastQuizScore: number | null; // 0-100
  doubtsCount: number;
  isIncomplete: boolean; // lessons/notes not finished
  isExamRelevant: boolean; // appears in an upcoming exam's syllabus
}

export interface RecommendationResult {
  topicId: string;
  topicName: string;
  priorityScore: number; // higher = more urgent
  reasons: string[];
}

// Weights are intentionally simple constants so they're easy to
// explain to a non-technical reader (see /responsible-ai page copy).
const WEIGHTS = {
  lowQuizScore: 0.4,
  lowMastery: 0.3,
  doubtsCount: 6, // points per doubt, capped
  incompleteLesson: 15,
  examRelevance: 20,
  highMasteryDamping: 0.5,
};

export function scoreTopics(signals: TopicSignal[]): RecommendationResult[] {
  return signals
    .map((signal) => {
      const reasons: string[] = [];
      let score = 0;

      // Low quiz score increases priority
      if (signal.lastQuizScore !== null && signal.lastQuizScore < 70) {
        const contribution = (70 - signal.lastQuizScore) * WEIGHTS.lowQuizScore;
        score += contribution;
        reasons.push(`Low quiz score (${signal.lastQuizScore}%)`);
      }

      // Low mastery increases priority
      if (signal.masteryScore < 60) {
        const contribution = (60 - signal.masteryScore) * WEIGHTS.lowMastery;
        score += contribution;
        reasons.push(`Mastery below 60% (currently ${signal.masteryScore}%)`);
      }

      // Repeated doubts increase priority
      if (signal.doubtsCount > 0) {
        const cappedDoubts = Math.min(signal.doubtsCount, 6);
        score += cappedDoubts * WEIGHTS.doubtsCount;
        reasons.push(
          `${signal.doubtsCount} doubt${signal.doubtsCount > 1 ? 's' : ''} logged on this topic`
        );
      }

      // Incomplete lessons increase priority
      if (signal.isIncomplete) {
        score += WEIGHTS.incompleteLesson;
        reasons.push('Lesson not yet completed');
      }

      // Upcoming exam relevance increases priority
      if (signal.isExamRelevant) {
        score += WEIGHTS.examRelevance;
        reasons.push('Included in your upcoming exam syllabus');
      }

      // High mastery reduces priority (damping, not exclusion)
      if (signal.masteryScore >= 85) {
        score *= WEIGHTS.highMasteryDamping;
        reasons.push('High mastery already achieved — lower priority');
      }

      return {
        topicId: signal.topicId,
        topicName: signal.topicName,
        priorityScore: Math.round(Math.max(score, 0) * 100) / 100,
        reasons,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Human-readable explanation of how the engine works, shown to
 * students on the Learning Path page for transparency.
 */
export const RECOMMENDATION_FACTORS_EXPLAINED = [
  { factor: 'Low quiz score', effect: 'Increases priority — recent scores below 70% signal a gap.' },
  { factor: 'Low mastery score', effect: 'Increases priority — mastery below 60% needs more practice.' },
  { factor: 'Repeated doubts', effect: 'Increases priority — each logged doubt on a topic adds weight.' },
  { factor: 'Incomplete lessons', effect: 'Increases priority — unfinished material is surfaced sooner.' },
  { factor: 'Upcoming exam relevance', effect: 'Increases priority — topics on your syllabus are boosted.' },
  { factor: 'High mastery (85%+)', effect: 'Reduces priority — already-strong topics make room for weaker ones.' },
] as const;
