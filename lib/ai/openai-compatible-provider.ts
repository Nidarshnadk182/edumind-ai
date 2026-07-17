import type {
  AiCompletionRequest,
  AiCompletionResult,
  AiProvider,
} from "./provider";

interface ChatPayload {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class OpenAiCompatibleProvider implements AiProvider {
  readonly name: string;

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fastModel: string;
  private readonly deepModel: string;
  private readonly timeoutMs: number;

  constructor() {
    this.baseUrl = (process.env.LLM_BASE_URL ?? "").trim().replace(/\/$/, "");
    this.apiKey = (process.env.LLM_API_KEY ?? "").trim();

    this.fastModel =
      process.env.LLM_FAST_MODEL ??
      process.env.LLM_MODEL ??
      "openai/gpt-4.1-mini";

    this.deepModel =
      process.env.LLM_DEEP_MODEL ??
      process.env.LLM_MODEL ??
      this.fastModel;

    this.timeoutMs = Number(process.env.LLM_TIMEOUT_MS ?? 120000);

    this.name = process.env.LLM_PROVIDER ?? "openai-compatible";
  }

  private chooseModel(request: AiCompletionRequest) {
    switch (request.task) {
      case "tutor":
      case "flashcards":
      case "general":
        return this.fastModel;

      default:
        return this.deepModel;
    }
  }

  async health() {
    return {
      ok: Boolean(this.baseUrl && this.apiKey),
      provider: this.name,
      model: this.fastModel,
      detail: {
        baseUrl: this.baseUrl,
        hasApiKey: Boolean(this.apiKey),
        keyPrefix: this.apiKey
          ? this.apiKey.substring(0, 8)
          : null,
      },
    };
  }

  async complete(
    request: AiCompletionRequest
  ): Promise<AiCompletionResult> {
    if (!this.baseUrl) {
      throw new Error("LLM_BASE_URL is missing.");
    }

    if (!this.apiKey) {
      throw new Error("LLM_API_KEY is missing.");
    }

    const model = this.chooseModel(request);

    const response = await fetch(
      `${this.baseUrl}/chat/completions`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",

          // Optional but recommended by OpenRouter
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL ??
            "https://edumind-ai-five.vercel.app",

          "X-Title": "EduMind AI",
        },

        body: JSON.stringify({
          model,

          messages: [
            {
              role: "system",
              content: request.systemPrompt,
            },
            ...request.messages,
          ],

          temperature: request.temperature ?? 0.2,

          max_tokens: request.maxTokens ?? 800,

          ...(request.responseFormat === "json"
            ? {
                response_format: {
                  type: "json_object",
                },
              }
            : {}),
        }),

        cache: "no-store",

        signal: AbortSignal.timeout(this.timeoutMs),
      }
    );

    if (!response.ok) {
      const text = await response.text();

      throw new Error(
        `LLM provider returned ${response.status}: ${text}`
      );
    }

    const payload = (await response.json()) as ChatPayload;

    const content =
      payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("LLM returned an empty response.");
    }

    return {
      content,
      model: payload.model ?? model,
      isDemoResponse: false,
    };
  }
}
