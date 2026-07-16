import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/database/supabase-server';

const schema = z.object({
  threadId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  attachmentPath: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ success: false, error: { message: 'Supabase is required for messaging.' } }, { status: 503 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: { message: 'Invalid message' } }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: membership } = await supabase
    .from('conversation_participants')
    .select('thread_id')
    .eq('thread_id', parsed.data.threadId)
    .eq('user_id', session.id)
    .maybeSingle();

  if (!membership) return NextResponse.json({ success: false, error: { message: 'You are not a participant in this thread.' } }, { status: 403 });

  const { data, error } = await supabase
    .from('messages')
    .insert({
      thread_id: parsed.data.threadId,
      sender_id: session.id,
      body: parsed.data.body,
      attachment_path: parsed.data.attachmentPath ?? null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  await supabase.from('conversation_threads').update({ last_message_at: new Date().toISOString() }).eq('id', parsed.data.threadId);
  return NextResponse.json({ success: true, data }, { status: 201 });
}
