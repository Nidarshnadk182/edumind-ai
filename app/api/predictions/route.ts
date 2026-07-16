import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { predictPerformance } from '@/lib/prediction/engine';

const schema = z.object({
  quizAverage: z.number().min(0).max(100),
  masteryAverage: z.number().min(0).max(100),
  completionRate: z.number().min(0).max(100),
  attendanceRate: z.number().min(0).max(100).optional(),
  revisionConsistency: z.number().min(0).max(100),
  confidenceAccuracyGap: z.number().min(-100).max(100).optional(),
  inactivityDays: z.number().int().min(0).max(365).optional(),
  timedPracticeScore: z.number().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: 'Invalid prediction signals' } }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: predictPerformance(parsed.data) });
}
