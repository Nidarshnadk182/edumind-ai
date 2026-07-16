import { NextResponse } from 'next/server';
import { studyPlanGenerationSchema } from '@/lib/validations/schemas';
import { getSessionUser } from '@/lib/auth/session';
import type { ApiResponse } from '@/types/database';

interface PlannedTask {
  date: string;
  subject: string;
  taskType: 'study' | 'revision' | 'mock_test';
  durationMinutes: number;
}

function generatePlan(input: {
  examDate: string;
  subjects: string[];
  availableHoursPerDay: number;
  preferredSessionLength: number;
  daysUnavailable: string[];
}): PlannedTask[] {
  const tasks: PlannedTask[] = [];
  const today = new Date();
  const exam = new Date(input.examDate);
  const totalDays = Math.max(1, Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const unavailable = new Set(input.daysUnavailable);

  const revisionDays = new Set<number>();
  const mockTestDays = new Set<number>();
  // Last 3 days: revision. The day before that: mock test.
  for (let i = Math.max(0, totalDays - 3); i < totalDays; i++) revisionDays.add(i);
  if (totalDays >= 4) mockTestDays.add(totalDays - 4);

  let subjectIndex = 0;
  for (let d = 0; d < totalDays; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().slice(0, 10);
    if (unavailable.has(dateStr)) continue;

    const sessionsPerDay = Math.max(1, Math.floor((input.availableHoursPerDay * 60) / input.preferredSessionLength));

    for (let s = 0; s < sessionsPerDay; s++) {
      const taskType: PlannedTask['taskType'] = mockTestDays.has(d) ? 'mock_test' : revisionDays.has(d) ? 'revision' : 'study';
      const subject = input.subjects[subjectIndex % input.subjects.length]!;
      subjectIndex++;
      tasks.push({ date: dateStr, subject, taskType, durationMinutes: input.preferredSessionLength });
    }
  }

  return tasks;
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = studyPlanGenerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  const tasks = generatePlan(parsed.data);
  return NextResponse.json<ApiResponse<{ tasks: PlannedTask[] }>>({ success: true, data: { tasks } });
}
