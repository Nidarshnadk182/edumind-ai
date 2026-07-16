import { NextResponse } from 'next/server';
import { notesGenerationSchema } from '@/lib/validations/schemas';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { getAiProvider } from '@/lib/ai/provider';
import type { ApiResponse } from '@/types/database';

const LENGTH_INSTRUCTION: Record<string, string> = {
  short: 'Produce concise short revision notes (bullet points, under 200 words).',
  detailed: 'Produce detailed notes including key definitions, formulas, and examples (400-700 words).',
  exam_focused: 'Produce exam-focused notes: key takeaways, likely exam questions, and formulas only.',
};

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Not authenticated' } },
      { status: 401 }
    );
  }

  const rate = checkRateLimit(`notes:${session.id}`);
  if (!rate.allowed) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Rate limit exceeded', code: 'RATE_LIMITED' } },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = notesGenerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  const { data } = parsed;
  if (data.sourceType === 'text' && !data.sourceText) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'sourceText is required for sourceType "text"' } },
      { status: 400 }
    );
  }

  try {
    const provider = await getAiProvider();
    const result = await provider.complete({
      systemPrompt: `You are EduMind AI's notes generator. ${LENGTH_INSTRUCTION[data.length]} Write at a ${data.difficulty} difficulty level, in language code "${data.language}". Structure with clear headings.`,
      messages: [
        {
          role: 'user',
          content: data.sourceText ?? 'Generate notes for the selected topic.',
        },
      ],
      maxTokens: 1200,
    });

    return NextResponse.json<ApiResponse<{ content: string; isDemoResponse: boolean }>>({
      success: true,
      data: { content: result.content, isDemoResponse: result.isDemoResponse },
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Notes generation is temporarily unavailable.' } },
      { status: 502 }
    );
  }
}
