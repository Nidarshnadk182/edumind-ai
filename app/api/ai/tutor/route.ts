import { NextResponse } from 'next/server';
import { aiTutorMessageSchema } from '@/lib/validations/schemas';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { getAiProvider } from '@/lib/ai/provider';
import type { ApiResponse } from '@/types/database';

const MODE_INSTRUCTIONS: Record<string, string> = {
  explain: 'Explain the concept clearly and concisely.',
  simplify: 'Simplify the explanation using plain language and short sentences.',
  example: 'Give one concrete worked example.',
  eli10: 'Explain this as if the student were 10 years old using an everyday analogy.',
  beginner: 'Answer at beginner level. Define technical terms.',
  intermediate: 'Answer at intermediate level, assuming foundational knowledge.',
  advanced: 'Answer at advanced level using precise technical language.',
  practice_questions: 'Generate three short practice questions with answers.',
  summarise: 'Summarise the answer in two or three sentences.',
  follow_up: 'Ask one follow-up question to check understanding.',
};

const SYSTEM_PROMPT = `You are EduMind AI Tutor, a patient academic assistant.
Give accurate, focused educational answers appropriate to the student's level.
Use headings and short paragraphs when useful.
Do not invent facts, references, page numbers, or citations.
If source material is supplied, distinguish source-grounded content from general model knowledge.
Keep normal tutor answers under 350 words unless detailed notes are requested.`;

function readableError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown AI error';
  if (/timeout|aborted/i.test(message)) return 'The AI model took too long to answer. Try the fast cloud provider or a shorter question.';
  if (/fetch failed|connect|ECONNREFUSED/i.test(message)) return 'The AI provider is not reachable. Check the provider settings and try again.';
  return message;
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Not authenticated', code: 'UNAUTHENTICATED' } },
      { status: 401 }
    );
  }

  const rate = checkRateLimit(`ai-tutor:${session.id}`);
  if (!rate.allowed) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Rate limit exceeded. Please try again later.', code: 'RATE_LIMITED' } },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = aiTutorMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Invalid tutor request', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  try {
    const provider = await getAiProvider();
    const modeInstruction = MODE_INSTRUCTIONS[parsed.data.mode] ?? MODE_INSTRUCTIONS.explain;
    const languageInstruction = parsed.data.responseLanguage === 'en'
      ? 'Respond in English.'
      : `Respond in language code ${parsed.data.responseLanguage}.`;

    const aiRequest = {
      systemPrompt: `${SYSTEM_PROMPT}\n\n${modeInstruction}\n${languageInstruction}`,
      messages: [{ role: 'user' as const, content: parsed.data.message }],
      maxTokens: parsed.data.mode === 'practice_questions' ? 550 : 350,
      temperature: 0.2,
      task: 'tutor' as const,
    };

    const wantsStream = request.headers.get('accept')?.includes('text/plain');
    if (wantsStream && provider.stream) {
      const stream = await provider.stream(aiRequest);
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-AI-Provider': provider.name,
        },
      });
    }

    const result = await provider.complete(aiRequest);
    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        isDemoResponse: result.isDemoResponse,
        model: result.model,
        provider: provider.name,
      },
    });
  } catch (error) {
    console.error('AI tutor error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: readableError(error), code: 'AI_PROVIDER_ERROR' } },
      { status: 502 }
    );
  }
}
