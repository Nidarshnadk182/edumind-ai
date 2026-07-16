// ─────────────────────────────────────────────────────────
// Anthropic Claude implementation of AiProvider.
// SERVER-ONLY: imported dynamically from provider.ts, and this
// file itself is only ever reached from API routes / server
// actions, never from client components.
// ─────────────────────────────────────────────────────────
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import type { AiProvider, AiCompletionRequest, AiCompletionResult } from './provider';

export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic';
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set. AnthropicProvider should not be instantiated.');
    }
    this.client = new Anthropic({ apiKey });
    this.model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: request.maxTokens ?? 1024,
      system: request.systemPrompt,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    const content = textBlock && 'text' in textBlock ? textBlock.text : '';

    return {
      content,
      isDemoResponse: false,
      model: this.model,
    };
  }
}
