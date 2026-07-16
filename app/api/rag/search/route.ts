import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth/session';
import { searchDocumentChunks } from '@/lib/rag/search';

const schema = z.object({
  queryEmbedding: z.array(z.number()).min(8),
  subjectId: z.string().uuid().optional(),
  classId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(12).optional(),
});

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: { message: 'Invalid vector-search request' } }, { status: 400 });

  try {
    const chunks = await searchDocumentChunks(parsed.data);
    return NextResponse.json({ success: true, data: chunks });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : 'Search failed' } }, { status: 500 });
  }
}
