import type {
  AiCompletionRequest,
  AiCompletionResult,
  AiProvider,
} from "./provider";

interface ChatCompletionPayload {
  id?: string;
  model?: string;
  choices?: Array<{
    index?: number;
    finish_reason?: string | null;
    message?: {
      role?: string;
      content?: string | null;
    };
    delta?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
    code?: string | number;
    type?: string;
    status?: string;
  };
}

interface ProviderHealth {
  ok: boolean;
  model: string;
  detail?: string;
}

interface RequestOptions {
  stream?: boolean;
}

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 800;

export class OpenAiCompatibleProvider implements AiProvider {
  readonly name: string;

  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultModel: string;
  private readonly fastModel: string;
  private readonly deepModel: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly appUrl: string;
  private readonly appName: string;

  constructor() {
    this.baseUrl = removeTrailingSlashes(
      process.env.LLM_BASE_URL ?? ""
    );

    this.apiKey = (process.env.LLM_API_KEY ?? "").trim();

    this.defaultModel = (
      process.env.LLM_MODEL ?? ""
    ).trim();

    this.fastModel = (
      process.env.LLM_FAST_MODEL ??
      this.defaultModel
    ).trim();

    this.deepModel = (
      process.env.LLM_DEEP_MODEL ??
      this.defaultModel ??
      this.fastModel
    ).trim();

    this.timeoutMs = parsePositiveInteger(
      process.env.LLM_TIMEOUT_MS,
      DEFAULT_TIMEOUT_MS
    );

    this.maxRetries = parseNonNegativeInteger(
      process.env.LLM_MAX_RETRIES,
      DEFAULT_MAX_RETRIES
    );

    this.name = (
      process.env.LLM_PROVIDER ??
      "openai-compatible"
    ).trim();

    this.appUrl = (
      process.env.NEXT_PUBLIC_APP_URL ??
      "https://edumind-ai-five.vercel.app"
    ).trim();

    this.appName = (
      process.env.LLM_APP_NAME ??
      "EduMind AI"
    ).trim();
  }

  async health(): Promise<ProviderHealth> {
    const hasBaseUrl = Boolean(this.baseUrl);
    const hasApiKey = Boolean(this.apiKey);
    const hasModel = Boolean(
      this.fastModel ||
        this.deepModel ||
        this.defaultModel
    );

    return {
      ok: hasBaseUrl && hasApiKey && hasModel,
      model:
        this.fastModel ||
        this.deepModel ||
        this.defaultModel ||
        "Not configured",
      detail: [
        `Provider: ${this.name}`,
        `Base URL configured: ${hasBaseUrl}`,
        `API key configured: ${hasApiKey}`,
        `Fast model configured: ${Boolean(
          this.fastModel
        )}`,
        `Deep model configured: ${Boolean(
          this.deepModel
        )}`,
        `Timeout: ${this.timeoutMs}ms`,
        `Retries: ${this.maxRetries}`,
      ].join("; "),
    };
  }

  async complete(
    request: AiCompletionRequest
  ): Promise<AiCompletionResult> {
    this.validateConfiguration();

    const model = this.chooseModel(request);

    const response = await this.sendRequest(
      request,
      model,
      {
        stream: false,
      }
    );

    const rawResponse = await response.text();
    const payload =
      parseJson<ChatCompletionPayload>(rawResponse);

    if (!response.ok) {
      throw this.createProviderError(
        response.status,
        payload,
        rawResponse
      );
    }

    if (!payload) {
      throw new Error(
        "The AI provider returned an invalid JSON response."
      );
    }

    const content =
      payload.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error(
        "The AI provider returned an empty response."
      );
    }

    return {
      content,
      isDemoResponse: false,
      model: payload.model ?? model,
    };
  }

  async stream(
    request: AiCompletionRequest
  ): Promise<ReadableStream<Uint8Array>> {
    this.validateConfiguration();

    const model = this.chooseModel(request);

    const response = await this.sendRequest(
      request,
      model,
      {
        stream: true,
      }
    );

    if (!response.ok) {
      const rawResponse = await response.text();
      const payload =
        parseJson<ChatCompletionPayload>(rawResponse);

      throw this.createProviderError(
        response.status,
        payload,
        rawResponse
      );
    }

    if (!response.body) {
      throw new Error(
        "The AI provider returned no response stream."
      );
    }

    return this.transformServerSentEvents(
      response.body
    );
  }

  private chooseModel(
    request: AiCompletionRequest
  ): string {
    switch (request.task) {
      case "tutor":
      case "flashcards":
      case "general":
        return (
          this.fastModel ||
          this.defaultModel ||
          this.deepModel
        );

      case "quiz":
      case "assessment":
      case "prediction":
      case "rag":
        return (
          this.deepModel ||
          this.defaultModel ||
          this.fastModel
        );

      default:
        return (
          this.defaultModel ||
          this.fastModel ||
          this.deepModel
        );
    }
  }

  private validateConfiguration(): void {
    if (!this.baseUrl) {
      throw new Error(
        "LLM_BASE_URL is missing. Add it to the Vercel environment variables."
      );
    }

    if (!isValidHttpUrl(this.baseUrl)) {
      throw new Error(
        "LLM_BASE_URL must be a valid HTTP or HTTPS URL."
      );
    }

    if (!this.apiKey) {
      throw new Error(
        "LLM_API_KEY is missing. Add the AI provider API key to the Vercel environment variables."
      );
    }

    if (
      !this.defaultModel &&
      !this.fastModel &&
      !this.deepModel
    ) {
      throw new Error(
        "No AI model is configured. Add LLM_MODEL, LLM_FAST_MODEL or LLM_DEEP_MODEL."
      );
    }
  }

  private createRequestBody(
    request: AiCompletionRequest,
    model: string,
    options: RequestOptions
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model,
      messages: [
        {
          role: "system",
          content: request.systemPrompt,
        },
        ...request.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      temperature: clampNumber(
        request.temperature ?? 0.2,
        0,
        2
      ),
      max_tokens: request.maxTokens ?? 800,
      stream: options.stream ?? false,
    };

    if (request.responseFormat === "json") {
      body.response_format = {
        type: "json_object",
      };
    }

    return body;
  }

  private createHeaders(): Headers {
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    });

    /*
     * OpenRouter recommends these headers.
     * They are added only for OpenRouter so that Gemini and other
     * OpenAI-compatible providers receive a minimal request.
     */
    if (this.isOpenRouter()) {
      if (this.appUrl) {
        headers.set("HTTP-Referer", this.appUrl);
      }

      if (this.appName) {
        headers.set("X-Title", this.appName);
      }
    }

    return headers;
  }

  private async sendRequest(
    request: AiCompletionRequest,
    model: string,
    options: RequestOptions
  ): Promise<Response> {
    const endpoint = `${this.baseUrl}/chat/completions`;

    const requestBody = this.createRequestBody(
      request,
      model,
      options
    );

    let lastError: unknown;

    for (
      let attempt = 0;
      attempt <= this.maxRetries;
      attempt += 1
    ) {
      try {
        const response = await this.fetchWithTimeout(
          endpoint,
          {
            method: "POST",
            headers: this.createHeaders(),
            body: JSON.stringify(requestBody),
            cache: "no-store",
          }
        );

        if (
          !this.shouldRetryStatus(response.status) ||
          attempt === this.maxRetries
        ) {
          return response;
        }

        /*
         * Consume the failed response before retrying so the
         * underlying connection can be released.
         */
        await response.text().catch(() => "");

        await delay(
          this.calculateRetryDelay(
            attempt,
            response.headers.get("retry-after")
          )
        );
      } catch (error) {
        lastError = error;

        if (
          attempt === this.maxRetries ||
          !this.isRetryableNetworkError(error)
        ) {
          throw this.createNetworkError(error);
        }

        await delay(
          this.calculateRetryDelay(attempt)
        );
      }
    }

    throw this.createNetworkError(lastError);
  }

  private async fetchWithTimeout(
    url: string,
    init: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      return await fetch(url, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private shouldRetryStatus(
    status: number
  ): boolean {
    return (
      status === 408 ||
      status === 409 ||
      status === 425 ||
      status === 429 ||
      status >= 500
    );
  }

  private isRetryableNetworkError(
    error: unknown
  ): boolean {
    if (!(error instanceof Error)) {
      return true;
    }

    return /abort|timeout|fetch failed|network|socket|econnreset|econnrefused|enotfound/i.test(
      error.message
    );
  }

  private calculateRetryDelay(
    attempt: number,
    retryAfterHeader?: string | null
  ): number {
    const retryAfter =
      parseRetryAfter(retryAfterHeader);

    if (retryAfter !== null) {
      return Math.min(retryAfter, 15_000);
    }

    const exponentialDelay =
      RETRY_BASE_DELAY_MS * 2 ** attempt;

    const randomJitter = Math.floor(
      Math.random() * 300
    );

    return Math.min(
      exponentialDelay + randomJitter,
      10_000
    );
  }

  private createProviderError(
    status: number,
    payload: ChatCompletionPayload | null,
    rawResponse: string
  ): Error {
    const providerMessage =
      payload?.error?.message ??
      sanitiseProviderResponse(rawResponse) ??
      "Unknown AI provider error";

    const code = payload?.error?.code;
    const type = payload?.error?.type;

    const details = [
      `AI provider returned HTTP ${status}`,
      code !== undefined
        ? `code: ${String(code)}`
        : null,
      type ? `type: ${type}` : null,
      providerMessage,
    ]
      .filter(Boolean)
      .join("; ");

    if (status === 401 || status === 403) {
      return new Error(
        `AI provider authentication failed. ${details}`
      );
    }

    if (status === 404) {
      return new Error(
        `The configured AI model or endpoint was not found. ${details}`
      );
    }

    if (status === 429) {
      return new Error(
        `The AI provider quota or rate limit was reached. ${details}`
      );
    }

    if (status >= 500) {
      return new Error(
        `The AI provider is temporarily unavailable. ${details}`
      );
    }

    return new Error(details);
  }

  private createNetworkError(
    error: unknown
  ): Error {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      return new Error(
        `The AI provider request timed out after ${this.timeoutMs}ms.`
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unknown network error";

    return new Error(
      `Unable to reach the AI provider: ${message}`
    );
  }

  private transformServerSentEvents(
    source: ReadableStream<Uint8Array>
  ): ReadableStream<Uint8Array> {
    const reader = source.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    let buffer = "";

    return new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          while (true) {
            const { done, value } =
              await reader.read();

            if (done) {
              buffer += decoder.decode();

              const finalText =
                extractStreamContent(buffer);

              if (finalText) {
                controller.enqueue(
                  encoder.encode(finalText)
                );
              }

              controller.close();
              return;
            }

            buffer += decoder.decode(value, {
              stream: true,
            });

            const {
              content,
              remainingBuffer,
            } = processSseBuffer(buffer);

            buffer = remainingBuffer;

            if (content) {
              controller.enqueue(
                encoder.encode(content)
              );

              return;
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },

      async cancel(reason) {
        await reader.cancel(reason);
      },
    });
  }

  private isOpenRouter(): boolean {
    return this.baseUrl
      .toLowerCase()
      .includes("openrouter.ai");
  }
}

function processSseBuffer(buffer: string): {
  content: string;
  remainingBuffer: string;
} {
  const lines = buffer.split(/\r?\n/);
  const hasCompleteLastLine =
    buffer.endsWith("\n");

  const remainingBuffer = hasCompleteLastLine
    ? ""
    : (lines.pop() ?? "");

  let content = "";

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (
      !trimmedLine ||
      !trimmedLine.startsWith("data:")
    ) {
      continue;
    }

    const data = trimmedLine
      .slice("data:".length)
      .trim();

    if (!data || data === "[DONE]") {
      continue;
    }

    const payload =
      parseJson<ChatCompletionPayload>(data);

    const chunk =
      payload?.choices?.[0]?.delta?.content;

    if (typeof chunk === "string") {
      content += chunk;
    }
  }

  return {
    content,
    remainingBuffer,
  };
}

function extractStreamContent(
  buffer: string
): string {
  return processSseBuffer(
    `${buffer}\n`
  ).content;
}

function parseJson<T>(
  value: string
): T | null {
  if (!value.trim()) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function sanitiseProviderResponse(
  value: string
): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html")
  ) {
    return "The provider returned an unexpected HTML response.";
  }

  return trimmed.slice(0, 500);
}

function removeTrailingSlashes(
  value: string
): string {
  return value.trim().replace(/\/+$/, "");
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number
): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : fallback;
}

function parseNonNegativeInteger(
  value: string | undefined,
  fallback: number
): number {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= 0
    ? parsed
    : fallback;
}

function parseRetryAfter(
  value: string | null | undefined
): number | null {
  if (!value) {
    return null;
  }

  const seconds = Number(value);

  if (
    Number.isFinite(seconds) &&
    seconds >= 0
  ) {
    return seconds * 1000;
  }

  const retryDate = Date.parse(value);

  if (Number.isNaN(retryDate)) {
    return null;
  }

  return Math.max(retryDate - Date.now(), 0);
}

function clampNumber(
  value: number,
  minimum: number,
  maximum: number
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum
  );
}

function isValidHttpUrl(
  value: string
): boolean {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function delay(
  milliseconds: number
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
