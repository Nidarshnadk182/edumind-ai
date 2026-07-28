import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { getAiProvider } from "@/lib/ai/provider";
import { aiTutorMessageSchema } from "@/lib/validations/schemas";

import type { ApiResponse } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODE_INSTRUCTIONS: Record<string, string> = {
  explain: `
Explain the concept clearly.
Begin with a direct definition, then explain how it works.
Use a short example when useful.
`,

  simplify: `
Explain the concept in simple language.
Use short sentences and avoid unnecessary technical terminology.
Define any technical term that must be used.
`,

  example: `
Focus on one clear practical or numerical example.
Show the steps and explain what each step means.
`,

  eli10: `
Explain the concept as if the student were 10 years old.
Use an everyday analogy before connecting it to the academic meaning.
`,

  beginner: `
Answer at beginner level.
Define all important terms and avoid assuming prior knowledge.
`,

  intermediate: `
Answer at intermediate level.
Assume the student understands the basic terminology.
Explain application and interpretation.
`,

  advanced: `
Answer at advanced level.
Use precise terminology, assumptions, formulas and limitations where relevant.
`,

  practice_questions: `
Generate exactly three useful practice questions.

For every question:
1. Show the question.
2. Give the correct answer.
3. Add a one-sentence explanation.

Base the questions on the concept requested by the student.
`,

  summarise: `
Summarise the concept in two or three concise paragraphs.
Include the definition, main mechanism and one key implication.
`,

  follow_up: `
Give a short explanation and then ask one question that checks whether the student understood the concept.
`,
};

const SYSTEM_PROMPT = `
You are EduMind AI Tutor, a patient and accurate academic learning assistant.

Your job is to help students understand concepts instead of merely giving final answers.

General rules:
- Answer the exact question asked.
- Use accurate academic language.
- Match the requested difficulty level and mode.
- Use descriptive headings when the answer has multiple sections.
- Prefer short paragraphs and clear bullet points.
- Explain formulas by defining every variable.
- For calculations, show the working clearly.
- Distinguish facts, assumptions and interpretation.
- Do not invent quotations, references, page numbers, research findings or citations.
- Do not claim that information came from uploaded material unless source material was actually provided.
- When uncertain, state the limitation clearly.
- Keep a normal explanation under 450 words.
- Practice-question responses may be longer.
- Use Markdown formatting where it improves readability.
- Do not wrap the answer in JSON.
- Return only the educational response.
`.trim();

interface DemoTopic {
  keywords: string[];
  title: string;
  explanation: string;
  simpleExplanation: string;
  example: string;
  practiceQuestions: string;
}

interface TutorSuccessData {
  content: string;
  isDemoResponse: boolean;
  model: string;
  provider: string;
  providerStatus?: string;
}

const DEMO_TOPICS: DemoTopic[] = [
  {
    keywords: [
      "heteroskedasticity",
      "heteroscedasticity",
      "white test",
      "breusch pagan",
      "breusch-pagan",
    ],

    title: "Heteroskedasticity",

    explanation: `Heteroskedasticity occurs when the variance of a regression model's error term is not constant across observations.

### Why it matters

Ordinary Least Squares coefficient estimates may remain unbiased, but their estimated standard errors can become unreliable. This can make confidence intervals, t-tests and F-tests misleading.

### Detection

Common methods include:

- Examining residual plots
- Breusch–Pagan test
- White test

### Remedies

Possible remedies include:

- Heteroskedasticity-robust standard errors
- Transforming relevant variables
- Reconsidering the model specification
- Using an appropriate weighted estimation method`,

    simpleExplanation: `Heteroskedasticity means that a regression model's prediction errors do not have the same spread everywhere.

Imagine throwing darts. For some observations, the darts land close together. For other observations, they spread widely. That changing spread represents heteroskedasticity.

It mainly makes the model's standard errors and hypothesis tests less reliable.`,

    example: `Suppose a model predicts household expenditure from income.

For low-income households, actual expenditure may differ from predicted expenditure by only $100 to $200. For high-income households, the difference may be $2,000 or more.

Because the error spread increases with income, the regression may have heteroskedasticity.`,

    practiceQuestions: `### Practice questions

1. **What is heteroskedasticity?**  
   **Answer:** It is a situation in which the variance of regression errors is not constant.  
   **Explanation:** The error spread changes across observations.

2. **Does heteroskedasticity necessarily make OLS coefficients biased?**  
   **Answer:** No.  
   **Explanation:** OLS coefficients may remain unbiased, but their standard errors can become unreliable.

3. **Name two tests for heteroskedasticity.**  
   **Answer:** The Breusch–Pagan test and White test.  
   **Explanation:** Both examine whether error variance changes systematically.`,
  },

  {
    keywords: [
      "option greek",
      "option greeks",
      "delta",
      "gamma",
      "theta",
      "vega",
      "rho",
    ],

    title: "Option Greeks",

    explanation: `Option Greeks measure how an option's value responds to changes in important market variables.

- **Delta:** Approximate change in option price for a one-unit change in the underlying asset price.
- **Gamma:** Change in delta when the underlying price changes.
- **Theta:** Change in option value caused by the passage of time.
- **Vega:** Sensitivity to changes in expected volatility.
- **Rho:** Sensitivity to changes in interest rates.

Traders use the Greeks to measure and manage the risks of an options position or portfolio.`,

    simpleExplanation: `Option Greeks are like sensors showing what can change an option's price.

- Delta tracks the asset price.
- Gamma tracks changes in delta.
- Theta tracks time decay.
- Vega tracks volatility.
- Rho tracks interest rates.`,

    example: `Suppose a call option has a delta of 0.60.

If the underlying asset price rises by $10, the option price is expected to rise by approximately:

**0.60 × $10 = $6**

This is only an approximation because delta itself may change as the underlying price changes.`,

    practiceQuestions: `### Practice questions

1. **Which Greek measures time decay?**  
   **Answer:** Theta.  
   **Explanation:** Theta estimates how option value changes as time passes.

2. **Which Greek measures sensitivity to volatility?**  
   **Answer:** Vega.  
   **Explanation:** Vega reflects the effect of changes in expected volatility.

3. **What does delta measure?**  
   **Answer:** The approximate change in option price for a one-unit change in the underlying price.  
   **Explanation:** Delta captures directional exposure.`,
  },

  {
    keywords: [
      "put call parity",
      "put-call parity",
      "put call",
    ],

    title: "Put–Call Parity",

    explanation: `Put–call parity explains the relationship between European call options, European put options, the underlying asset and a risk-free investment.

For a non-dividend-paying stock:

**C + PV(K) = P + S₀**

Where:

- **C** = call option price
- **P** = put option price
- **S₀** = current stock price
- **PV(K)** = present value of the exercise price

Both sides create the same payoff at expiration. Therefore, they should have the same value today. If the relationship does not hold, an arbitrage opportunity may exist.`,

    simpleExplanation: `Put–call parity says that two portfolios producing the same future payoff should have the same value today.

A call option plus enough safe money to pay the strike price should equal a put option plus the underlying stock.`,

    example: `Suppose:

- Current stock price = $100
- Present value of strike price = $92
- Call price = $15

Using:

**C + PV(K) = P + S₀**

Substitute the values:

**15 + 92 = P + 100**

Therefore:

**P = $7**`,

    practiceQuestions: `### Practice questions

1. **Write the standard put–call parity equation.**  
   **Answer:** C + PV(K) = P + S₀.  
   **Explanation:** The equation equates two portfolios with identical expiration payoffs.

2. **Which options does standard put–call parity apply to?**  
   **Answer:** European call and put options with the same strike price and expiration date.  
   **Explanation:** The matching terms are necessary for equivalent payoffs.

3. **What may happen if put–call parity does not hold?**  
   **Answer:** An arbitrage opportunity may arise.  
   **Explanation:** Traders may construct offsetting positions that generate a risk-free gain.`,
  },

  {
    keywords: [
      "wacc",
      "weighted average cost of capital",
      "cost of capital",
    ],

    title: "Weighted Average Cost of Capital",

    explanation: `WACC is the average required return of a company's debt and equity providers, weighted according to their proportions in the firm's capital structure.

The standard formula is:

**WACC = (E/V × Kₑ) + (D/V × K𝒹 × (1 − T))**

Where:

- **E** = market value of equity
- **D** = market value of debt
- **V** = E + D
- **Kₑ** = cost of equity
- **K𝒹** = cost of debt
- **T** = corporate tax rate

WACC is often used as a discount rate when a project's risk is similar to the company's existing operating risk.`,

    simpleExplanation: `A company commonly receives money from shareholders and lenders.

Shareholders expect a return, while lenders expect interest. WACC combines these financing costs into one overall percentage.`,

    example: `Suppose a company is financed by:

- 60% equity with a cost of 12%
- 40% debt with an after-tax cost of 6%

Then:

**WACC = (0.60 × 12%) + (0.40 × 6%)**

**WACC = 7.2% + 2.4%**

**WACC = 9.6%**`,

    practiceQuestions: `### Practice questions

1. **What does WACC represent?**  
   **Answer:** The weighted average required return of a company's debt and equity providers.  
   **Explanation:** It reflects the combined financing cost.

2. **Why is the cost of debt adjusted for tax?**  
   **Answer:** Because interest expense may create a tax shield.  
   **Explanation:** The effective after-tax cost of debt can be lower than its stated interest rate.

3. **When can WACC be used as a project discount rate?**  
   **Answer:** When the project's risk is similar to the firm's existing operating risk.  
   **Explanation:** A materially different-risk project should use a different required return.`,
  },

  {
    keywords: [
      "forward contract",
      "futures contract",
      "forward and futures",
      "forwards and futures",
      "difference between forward",
    ],

    title: "Forward and Futures Contracts",

    explanation: `A forward contract is a private agreement between two parties to buy or sell an asset at a specified price on a future date.

A futures contract has a similar economic purpose but is standardised and traded through an organised exchange.

### Major differences

- Forwards are customised; futures are standardised.
- Forwards generally have greater counterparty risk.
- Futures are marked to market daily.
- Futures normally require margin deposits.
- Forward gains or losses are usually settled at maturity.
- Futures exchanges and clearing houses reduce default risk.`,

    simpleExplanation: `Both contracts allow parties to fix a price today for a transaction that will happen later.

A forward is privately negotiated. A futures contract is standardised and traded through an exchange.`,

    example: `An importer expects to pay $100,000 after three months.

The importer is worried that the dollar may become more expensive. A forward contract can be used to fix the exchange rate today, reducing uncertainty about the future payment.`,

    practiceQuestions: `### Practice questions

1. **Which contract is normally traded on an exchange?**  
   **Answer:** A futures contract.  
   **Explanation:** Futures are standardised exchange-traded contracts.

2. **Which contract is generally more customisable?**  
   **Answer:** A forward contract.  
   **Explanation:** Its amount, maturity and other terms can be privately negotiated.

3. **What is daily marking to market?**  
   **Answer:** The daily calculation and settlement of futures gains and losses.  
   **Explanation:** It reduces the buildup of unsettled credit exposure.`,
  },

  {
    keywords: [
      "porter five forces",
      "porter's five forces",
      "porters five forces",
      "five forces",
    ],

    title: "Porter's Five Forces",

    explanation: `Porter's Five Forces framework evaluates the competitive pressures that influence an industry's profitability.

The five forces are:

1. Rivalry among existing competitors
2. Threat of new entrants
3. Bargaining power of buyers
4. Bargaining power of suppliers
5. Threat of substitute products or services

A strong competitive force usually increases costs, reduces pricing power or places pressure on industry profitability.`,

    simpleExplanation: `The framework examines five groups that can make it easier or harder for companies to earn profits:

- Existing competitors
- New companies
- Customers
- Suppliers
- Substitute solutions`,

    example: `In the airline industry, rivalry is often high because multiple airlines compete on fares.

Customers can compare prices easily, while trains or buses may act as substitutes for shorter journeys. High aircraft and fuel costs may also affect supplier power and entry barriers.`,

    practiceQuestions: `### Practice questions

1. **What does high buyer power usually do?**  
   **Answer:** It pressures companies to lower prices or provide greater value.  
   **Explanation:** Powerful customers can negotiate or switch easily.

2. **Must a substitute be a direct competitor?**  
   **Answer:** No.  
   **Explanation:** A substitute can satisfy the same need through a different solution.

3. **Name one barrier to entry.**  
   **Answer:** High capital requirements, regulation, brand loyalty or economies of scale.  
   **Explanation:** These factors make market entry more difficult.`,
  },

  {
    keywords: [
      "cross sectional",
      "cross-sectional",
      "panel data",
      "time series",
      "types of data",
    ],

    title: "Cross-Sectional, Time-Series and Panel Data",

    explanation: `### Cross-sectional data

Cross-sectional data contains observations about multiple individuals, companies or regions at one point in time.

### Time-series data

Time-series data follows one variable or entity across multiple time periods.

### Panel data

Panel data follows multiple individuals or entities across multiple time periods. It therefore combines cross-sectional and time-series dimensions.`,

    simpleExplanation: `Cross-sectional data compares many subjects at one time.

Time-series data follows one subject or variable over time.

Panel data follows many subjects over time.`,

    example: `- Salaries of 100 employees in 2026: **cross-sectional data**
- Annual US GDP from 2010 to 2026: **time-series data**
- Profits of 50 companies from 2020 to 2026: **panel data**`,

    practiceQuestions: `### Practice questions

1. **Data for 200 firms in one year is what type?**  
   **Answer:** Cross-sectional data.  
   **Explanation:** It compares many entities at one point in time.

2. **Monthly inflation for ten years is what type?**  
   **Answer:** Time-series data.  
   **Explanation:** It follows one variable over multiple periods.

3. **Annual profitability of 100 firms for five years is what type?**  
   **Answer:** Panel data.  
   **Explanation:** It follows several firms over several periods.`,
  },
];

function normaliseText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findDemoTopic(
  message: string
): DemoTopic | undefined {
  const normalisedMessage = normaliseText(message);

  return DEMO_TOPICS.find((topic) =>
    topic.keywords.some((keyword) =>
      normalisedMessage.includes(
        normaliseText(keyword)
      )
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

1. Define the central concept in your own words.
2. Provide one practical or numerical example.
3. Explain why the concept is important.

### Suggested approach

Begin with the definition, identify the major components and connect the concept to a practical application.

> **Built-in response:** EduMind's live AI provider is temporarily unavailable, so these are structured revision questions rather than a live model-generated answer.`;
  }

  if (mode === "follow_up") {
    return `### Check your understanding

How would you explain **${question}** to a classmate using one simple example?

> **Built-in response:** EduMind's live AI provider is temporarily unavailable.`;
  }

  if (mode === "summarise") {
    return `### Quick summary

Your question concerns **${question}**.

Focus on:

1. The definition
2. The main mechanism or formula
3. One practical implication or application

> **Built-in response:** A more detailed subject-specific answer will appear when the live AI provider is available.`;
  }

  return `### Understanding the concept

You asked about:

**${question}**

A useful learning structure is:

1. **Definition:** What the concept means
2. **Components:** Its important terms or stages
3. **Mechanism:** How it works
4. **Application:** Where it is used
5. **Example:** A short practical illustration

Start by writing a two-sentence definition, followed by one example from your course material.

> **Built-in response:** EduMind's live AI provider is temporarily unavailable. This response keeps the tutor functional without displaying a technical provider error.`;
}

function createDemoResponse(
  message: string,
  mode: string
): string {
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
      content = topic.practiceQuestions;
      break;

    case "summarise":
      content = topic.simpleExplanation;
      break;

    case "follow_up":
      content = `${topic.simpleExplanation}

### Check your understanding

Can you explain ${topic.title.toLowerCase()} using one example from your subject?`;
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

> **Built-in response:** This answer came from EduMind's internal academic fallback because the live AI provider was temporarily unavailable.`;
}

function getReadableProviderError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown AI provider error";

  if (/timeout|timed out|aborted/i.test(message)) {
    return "The AI provider took too long to answer.";
  }

  if (
    /401|403|authentication|authorization|api key|permission/i.test(
      message
    )
  ) {
    return "The AI provider could not authenticate the request.";
  }

  if (
    /429|quota|rate limit|resource exhausted|insufficient_quota/i.test(
      message
    )
  ) {
    return "The AI provider's quota or rate limit was reached.";
  }

  if (
    /404|model not found|unknown model/i.test(message)
  ) {
    return "The configured AI model could not be found.";
  }

  if (
    /fetch failed|connect|econnrefused|network/i.test(
      message
    )
  ) {
    return "The AI provider is currently unreachable.";
  }

  return message.slice(0, 300);
}

function createPlainTextResponse(
  content: string,
  provider: string,
  isDemoResponse: boolean,
  model?: string
): Response {
  const headers = new Headers({
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control":
      "no-cache, no-store, must-revalidate",
    "X-AI-Provider": provider,
    "X-AI-Demo": String(isDemoResponse),
  });

  if (model) {
    headers.set("X-AI-Model", model);
  }

  return new Response(content, {
    status: 200,
    headers,
  });
}

function createJsonSuccessResponse(
  data: TutorSuccessData
) {
  return NextResponse.json<
    ApiResponse<TutorSuccessData>
  >(
    {
      success: true,
      data,
    },
    {
      status: 200,
      headers: {
        "Cache-Control":
          "no-cache, no-store, must-revalidate",
        "X-AI-Provider": data.provider,
        "X-AI-Demo": String(data.isDemoResponse),
        "X-AI-Model": data.model,
      },
    }
  );
}

function wantsPlainTextResponse(
  request: Request
): boolean {
  const accept =
    request.headers.get("accept")?.toLowerCase() ?? "";

  return (
    accept.includes("text/plain") &&
    !accept.includes("application/json")
  );
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
      {
        status: 401,
      }
    );
  }

  const rateLimit = checkRateLimit(
    `ai-tutor:${session.id}`
  );

  if (!rateLimit.allowed) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message:
            "You have sent too many tutor requests. Please wait briefly and try again.",
          code: "RATE_LIMITED",
        },
      },
      {
        status: 429,
      }
    );
  }

  const body: unknown = await request
    .json()
    .catch(() => null);

  const parsedRequest =
    aiTutorMessageSchema.safeParse(body);

  if (!parsedRequest.success) {
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: {
          message:
            "The tutor request is invalid. Enter a question and try again.",
          code: "VALIDATION_ERROR",
        },
      },
      {
        status: 400,
      }
    );
  }

  const {
    message,
    mode = "explain",
    responseLanguage = "en",
  } = parsedRequest.data;

  const plainTextRequested =
    wantsPlainTextResponse(request);

  const forceDemoMode =
    process.env.AI_DEMO_MODE
      ?.trim()
      .toLowerCase() === "true";

  if (forceDemoMode) {
    const demoContent = createDemoResponse(
      message,
      mode
    );

    if (plainTextRequested) {
      return createPlainTextResponse(
        demoContent,
        "edumind-demo",
        true,
        "edumind-built-in-demo"
      );
    }

    return createJsonSuccessResponse({
      content: demoContent,
      isDemoResponse: true,
      model: "edumind-built-in-demo",
      provider: "edumind-demo",
    });
  }

  try {
    const provider = await getAiProvider();

    const modeInstruction =
      MODE_INSTRUCTIONS[mode] ??
      MODE_INSTRUCTIONS.explain;

    const languageInstruction =
      responseLanguage === "en"
        ? "Respond in English."
        : `Respond using language code "${responseLanguage}".`;

    const aiRequest = {
      systemPrompt: `${SYSTEM_PROMPT}

Specific response instructions:
${modeInstruction.trim()}

Language:
${languageInstruction}`,

      messages: [
        {
          role: "user" as const,
          content: message,
        },
      ],

      maxTokens:
        mode === "practice_questions"
          ? 700
          : mode === "advanced"
            ? 650
            : 500,

      temperature: 0.2,
      task: "tutor" as const,
    };

    if (
      plainTextRequested &&
      typeof provider.stream === "function"
    ) {
      try {
        const stream = await provider.stream(aiRequest);

        return new Response(stream, {
          status: 200,
          headers: {
            "Content-Type":
              "text/plain; charset=utf-8",
            "Cache-Control":
              "no-cache, no-store, no-transform",
            "X-Content-Type-Options": "nosniff",
            "X-AI-Provider": provider.name,
            "X-AI-Demo": "false",
          },
        });
      } catch (streamError) {
        console.error(
          "AI Tutor streaming failed:",
          getReadableProviderError(streamError)
        );

        const demoContent = createDemoResponse(
          message,
          mode
        );

        return createPlainTextResponse(
          demoContent,
          "edumind-demo-fallback",
          true,
          "edumind-built-in-demo"
        );
      }
    }

    const result = await provider.complete(aiRequest);

    const content = result.content?.trim();

    if (!content) {
      throw new Error(
        "The AI provider returned an empty response."
      );
    }

    return createJsonSuccessResponse({
      content,
      isDemoResponse:
        result.isDemoResponse ?? false,
      model:
        result.model ??
        process.env.LLM_MODEL ??
        "configured-model",
      provider: provider.name,
    });
  } catch (providerError) {
    const providerStatus =
      getReadableProviderError(providerError);

    console.error("AI Tutor provider failure:", {
      providerStatus,
    });

    const demoContent = createDemoResponse(
      message,
      mode
    );

    if (plainTextRequested) {
      return createPlainTextResponse(
        demoContent,
        "edumind-demo-fallback",
        true,
        "edumind-built-in-demo"
      );
    }

    return createJsonSuccessResponse({
      content: demoContent,
      isDemoResponse: true,
      model: "edumind-built-in-demo",
      provider: "edumind-demo-fallback",
      providerStatus,
    });
  }
}
