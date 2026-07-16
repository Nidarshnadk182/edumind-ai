import { NextResponse } from 'next/server';
import { z } from 'zod';
import { quizGenerationSchema } from '@/lib/validations/schemas';
import { getSessionUser } from '@/lib/auth/session';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { getAiProvider, isAiConfigured } from '@/lib/ai/provider';
import type { ApiResponse, QuestionType } from '@/types/database';

const generatedQuestionSchema = z.object({
  question_type: z.enum(['mcq', 'true_false', 'short_answer', 'numerical']),
  question_text: z.string().min(8),
  options: z.array(z.string().min(1)).nullable(),
  correct_answer: z.string().min(1),
  explanation: z.string().min(5),
  difficulty_tier: z.number().int().min(1).max(5),
  bloom_level: z.enum(['remember', 'understand', 'apply', 'analyse', 'evaluate', 'create']),
  learning_outcome: z.string().min(3),
  source_reference: z.string().nullable(),
  estimated_time_seconds: z.number().int().min(15).max(3600),
});
const responseSchema = z.object({ questions: z.array(generatedQuestionSchema) });

type GeneratedQuestion = z.infer<typeof generatedQuestionSchema> & { id: string };

function stripCodeFence(value: string) {
  return value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
}

function validateQuestionQuality(question: z.infer<typeof generatedQuestionSchema>) {
  if (question.question_type === 'mcq') {
    if (!question.options || question.options.length < 3) return false;
    const exactMatches = question.options.filter((option) => option.trim() === question.correct_answer.trim()).length;
    if (exactMatches !== 1) return false;
  }
  if (question.question_type === 'true_false' && !['true', 'false'].includes(question.correct_answer.toLowerCase())) return false;
  return true;
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });

  const rate = checkRateLimit(`quiz-gen:${session.id}`);
  if (!rate.allowed) return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Rate limit exceeded', code: 'RATE_LIMITED' } }, { status: 429 });

  const parsed = quizGenerationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: parsed.error.issues[0]?.message || 'Invalid request', code: 'VALIDATION_ERROR' } }, { status: 400 });
  }
  if (!isAiConfigured()) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'No LLM is configured. Set LLM_PROVIDER, LLM_BASE_URL and LLM_MODEL, or configure Anthropic.', code: 'AI_NOT_CONFIGURED' } }, { status: 503 });
  }

  const { data } = parsed;
  const sourceMaterial = data.sourceText?.trim();
  if (data.relyOnlyOnProvidedMaterial && !sourceMaterial) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Source material is required when grounded-only generation is enabled.', code: 'SOURCE_REQUIRED' } }, { status: 400 });
  }

  const blueprint = {
    subject: data.subjectName,
    subjectCode: data.subjectCode || null,
    topic: data.topicName,
    subtopics: data.subtopics,
    learningOutcome: data.learningOutcome,
    questionTypes: data.questionTypes,
    numberOfQuestions: data.numQuestions,
    overallDifficulty: data.difficulty,
    cognitiveDistributionPercent: data.difficultyDistribution,
    groundedOnly: data.relyOnlyOnProvidedMaterial,
  };

  try {
    const provider = await getAiProvider();
    const result = await provider.complete({
      systemPrompt: `You are an assessment designer. Return one JSON object with a \"questions\" array and no markdown. Every question must match the supplied subject, topic, learning outcome and source. Use difficulty tiers: 1 recall, 2 understanding, 3 application, 4 analysis, 5 evaluation/synthesis. MCQs must have 4 distinct options and exactly one option must exactly equal correct_answer. Numerical questions must contain all data required to solve them. Do not use outside knowledge when groundedOnly is true. source_reference must describe the supporting heading or supplied-source location, or null when not available.`,
      messages: [{ role: 'user', content: JSON.stringify({ blueprint, sourceMaterial: sourceMaterial || 'General model knowledge is permitted.' }) }],
      maxTokens: 5000,
      temperature: 0.2,
      responseFormat: 'json',
    });

    const raw = responseSchema.parse(JSON.parse(stripCodeFence(result.content)));
    const valid = raw.questions.filter(validateQuestionQuality).slice(0, data.numQuestions);
    if (valid.length !== data.numQuestions) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: `The model produced ${valid.length} valid questions out of ${data.numQuestions}. Please retry or adjust the blueprint.`, code: 'QUESTION_VALIDATION_FAILED' } }, { status: 422 });
    }

    const questions: GeneratedQuestion[] = valid.map((question, index) => ({ ...question, id: `generated-${index + 1}` }));
    return NextResponse.json<ApiResponse<{ questions: GeneratedQuestion[]; isDemoResponse: boolean; model: string; blueprint: typeof blueprint }>>({
      success: true,
      data: { questions, isDemoResponse: false, model: result.model, blueprint },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Quiz generation failed.';
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message } }, { status: 502 });
  }
}
