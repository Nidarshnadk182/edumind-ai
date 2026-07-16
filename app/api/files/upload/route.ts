import { NextResponse } from 'next/server';
import { fileUploadMetadataSchema } from '@/lib/validations/schemas';
import { getSessionUser } from '@/lib/auth/session';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/database/supabase-server';
import type { ApiResponse } from '@/types/database';

/**
 * Accepts file metadata for a previously-uploaded file (actual bytes go to
 * Supabase Storage from the client using a signed URL — not implemented in
 * this MVP). Extraction is MOCKED here: real PDF/DOCX/PPTX parsers can be
 * plugged into lib/database/file-extraction.ts (see TODO below) without
 * changing this route's contract.
 */
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = fileUploadMetadataSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Invalid file metadata', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  // MOCK extraction — clearly labelled. TODO: connect a real parser
  // (e.g. pdf-parse, mammoth, or a cloud OCR service) here.
  const mockExtractedText = `[Mock extraction] This is placeholder text standing in for the real content of "${parsed.data.fileName}". Connect a real parser in lib/database/file-extraction.ts to replace this.`;

  if (!isSupabaseConfigured()) {
    return NextResponse.json<ApiResponse<{ extractionStatus: string; mockExtractedText: string }>>({
      success: true,
      data: { extractionStatus: 'mock_extracted', mockExtractedText },
    });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('uploaded_files')
    .insert({
      owner_id: session.id,
      file_name: parsed.data.fileName,
      file_type: parsed.data.fileType,
      storage_path: `uploads/${session.id}/${parsed.data.fileName}`,
      size_bytes: parsed.data.sizeBytes,
      extraction_status: 'mock_extracted',
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Could not save file metadata' } }, { status: 500 });
  }

  return NextResponse.json<ApiResponse<{ file: typeof data; mockExtractedText: string }>>({
    success: true,
    data: { file: data, mockExtractedText },
  });
}
