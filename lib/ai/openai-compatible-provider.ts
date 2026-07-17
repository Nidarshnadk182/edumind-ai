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
  error?: {
    message?: string;
    code?: string | number;
    type?: string;
  };
}

export class OpenAiCompatibleProvider implements AiProvider {
  readonly name: string;

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fastModel: string;
  private readonly deepModel: string;
  private readonly timeoutMs: number;
  private readonly appUrl: string;

  constructor() {
    this.baseUrl = (process.env.LLM_BASE_URL ?? "")
      .trim()
      .replace(/\/+$/, "");

    this.apiKey = (process.env.LLM_API_KEY ?? "").trim();

    this.fastModel = (
      process.env.LLM_FAST_MODEL ??
      process.env.LLM_MODEL ??
      "openrouter/free"
    ).trim();

    this.deepModel = (
      process.env.LLM_DEEP_MODEL ??
      process.env.LLM_MODEL ??
      this.fastModel
    ).trim();

    const parsedTimeout = Number(process.env.LLM_TIMEOUT_MS ?? "120000");

    this.timeoutMs =
      Number.isFinite(parsedTimeout) && parsedTimeout > 0
        ? parsedTimeout
        : 120000;

    this.name = (
      process.env.LLM_PROVIDER ?? "openai-compatible"
    ).trim();

    this.appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ??
      "https://edumind-ai-five.vercel.app"
    ).trim();
  }

  private chooseModel(request: AiCompletionRequest): string {
    switch (request.task) {
      case "tutor":
      case "flashcards":
      case "general":
        return this.fastModel;

      default:
        return this.deepModel;
    }
  }

  private validateConfiguration(): void {
    if (!this.baseUrl) {
      throw new Error(
        "LLM_BASE_URL is missing. Add it in Vercel Environment Variables."
      );
    }

    if (!this.apiKey) {
      throw new Error(
        "LLM_API_KEY is missing. Add the provider API key in Vercel Environment Variables."
      );
    }

    if (!this.fastModel) {
      throw new Error(
        "LLM_FAST_MODEL or LLM_MODEL is missing."
      );
    }
  }

  async health(): Promise<{
    ok: boolean;
    model: string;
    detail?: string;
  }> {
    const hasBaseUrl = Boolean(this.baseUrl);
    const hasApiKey = Boolean(this.apiKey);
    const hasModel = Boolean(this.fastModel);

    return {
      ok: hasBaseUrl && hasApiKey && hasModel,
      model: this.fastModel || "Not configured",
      detail: [
        `Provider: ${this.name}`,
        `Base URL configured: ${hasBaseUrl}`,
        `API key configured: ${hasApiKey}`,
        `Model configured: ${hasModel}`,
      ].join("; "),
    };
  }

  async complete(
    request: AiCompletionRequest
  ): Promise<AiCompletionResult> {
    this.validateConfiguration();

    const model = this.chooseModel(request);

    const requestBody: Record<string, unknown> = {
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
    };

    if (request.responseFormat === "json") {
      requestBody.response_format = {
        type: "json_object",
      };
    }

    let response: Response;

    try {
      response = await fetch(
        `${this.baseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
            "HTTP-Referer": this.appUrl,
            "X-Title": "EduMind AI",
          },
          body: JSON.stringify(requestBody),
          cache: "no-store",
          signal: AbortSignal.timeout(this.timeoutMs),
        }
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown network error";

      throw new Error(
        `Unable to reach the LLM provider: ${message}`
      );
    }

    const rawResponse = await response.text();

    let payload: ChatPayload | null = null;

    if (rawResponse) {
      try {
        payload = JSON.parse(rawResponse) as ChatPayload;
      } catch {
        payload = null;
      }
    }

    if (!response.ok) {
      const providerMessage =
        payload?.error?.message ??
        rawResponse.slice(0, 500) ??
        "Unknown provider error";

      throw new Error(
        `LLM provider returned ${response.status}: ${providerMessage}`
      );
    }

    if (!payload) {
      throw new Error(
        "The LLM provider returned an invalid JSON response."
      );
    }

    const content =
      payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error(
        "The LLM provider returned an empty response."
      );
    }

    return {
      content,
      isDemoResponse: false,
      model: payload.model ?? model,
    };
  }
}
