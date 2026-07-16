export interface AiMessageInput {
  role: 'user' | 'assistant';
  content: string;
}

export type AiTask = 'tutor' | 'notes' | 'quiz' | 'flashcards' | 'study_plan' | 'general';

export interface AiCompletionRequest {
  systemPrompt: string;
  messages: AiMessageInput[];
  maxTokens?: number;
  temperature?: number;
  responseFormat?: 'text' | 'json';
  task?: AiTask;
}

export interface AiCompletionResult {
  content: string;
  isDemoResponse: boolean;
  model: string;
}

export interface AiProvider {
  readonly name: string;
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
  stream?(request: AiCompletionRequest): Promise<ReadableStream<Uint8Array>>;
  health?(): Promise<{ ok: boolean; model: string; detail?: string }>;
}

export function isAiConfigured(): boolean {
  if (process.env.AI_DEMO_MODE === 'true') return false;

  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();
  if (provider === 'ollama') return Boolean(process.env.LLM_BASE_URL || 'http://localhost:11434');
  if (provider === 'openai-compatible' || provider === 'vllm' || provider === 'openai' || provider === 'gemini') {
    return Boolean(process.env.LLM_BASE_URL && process.env.LLM_API_KEY);
  }
  if (provider === 'anthropic') return Boolean(process.env.ANTHROPIC_API_KEY);
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.LLM_BASE_URL);
}

/** Returns the configured provider while keeping all secrets server-side. */
export async function getAiProvider(): Promise<AiProvider> {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();

  if (provider === 'ollama' && isAiConfigured()) {
    const { OllamaProvider } = await import('./providers/ollama-provider');
    return new OllamaProvider();
  }

  if (['openai-compatible', 'vllm', 'openai', 'gemini'].includes(provider) && isAiConfigured()) {
    const { OpenAiCompatibleProvider } = await import('./openai-compatible-provider');
    return new OpenAiCompatibleProvider();
  }

  if ((provider === 'anthropic' || !provider) && isAiConfigured()) {
    const { AnthropicProvider } = await import('./anthropic-provider');
    return new AnthropicProvider();
  }

  const { DemoProvider } = await import('./demo-provider');
  return new DemoProvider();
}
