import { NextResponse } from 'next/server';
import { contentReviewSchema } from '@/lib/validations/schemas';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/database/supabase-server';
import type { ApiResponse } from '@/types/database';

async function requireTeacherApi() {
  const session = await getSessionUser();
  if (!session) return { error: NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 }) };
  if (session.profile.role !== 'teacher') return { error: NextResponse.json({ success: false, error: { message: 'Teacher access required' } }, { status: 403 }) };
  return { session };
}

export async function GET() {
  const auth = await requireTeacherApi();
  if ('error' in auth) return auth.error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Database not configured. Demo review items are intentionally disabled.', code: 'DATABASE_NOT_CONFIGURED' } }, { status: 503 });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('learning_materials')
    .select('id,title,content,approval_status,created_at,topics(name),teacher_profiles!learning_materials_teacher_id_fkey(profile_id)')
    .in('approval_status', ['pending', 'revision_requested'])
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: error.message } }, { status: 500 });
  return NextResponse.json<ApiResponse<{ items: unknown[] }>>({ success: true, data: { items: data || [] } });
}

export async function POST(request: Request) {
  const auth = await requireTeacherApi();
  if ('error' in auth) return auth.error;
  if (!isSupabaseConfigured()) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Database not configured. The review was not saved.', code: 'DATABASE_NOT_CONFIGURED' } }, { status: 503 });
  }

  const parsed = contentReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: parsed.error.issues[0]?.message || 'Invalid request', code: 'VALIDATION_ERROR' } }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { materialId, decision, comment, recipientType, recipientIds } = parsed.data;
  const { data: material, error: materialError } = await supabase.from('learning_materials').select('id,title').eq('id', materialId).single();
  if (materialError || !material) return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Material not found' } }, { status: 404 });

  const { error: updateError } = await supabase.from('learning_materials').update({ approval_status: decision }).eq('id', materialId);
  if (updateError) return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Could not save review' } }, { status: 500 });

  const { error: reviewError } = await supabase.from('content_reviews').insert({
    material_id: materialId,
    reviewer_profile_id: auth.session.profile.id,
    decision,
    comment: comment || null,
  });
  if (reviewError) return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Review history could not be saved' } }, { status: 500 });

  let publications = 0;
  if (decision === 'approved' && recipientType && recipientIds.length) {
    const rows = recipientIds.map((recipientId) => ({ material_id: materialId, recipient_type: recipientType, recipient_id: recipientId, published_by: auth.session.profile.id }));
    const { error: publicationError } = await supabase.from('content_publications').upsert(rows, { onConflict: 'material_id,recipient_type,recipient_id' });
    if (publicationError) return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Approved, but publication failed' } }, { status: 500 });
    await supabase.from('learning_materials').update({ approval_status: 'published' }).eq('id', materialId);
    publications = rows.length;
  }

  await supabase.from('audit_logs').insert({ actor_profile_id: auth.session.profile.id, action: `content_${decision}`, entity_type: 'learning_material', entity_id: materialId, metadata: { recipientType, recipientIds, comment } });
  return NextResponse.json<ApiResponse<{ saved: true; publications: number }>>({ success: true, data: { saved: true, publications } });
}
