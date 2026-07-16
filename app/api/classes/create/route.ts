import { NextResponse } from 'next/server';
import { classCreateSchema } from '@/lib/validations/schemas';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/database/supabase-server';
import type { ApiResponse } from '@/types/database';

function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(request: Request) {
  const session = await requireRole(['teacher']).catch(() => null);
  if (!session) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Teachers only' } }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = classCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  const classCode = generateClassCode();

  if (!isSupabaseConfigured()) {
    return NextResponse.json<ApiResponse<{ classCode: string }>>({ success: true, data: { classCode } });
  }

  const supabase = createSupabaseServerClient();
  const { data: teacherProfile } = await supabase
    .from('teacher_profiles')
    .select('id')
    .eq('profile_id', session.id)
    .single();

  const { data, error } = await supabase
    .from('classes')
    .insert({ name: parsed.data.name, subject_id: parsed.data.subjectId, teacher_id: teacherProfile?.id, class_code: classCode })
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Could not create class' } }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<typeof data>>({ success: true, data });
}
