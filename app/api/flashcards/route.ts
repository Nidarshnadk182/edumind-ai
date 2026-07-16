import { NextResponse } from 'next/server';
import { flashcardGenerationSchema } from '@/lib/validations/schemas';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { getAiProvider, isAiConfigured } from '@/lib/ai/provider';
import type { ApiResponse } from '@/types/database';

interface GeneratedCard {
  front: string;
  back: string;
}

const DEMO_CARDS: GeneratedCard[] = [
  { front: 'What is the WACC formula?', back: 'WACC = (E/V × Re) + (D/V × Rd × (1 - Tc))' },
  { front: 'Define opportunity cost.', back: 'The value of the next best alternative given up when making a choice.' },
  { front: 'What does NPV > 0 indicate?', back: 'The project is expected to add value and should generally be accepted.' },
];

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const rate = checkRateLimit(`flashcards:${session.id}`);
  if (!rate.allowed) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Rate limit exceeded', code: 'RATE_LIMITED' } },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = flashcardGenerationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  if (parsed.data.sourceType === 'manual' && parsed.data.cards) {
    return NextResponse.json<ApiResponse<{ cards: GeneratedCard[]; isDemoResponse: boolean }>>({
      success: true,
      data: { cards: parsed.data.cards, isDemoResponse: false },
    });
  }

  if (!isAiConfigured()) {
    return NextResponse.json<ApiResponse<{ cards: GeneratedCard[]; isDemoResponse: boolean }>>({
      success: true,
      data: { cards: DEMO_CARDS.slice(0, parsed.data.count), isDemoResponse: true },
    });
  }

  try {
    const provider = await getAiProvider();
    const result = await provider.complete({
      systemPrompt: `Generate exactly ${parsed.data.count} flashcards as a strict JSON array of {front, back} objects. No markdown, no prose.`,
      messages: [{ role: 'user', content: `Deck: ${parsed.data.deckTitle}` }],
      maxTokens: 900,
    });

    let cards: GeneratedCard[];
    try {
      cards = JSON.parse(result.content);
    } catch {
      cards = DEMO_CARDS.slice(0, parsed.data.count);
    }

    return NextResponse.json<ApiResponse<{ cards: GeneratedCard[]; isDemoResponse: boolean }>>({
      success: true,
      data: { cards, isDemoResponse: result.isDemoResponse },
    });
  } catch {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Flashcard generation is temporarily unavailable.' } },
      { status: 502 }
    );
  }
}
