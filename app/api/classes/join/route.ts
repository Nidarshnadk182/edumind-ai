import { NextResponse } from 'next/server';
import { classJoinSchema } from '@/lib/validations/schemas';
import { requireRole } from '@/lib/auth/session';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/database/supabase-server';
import type { ApiResponse } from '@/types/database';

export async function POST(request: Request) {
  const session = await requireRole(['student']).catch(() => null);
  if (!session) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Students only' } }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = classJoinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Invalid class code', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json<ApiResponse<{ joined: true }>>({ success: true, data: { joined: true } });
  }

  const supabase = createSupabaseServerClient();
  const { data: classRow } = await supabase
    .from('classes')
    .select('id')
    .eq('class_code', parsed.data.classCode.toUpperCase())
    .single();

  if (!classRow) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Class code not found' } }, { status: 404 });
  }

  const { data: studentProfile } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('profile_id', session.id)
    .single();

  const { error } = await supabase.from('class_members').insert({ class_id: classRow.id, student_id: studentProfile?.id });
  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Could not join class' } }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<{ joined: true }>>({ success: true, data: { joined: true } });
}
