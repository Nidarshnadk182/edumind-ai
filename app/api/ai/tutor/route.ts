import { NextResponse } from "next/server";
import { aiTutorMessageSchema } from "@/lib/validations/schemas";
import { getSessionUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { getAiProvider } from "@/lib/ai/provider";
import type { ApiResponse } from "@/types/database";

const MODE_INSTRUCTIONS: Record<string, string> = {
  explain: "Explain the concept clearly and concisely.",
  simplify:
    "Simplify the explanation using plain language and short sentences.",
  example: "Give one concrete worked example.",
  eli10:
    "Explain this as if the student were 10 years old using an everyday analogy.",
  beginner: "Answer at beginner level. Define technical terms.",
  intermediate:
    "Answer at intermediate level, assuming foundational knowledge.",
  advanced:
    "Answer at advanced level using precise technical language.",
  practice_questions:
    "Generate three short practice questions with answers.",
  summarise: "Summarise the answer in two or three sentences.",
  follow_up: "Ask one follow-up question to check understanding.",
};

const SYSTEM_PROMPT = `You are EduMind AI Tutor, a patient academic assistant.

Give accurate, focused educational answers appropriate to the student's level.
Use headings, short paragraphs and examples when useful.
Do not invent facts, references, page numbers or citations.
If source material is supplied, distinguish source-grounded content from general model knowledge.
Keep normal tutor answers under 350 words unless detailed notes are requested.`;

interface DemoTopic {
  keywords: string[];
  title: string;
  explanation: string;
  simpleExplanation: string;
  example: string;
  questions: string;
}

const DEMO_TOPICS: DemoTopic[] = [
  {
    keywords: [
      "heteroskedasticity",
      "heteroscedasticity",
      "white test",
      "breusch pagan",
    ],
    title: "Heteroskedasticity",
    explanation: `Heteroskedasticity occurs when the variance of the regression error term is not constant across observations.

For example, errors in predicting expenditure may be small for low-income households but much larger for high-income households.

### Why it matters

Ordinary Least Squares coefficient estimates may remain unbiased, but their standard errors can become unreliable. This can make t-tests, F-tests and confidence intervals misleading.

### Detection

Common methods include:

- Residual plots
- Breusch–Pagan test
- White test

### Remedies

Researchers may use heteroskedasticity-robust standard errors, transform variables, or reconsider the model specification.`,
    simpleExplanation: `Heteroskedasticity means the prediction errors in a regression do not have the same spread everywhere.

Imagine throwing darts at a target. At first, the darts are close together, but later they become widely scattered. The changing spread represents heteroskedasticity.

It mainly makes the regression's standard errors and hypothesis tests less reliable.`,
    example: `Suppose a regression predicts household expenditure from income.

For lower-income households, actual expenditure may differ from predicted expenditure by only ₹1,000–₹2,000. For higher-income households, the difference may be ₹20,000 or more.

Because the size of the errors increases with income, the model may have heteroskedasticity.`,
    questions: `### Practice questions

1. What is heteroskedasticity?
   **Answer:** It is a situation where the variance of regression errors is not constant.

2. Does heteroskedasticity necessarily make OLS coefficients biased?
   **Answer:** No. The coefficients may remain unbiased, but the standard errors can be unreliable.

3. Name two tests for heteroskedasticity.
   **Answer:** The Breusch–Pagan test and White test.`,
  },
  {
    keywords: ["option greek", "delta", "gamma", "theta", "vega", "rho"],
    title: "Option Greeks",
    explanation: `Option Greeks measure how the price of an option responds to changes in different factors.

- **Delta:** Change in option price for a change in the underlying asset price.
- **Gamma:** Change in delta when the underlying price changes.
- **Theta:** Loss in option value as time passes.
- **Vega:** Sensitivity to changes in volatility.
- **Rho:** Sensitivity to changes in interest rates.

Traders use the Greeks to understand and manage the risks of an options portfolio.`,
    simpleExplanation: `Option Greeks are like different sensors showing what can change an option's price.

Delta measures movement in the share price, theta measures the passage of time, vega measures volatility and rho measures interest rates.`,
    example: `Suppose a call option has a delta of 0.60.

If the underlying share price increases by ₹10, the option price is expected to increase by approximately:

0.60 × ₹10 = ₹6

This is an approximation because delta itself can change.`,
    questions: `### Practice questions

1. Which Greek measures time decay?
   **Answer:** Theta.

2. Which Greek measures sensitivity to volatility?
   **Answer:** Vega.

3. What does delta measure?
   **Answer:** The approximate change in option price for a one-unit change in the underlying price.`,
  },
  {
    keywords: ["put call parity", "put-call parity"],
    title: "Put–Call Parity",
    explanation: `Put–call parity describes the relationship between European call options, European put options, the underlying asset and a risk-free bond.

For a non-dividend-paying stock:

**C + PV(K) = P + S₀**

Where:

- C = call option price
- P = put option price
- S₀ = current stock price
- PV(K) = present value of the exercise price

If the relationship does not hold, an arbitrage opportunity may exist.`,
    simpleExplanation: `Put–call parity says that two portfolios producing the same future payoff should have the same value today.

A call plus enough safe money to pay the exercise price should equal a put plus the stock.`,
    example: `Suppose:

- Stock price = ₹100
- Present value of strike price = ₹92
- Call price = ₹15

Using C + PV(K) = P + S₀:

15 + 92 = P + 100

Therefore:

P = ₹7`,
    questions: `### Practice questions

1. Write the put–call parity equation.
   **Answer:** C + PV(K) = P + S₀.

2. To which options does standard put–call parity apply?
   **Answer:** European call and put options with the same strike and maturity.

3. What may happen if parity does not hold?
   **Answer:** An arbitrage opportunity may arise.`,
  },
  {
    keywords: ["wacc", "weighted average cost of capital"],
    title: "Weighted Average Cost of Capital",
    explanation: `WACC is the average return a company must provide to all its capital providers, weighted by the proportion of debt and equity in its capital structure.

The general formula is:

**WACC = (E/V × Ke) + (D/V × Kd × (1 − T))**

Where:

- E = market value of equity
- D = market value of debt
- V = E + D
- Ke = cost of equity
- Kd = cost of debt
- T = corporate tax rate

It is often used as the discount rate for projects having risk similar to the firm's existing operations.`,
    simpleExplanation: `A company usually obtains money from both shareholders and lenders.

WACC combines the return expected by shareholders and the interest expected by lenders into one overall percentage.`,
    example: `Suppose a company has:

- 60% equity with a cost of 12%
- 40% debt with an after-tax cost of 6%

WACC = (0.60 × 12%) + (0.40 × 6%)

WACC = 7.2% + 2.4% = **9.6%**`,
    questions: `### Practice questions

1. What does WACC represent?
   **Answer:** The weighted average return required by a company's debt and equity providers.

2. Why is debt adjusted for tax?
   **Answer:** Interest expense is generally tax-deductible, creating a tax shield.

3. When may WACC be used as a project discount rate?
   **Answer:** When the project's risk is similar to the firm's existing operations.`,
  },
  {
    keywords: ["forward contract", "futures contract", "forward and futures"],
    title: "Forward and Futures Contracts",
    explanation: `A forward contract is a private agreement between two parties to buy or sell an asset at a specified price on a future date.

A futures contract performs a similar function but is standardised and traded on an organised exchange.

### Main differences

- Forwards are customised; futures are standardised.
- Forwards have greater counterparty risk.
- Futures are marked to market daily.
- Futures normally require margin deposits.
- Forward contracts are generally settled at maturity.`,
    simpleExplanation: `Both contracts allow two parties to fix a price today for a transaction that will happen later.

A forward is privately negotiated. A futures contract is standardised and traded through an exchange.`,
    example: `An importer expects to pay US$100,000 after three months.

To avoid the risk of the dollar becoming more expensive, the importer can enter a forward contract fixing the exchange rate today.`,
    questions: `### Practice questions

1. Which contract is traded on an exchange?
   **Answer:** A futures contract.

2. Which contract is usually more customisable?
   **Answer:** A forward contract.

3. What does daily marking to market mean?
   **Answer:** Futures gains and losses are calculated and settled each trading day.`,
  },
  {
    keywords: ["porter five forces", "porter's five forces", "five forces"],
    title: "Porter's Five Forces",
    explanation: `Porter's Five Forces framework evaluates the competitive pressures affecting an industry's profitability.

The five forces are:

1. Rivalry among existing competitors
2. Threat of new entrants
3. Bargaining power of buyers
4. Bargaining power of suppliers
5. Threat of substitute products

A strong force usually puts pressure on prices, costs or profitability.`,
    simpleExplanation: `The framework examines five groups that can make it easier or harder for a company to earn profits: competitors, new firms, customers, suppliers and substitute products.`,
    example: `In the airline industry, rivalry is high because several airlines compete on price. Buyers can compare fares easily, and alternatives such as trains may act as substitutes on shorter routes.`,
    questions: `### Practice questions

1. What does high buyer power usually do?
   **Answer:** It puts pressure on companies to reduce prices or improve value.

2. Are substitute products necessarily direct competitors?
   **Answer:** No. They satisfy a similar customer need through a different solution.

3. What may create a barrier to entry?
   **Answer:** High capital requirements, regulation, brand loyalty or economies of scale.`,
  },
  {
    keywords: ["cross sectional", "cross-sectional", "panel data", "time series"],
    title: "Types of Data",
    explanation: `### Cross-sectional data

Cross-sectional data contains observations on many individuals, companies or regions at one point in time.

### Time-series data

Time-series data tracks one variable or entity over several time periods.

### Panel data

Panel data tracks multiple individuals or entities over multiple time periods. It therefore combines cross-sectional and time-series dimensions.`,
    simpleExplanation: `Cross-sectional data compares many subjects at one time. Time-series data follows one subject over time. Panel data follows many subjects over time.`,
    example: `- Salaries of 100 employees in 2026: cross-sectional data
- India's GDP from 2010 to 2026: time-series data
- Profits of 50 companies from 2020 to 2026: panel data`,
    questions: `### Practice questions

1. Data for 200 firms in a single year is what type?
   **Answer:** Cross-sectional data.

2. Monthly inflation for ten years is what type?
   **Answer:** Time-series data.

3. Annual profitability of 100 firms for five years is what type?
   **Answer:** Panel data.`,
  },
];

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findDemoTopic(message: string): DemoTopic | undefined {
  const normalisedMessage = normaliseText(message);

  return DEMO_TOPICS.find((topic) =>
    topic.keywords.some((keyword) =>
      normalisedMessage.includes(normaliseText(keyword))
    )
  );
}

function cleanQuestion(message: string): string {
  return message
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function createGenericDemoResponse(
  message: string,
  mode: string
): string {
  const question = cleanQuestion(message);

  if (mode === "practice_questions") {
    return `### Practice questions

Based on your question about **${question}**:

1. Define the main concept in your own words.
2. Give one practical or numerical example.
3. Explain why the concept is important in the subject.

### Suggested approach

Start with the definition, identify the main components, and then connect the concept to a real-world application.

> **Demo mode:** EduMind's live AI provider is temporarily unavailable, so these are structured revision prompts rather than a generated model response.`;
  }

  if (mode === "follow_up") {
    return `To check your understanding:

**How would you explain “${question}” to a classmate using one simple example?**

> **Demo mode:** The live AI provider is temporarily unavailable.`;
  }

  if (mode === "summarise") {
    return `### Quick summary

Your question concerns **${question}**. Focus on three elements while revising:

1. The meaning or definition
2. The mechanism or formula
3. A practical example or application

> **Demo mode:** A full subject-specific response will appear when the live AI provider is available.`;
  }

  return `### Let's understand the concept

You asked about:

**${question}**

A useful way to learn this topic is to break it into four parts:

1. **Definition:** What the concept means
2. **Components:** The important terms, variables or stages
3. **Application:** Where the concept is used
4. **Example:** A simple practical or numerical illustration

Try writing a two-sentence definition first, followed by one example from your notes. This helps identify the exact part that needs clarification.

> **Demo mode:** EduMind's live AI provider is temporarily unavailable. This structured response keeps the tutor functional without exposing a technical API error.`;
}

function createDemoResponse(message: string, mode: string): string {
  const topic = findDemoTopic(message);

  if (!topic) {
    return createGenericDemoResponse(message, mode);
  }

  let content: string;

  switch (mode) {
    case "simplify":
    case "eli10":
    case "beginner":
      content = topic.simpleExplanation;
      break;

    case "example":
      content = topic.example;
      break;

    case "practice_questions":
      content = topic.questions;
      break;

    case "summarise":
      content = topic.simpleExplanation;
      break;

    case "follow_up":
      content = `### Check your understanding

${topic.simpleExplanation}

**Follow-up question:** Can you explain ${topic.title.toLowerCase()} using an example from your subject?`;
      break;

    case "advanced":
    case "intermediate":
    case "explain":
    default:
      content = topic.explanation;
      break;
  }

  return `## ${topic.title}

${content}

> **Demo mode:** This answer was generated from EduMind's built-in academic knowledge because the live AI provider is currently unavailable.`;
}

function readableError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Unknown AI error";

  if (/timeout|aborted/i.test(message)) {
    return "The AI model took too long to answer.";
  }

  if (/401|authentication|authorization|api key/i.test(message)) {
    return "The AI provider could not authenticate the request.";
  }

  if (/429|quota|rate limit|insufficient_quota/i.test(message)) {
    return "The AI provider's free quota or rate limit was reached.";
  }

  if (/fetch failed|connect|ECONNREFUSED/i.test(message)) {
    return "The AI provider is currently unreachable.";
  }

  return message;
}

function createPlainTextResponse(
  content: string,
  provider: string,
  isDemoResponse: boolean
): Response {
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-AI-Provider": provider,
      "X-AI-Demo": String(isDemoResponse),
    },
  });
}

export async function POST(request: Request) {
  const session = await getSessionUser();

  if (!session) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message: "Not authenticated",
          code: "UNAUTHENTICATED",
        },
      },
      { status: 401 }
    );
  }

  const rate = checkRateLimit(`ai-tutor:${session.id}`);

  if (!rate.allowed) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message: "Rate limit exceeded. Please try again later.",
          code: "RATE_LIMITED",
        },
      },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = aiTutorMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message: "Invalid tutor request",
          code: "VALIDATION_ERROR",
        },
      },
      { status: 400 }
    );
  }

  const { message, mode, responseLanguage } = parsed.data;

  const wantsStream =
    request.headers.get("accept")?.includes("text/plain") ?? false;

  /*
   * Set AI_DEMO_MODE=true in Vercel whenever you want EduMind to
   * use built-in responses without attempting an external API request.
   */
  const forceDemoMode =
    process.env.AI_DEMO_MODE?.trim().toLowerCase() === "true";

  if (forceDemoMode) {
    const demoContent = createDemoResponse(message, mode);

    if (wantsStream) {
      return createPlainTextResponse(
        demoContent,
        "edumind-demo",
        true
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        content: demoContent,
        isDemoResponse: true,
        model: "edumind-built-in-demo",
        provider: "edumind-demo",
      },
    });
  }

  try {
    const provider = await getAiProvider();

    const modeInstruction =
      MODE_INSTRUCTIONS[mode] ?? MODE_INSTRUCTIONS.explain;

    const languageInstruction =
      responseLanguage === "en"
        ? "Respond in English."
        : `Respond using language code ${responseLanguage}.`;

    const aiRequest = {
      systemPrompt: `${SYSTEM_PROMPT}

${modeInstruction}
${languageInstruction}`,
      messages: [
        {
          role: "user" as const,
          content: message,
        },
      ],
      maxTokens: mode === "practice_questions" ? 550 : 350,
      temperature: 0.2,
      task: "tutor" as const,
    };

    if (wantsStream && provider.stream) {
      try {
        const stream = await provider.stream(aiRequest);

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            "X-AI-Provider": provider.name,
            "X-AI-Demo": "false",
          },
        });
      } catch (streamError) {
        console.error("AI tutor streaming error:", streamError);

        const demoContent = createDemoResponse(message, mode);

        return createPlainTextResponse(
          demoContent,
          "edumind-demo-fallback",
          true
        );
      }
    }

    const result = await provider.complete(aiRequest);

    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        isDemoResponse: result.isDemoResponse,
        model: result.model,
        provider: provider.name,
      },
    });
  } catch (error) {
    console.error("AI tutor provider error:", {
      reason: readableError(error),
    });

    const demoContent = createDemoResponse(message, mode);

    /*
     * Always return HTTP 200 for a successful fallback response.
     * The student should not see technical 401, 429 or 502 errors.
     */
    if (wantsStream) {
      return createPlainTextResponse(
        demoContent,
        "edumind-demo-fallback",
        true
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        content: demoContent,
        isDemoResponse: true,
        model: "edumind-built-in-demo",
        provider: "edumind-demo-fallback",
        providerStatus: readableError(error),
      },
    });
  }
}
