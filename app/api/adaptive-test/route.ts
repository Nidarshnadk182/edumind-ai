import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';

const schema = z.object({
  topic: z.string().min(2).max(200),
  masteryScore: z.number().min(0).max(100),
  recentAccuracy: z.number().min(0).max(100),
  questionCount: z.number().int().min(3).max(30).default(10),
});

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: { message: 'Invalid adaptive-test request' } }, { status: 400 });

  const { masteryScore, recentAccuracy, questionCount, topic } = parsed.data;
  const level = masteryScore < 40 ? 'foundation' : masteryScore < 70 ? 'application' : 'advanced';
  const conceptualShare = level === 'foundation' ? 65 : level === 'application' ? 40 : 25;
  const applicationShare = level === 'foundation' ? 25 : level === 'application' ? 40 : 35;
  const analysisShare = 100 - conceptualShare - applicationShare;

  return NextResponse.json({
    success: true,
    data: {
      topic,
      level,
      questionCount,
      distribution: {
        recallAndUnderstanding: conceptualShare,
        application: applicationShare,
        analysisAndEvaluation: analysisShare,
      },
      difficultyAdjustment: recentAccuracy >= 80 ? 'increase' : recentAccuracy < 50 ? 'decrease' : 'maintain',
      guidance: masteryScore < 40
        ? 'Begin with diagnostic questions and provide corrective explanations after each error.'
        : masteryScore < 70
          ? 'Use mixed conceptual and applied questions with immediate feedback.'
          : 'Use case-based, timed, and higher-order questions.',
    },
  });
}
