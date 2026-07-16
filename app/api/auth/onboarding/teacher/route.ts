import { NextResponse } from 'next/server';
import { teacherOnboardingSchema } from '@/lib/validations/schemas';
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
  const parsed = teacherOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Invalid onboarding data', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json<ApiResponse<{ demo: true }>>({ success: true, data: { demo: true } });
  }

  const supabase = createSupabaseServerClient();
  const { data } = parsed;

  const { error } = await supabase.from('teacher_profiles').upsert(
    {
      profile_id: session.id,
      subjects_taught: data.subjectsTaught,
      grade_or_class: data.gradeOrClass,
      teaching_objectives: data.teachingObjectives,
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
