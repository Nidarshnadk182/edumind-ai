import { describe, it, expect } from 'vitest';
import { studentOnboardingSchema, aiTutorMessageSchema, quizGenerationSchema } from '@/lib/validations/schemas';

describe('studentOnboardingSchema', () => {
  it('accepts a valid payload', () => {
    const result = studentOnboardingSchema.safeParse({
      fullName: 'Demo Student',
      educationLevel: 'MBA - Finance',
      subjects: ['Corporate Finance'],
      preferredLearningStyle: 'visual',
      dailyStudyMinutes: 45,
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty subjects array', () => {
    const result = studentOnboardingSchema.safeParse({
      fullName: 'Demo Student',
      educationLevel: 'MBA - Finance',
      subjects: [],
      preferredLearningStyle: 'visual',
      dailyStudyMinutes: 45,
    });
    expect(result.success).toBe(false);
  });

  it('rejects daily study minutes outside the allowed range', () => {
    const result = studentOnboardingSchema.safeParse({
      fullName: 'Demo Student',
      educationLevel: 'MBA - Finance',
      subjects: ['Corporate Finance'],
      preferredLearningStyle: 'visual',
      dailyStudyMinutes: 10000,
    });
    expect(result.success).toBe(false);
  });
});

describe('aiTutorMessageSchema', () => {
  it('defaults mode to "explain" when omitted', () => {
    const result = aiTutorMessageSchema.parse({ message: 'What is NPV?' });
    expect(result.mode).toBe('explain');
  });

  it('rejects an empty message', () => {
    const result = aiTutorMessageSchema.safeParse({ message: '' });
    expect(result.success).toBe(false);
  });
});

describe('quizGenerationSchema', () => {
  it('rejects zero questions', () => {
    const result = quizGenerationSchema.safeParse({
      sourceType: 'topic',
      questionTypes: ['mcq'],
      numQuestions: 0,
      difficulty: 'beginner',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an empty question-types array', () => {
    const result = quizGenerationSchema.safeParse({
      sourceType: 'topic',
      questionTypes: [],
      numQuestions: 5,
      difficulty: 'beginner',
    });
    expect(result.success).toBe(false);
  });
});
