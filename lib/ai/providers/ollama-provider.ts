import type { AiCompletionRequest, AiCompletionResult, AiProvider } from '../provider';

interface OllamaChatResponse {
  model?: string;
  message?: { content?: string };
  done?: boolean;
  error?: string;
}

export class OllamaProvider implements AiProvider {
  readonly name = 'ollama';
  private readonly baseUrl: string;
  private readonly fastModel: string;
  private readonly deepModel: string;
  private readonly timeoutMs: number;
  private readonly keepAlive: string;
  private readonly numCtx: number;

  constructor() {
    this.baseUrl = (process.env.LLM_BASE_URL || 'http://localhost:11434')
      .replace(/\/v1\/?$/, '')
      .replace(/\/$/, '');
    this.fastModel = process.env.LLM_FAST_MODEL || process.env.LLM_MODEL || 'qwen3:4b';
    this.deepModel = process.env.LLM_DEEP_MODEL || process.env.LLM_MODEL || 'qwen3:8b';
    this.timeoutMs = Number(process.env.LLM_TIMEOUT_MS || 180000);
    this.keepAlive = process.env.OLLAMA_KEEP_ALIVE || '30m';
    this.numCtx = Number(process.env.OLLAMA_NUM_CTX || 4096);
  }

  private chooseModel(request: AiCompletionRequest): string {
    return request.task === 'tutor' || request.task === 'flashcards' || request.task === 'general'
      ? this.fastModel
      : this.deepModel;
  }

  async health() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) return { ok: false, model: this.fastModel, detail: `HTTP ${response.status}` };
      const payload = await response.json();
      const names: string[] = (payload.models || []).map((m: { name?: string }) => m.name).filter(Boolean);
      return {
        ok: names.some((name) => name === this.fastModel || name.startsWith(`${this.fastModel}:`)),
        model: this.fastModel,
        detail: names.length ? `Installed: ${names.join(', ')}` : 'No models installed',
      };
    } catch (error) {
      return { ok: false, model: this.fastModel, detail: error instanceof Error ? error.message : 'Ollama unavailable' };
    } finally {
      clearTimeout(timer);
    }
  }

  private buildBody(request: AiCompletionRequest, stream: boolean) {
    const model = this.chooseModel(request);
    return {
      model,
      messages: [
        {
          role: 'system',
          content: `${request.systemPrompt}\n\nAnswer directly. Do not reveal hidden reasoning or chain-of-thought.`,
        },
        ...request.messages,
      ],
      stream,
      think: false,
      keep_alive: this.keepAlive,
      format: request.responseFormat === 'json' ? 'json' : undefined,
      options: {
        temperature: request.temperature ?? 0.2,
        num_predict: request.maxTokens ?? 450,
        num_ctx: this.numCtx,
      },
    };
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const model = this.chooseModel(request);
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.buildBody(request, false)),
      signal: AbortSignal.timeout(this.timeoutMs),
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Ollama returned ${response.status}: ${detail.slice(0, 400)}`);
    }

    const payload = (await response.json()) as OllamaChatResponse;
    if (payload.error) throw new Error(payload.error);
    const content = payload.message?.content?.trim();
    if (!content) throw new Error('Ollama returned an empty response.');
    return { content, isDemoResponse: false, model: payload.model || model };
  }

  async stream(request: AiCompletionRequest): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.buildBody(request, true)),
      signal: AbortSignal.timeout(this.timeoutMs),
      cache: 'no-store',
    });

    if (!response.ok || !response.body) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Ollama returned ${response.status}: ${detail.slice(0, 400)}`);
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';

    return response.body.pipeThrough(
      new TransformStream<Uint8Array, Uint8Array>({
        transform(chunk, controller) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const payload = JSON.parse(line) as OllamaChatResponse;
              if (payload.error) throw new Error(payload.error);
              const text = payload.message?.content;
              if (text) controller.enqueue(encoder.encode(text));
            } catch (error) {
              controller.error(error);
              return;
            }
          }
        },
        flush(controller) {
          if (!buffer.trim()) return;
          try {
            const payload = JSON.parse(buffer) as OllamaChatResponse;
            const text = payload.message?.content;
            if (text) controller.enqueue(encoder.encode(text));
          } catch {
            // Ignore a trailing incomplete JSON fragment.
          }
        },
      })
    );
  }
}
