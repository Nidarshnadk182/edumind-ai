import { describe, it, expect } from 'vitest';
import { scoreQuiz, type ScorableQuestion } from '@/lib/database/quiz-scoring';

const QUESTIONS: ScorableQuestion[] = [
  { id: 'q1', correctAnswer: 'Paris', questionType: 'short_answer' },
  { id: 'q2', correctAnswer: 'True', questionType: 'true_false' },
  { id: 'q3', correctAnswer: '48', questionType: 'numerical' },
];

describe('scoreQuiz', () => {
  it('scores all-correct answers as 100%', () => {
    const result = scoreQuiz(QUESTIONS, [
      { questionId: 'q1', studentAnswer: 'Paris' },
      { questionId: 'q2', studentAnswer: 'True' },
      { questionId: 'q3', studentAnswer: '48' },
    ]);
    expect(result.scorePercent).toBe(100);
    expect(result.correctCount).toBe(3);
  });

  it('is case-insensitive and trims whitespace for short-answer questions', () => {
    const result = scoreQuiz([QUESTIONS[0]!], [{ questionId: 'q1', studentAnswer: '  paris ' }]);
    expect(result.answers[0]!.isCorrect).toBe(true);
  });

  it('accepts numerical answers within tolerance', () => {
    const result = scoreQuiz([QUESTIONS[2]!], [{ questionId: 'q3', studentAnswer: '48.005' }]);
    expect(result.answers[0]!.isCorrect).toBe(true);
  });

  it('rejects numerical answers outside tolerance', () => {
    const result = scoreQuiz([QUESTIONS[2]!], [{ questionId: 'q3', studentAnswer: '50' }]);
    expect(result.answers[0]!.isCorrect).toBe(false);
  });

  it('treats a missing answer as incorrect, not an error', () => {
    const result = scoreQuiz(QUESTIONS, []);
    expect(result.correctCount).toBe(0);
    expect(result.scorePercent).toBe(0);
  });

  it('returns 0% for a quiz with zero questions', () => {
    const result = scoreQuiz([], []);
    expect(result.scorePercent).toBe(0);
    expect(result.totalCount).toBe(0);
  });
});
