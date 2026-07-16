// ─────────────────────────────────────────────────────────
// Demo AI provider. Returns clearly-labelled mock responses so
// the entire application remains testable with zero API keys.
// Automatically selected by getAiProvider() in provider.ts.
// ─────────────────────────────────────────────────────────
import type { AiProvider, AiCompletionRequest, AiCompletionResult } from './provider';

const CANNED_RESPONSES = [
  "Here's a simplified explanation: think of this concept as a set of building blocks — each one depends on the previous. Once the base idea clicks, the rest follows logically. (Demo response — connect ANTHROPIC_API_KEY for live AI answers.)",
  "Good question. In brief: the core idea is about trade-offs — improving one factor often comes at the cost of another. Try applying it to a real example from your notes to see the pattern. (Demo response — connect ANTHROPIC_API_KEY for live AI answers.)",
  "Let's break it into three steps: (1) identify the key variables, (2) understand how they relate, (3) apply the relationship to a sample problem. Want me to generate a practice question on this? (Demo response — connect ANTHROPIC_API_KEY for live AI answers.)",
];

export class DemoProvider implements AiProvider {
  readonly name = 'demo';

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    // Small artificial delay so the UI's typing indicator feels real.
    await new Promise((resolve) => setTimeout(resolve, 400));

    const lastUserMessage = [...request.messages].reverse().find((m) => m.role === 'user');
    const seed = (lastUserMessage?.content.length ?? 0) % CANNED_RESPONSES.length;

    return {
      content: CANNED_RESPONSES[seed] ?? CANNED_RESPONSES[0]!,
      isDemoResponse: true,
      model: 'demo-mode',
    };
  }
}
