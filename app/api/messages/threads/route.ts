import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/database/supabase-server';

const createThreadSchema = z.object({
  studentId: z.string().uuid(),
  participantIds: z.array(z.string().uuid()).min(1).max(5),
  classId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  title: z.string().min(2).max(150).optional(),
});

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ success: true, data: [] });

  const supabase = createSupabaseServerClient();
  const { data: memberships, error } = await supabase
    .from('conversation_participants')
    .select('thread_id, last_read_at, conversation_threads(*, messages(id, body, sender_id, created_at))')
    .eq('user_id', session.id)
    .order('last_message_at', { referencedTable: 'conversation_threads', ascending: false });

  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true, data: memberships ?? [] });
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ success: false, error: { message: 'Supabase is required for messaging.' } }, { status: 503 });

  const parsed = createThreadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: { message: 'Invalid thread request' } }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: thread, error } = await supabase
    .from('conversation_threads')
    .insert({
      student_id: parsed.data.studentId,
      class_id: parsed.data.classId ?? null,
      subject_id: parsed.data.subjectId ?? null,
      created_by: session.id,
      title: parsed.data.title ?? 'Progress discussion',
    })
    .select('*')
    .single();

  if (error || !thread) return NextResponse.json({ success: false, error: { message: error?.message || 'Could not create thread' } }, { status: 500 });

  const participantIds = Array.from(new Set([session.id, ...parsed.data.participantIds]));
  const { error: participantError } = await supabase
    .from('conversation_participants')
    .insert(participantIds.map((userId) => ({ thread_id: thread.id, user_id: userId })));

  if (participantError) return NextResponse.json({ success: false, error: { message: participantError.message } }, { status: 500 });
  return NextResponse.json({ success: true, data: thread }, { status: 201 });
}
