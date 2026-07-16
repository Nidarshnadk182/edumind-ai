import 'server-only';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/database/supabase-server';

export interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  pageNumber: number | null;
  heading: string | null;
  similarity: number;
}

/**
 * Searches already-ingested chunks using a query embedding supplied by the configured embedding service.
 * The ingestion worker is intentionally provider-agnostic: store embeddings in document_chunks.embedding.
 */
export async function searchDocumentChunks(args: {
  queryEmbedding: number[];
  subjectId?: string;
  classId?: string;
  limit?: number;
}): Promise<RetrievedChunk[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: args.queryEmbedding,
    match_count: args.limit ?? 6,
    filter_subject_id: args.subjectId ?? null,
    filter_class_id: args.classId ?? null,
  });
  if (error) throw new Error(`Vector search failed: ${error.message}`);
  return (data ?? []).map((row: any) => ({
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    pageNumber: row.page_number,
    heading: row.heading,
    similarity: row.similarity,
  }));
}
