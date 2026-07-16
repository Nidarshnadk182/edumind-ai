import { NextResponse } from 'next/server';
import { getAiProvider } from '@/lib/ai/provider';

export async function GET() {
  try {
    const provider = await getAiProvider();
    const health = provider.health
      ? await provider.health()
      : { ok: true, model: 'configured', detail: 'Health check not implemented for this provider.' };

    return NextResponse.json({
      success: health.ok,
      data: { provider: provider.name, ...health },
    }, { status: health.ok ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'AI health check failed' },
    }, { status: 503 });
  }
}
