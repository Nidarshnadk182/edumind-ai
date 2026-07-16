import type { AiCompletionRequest, AiCompletionResult, AiProvider } from './provider';

interface ChatPayload {
  model?: string;
  choices?: Array<{ message?: { content?: string } }>;
}

export class OpenAiCompatibleProvider implements AiProvider {
  readonly name: string;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fastModel: string;
  private readonly deepModel: string;
  private readonly timeoutMs: number;

  constructor() {
    this.baseUrl = (process.env.LLM_BASE_URL || '').replace(/\/$/, '');
    this.apiKey = process.env.LLM_API_KEY || '';
    this.fastModel = process.env.LLM_FAST_MODEL || process.env.LLM_MODEL || 'gpt-4.1-mini';
    this.deepModel = process.env.LLM_DEEP_MODEL || process.env.LLM_MODEL || this.fastModel;
    this.timeoutMs = Number(process.env.LLM_TIMEOUT_MS || 120000);
    this.name = process.env.LLM_PROVIDER || 'openai-compatible';
  }

  private chooseModel(request: AiCompletionRequest) {
    return request.task === 'tutor' || request.task === 'flashcards' || request.task === 'general'
      ? this.fastModel
      : this.deepModel;
  }

  async health() {
    return { ok: Boolean(this.baseUrl && this.apiKey), model: this.fastModel, detail: this.baseUrl || 'Missing base URL' };
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const model = this.chooseModel(request);
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: request.systemPrompt }, ...request.messages],
        max_tokens: request.maxTokens ?? 800,
        temperature: request.temperature ?? 0.2,
        response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`LLM provider returned ${response.status}: ${detail.slice(0, 400)}`);
    }

    const payload = (await response.json()) as ChatPayload;
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('LLM provider returned an empty response.');
    return { content, isDemoResponse: false, model: payload.model || model };
  }
}
