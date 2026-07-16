import { NextResponse } from 'next/server';
import { studentOnboardingSchema } from '@/lib/validations/schemas';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/database/supabase-server';
import type { ApiResponse } from '@/types/database';

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Not authenticated', code: 'UNAUTHENTICATED' } },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = studentOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Invalid onboarding data', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  // Demo mode: accept and no-op — nothing to persist without a database.
  if (!isSupabaseConfigured()) {
    return NextResponse.json<ApiResponse<{ demo: true }>>({ success: true, data: { demo: true } });
  }

  const supabase = createSupabaseServerClient();
  const { data } = parsed;

  const { error } = await supabase.from('student_profiles').upsert(
    {
      profile_id: session.id,
      education_level: data.educationLevel,
      subjects: data.subjects,
      learning_goals: data.learningGoals,
      preferred_learning_style: data.preferredLearningStyle,
      daily_study_minutes: data.dailyStudyMinutes,
      exam_date: data.examDate ?? null,
    },
    { onConflict: 'profile_id' }
  );

  if (error) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Could not save onboarding profile' } },
      { status: 500 }
    );
  }

  return NextResponse.json<ApiResponse<{ saved: true }>>({ success: true, data: { saved: true } });
}
