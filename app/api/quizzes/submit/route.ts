import { NextResponse } from 'next/server';
import { quizSubmissionSchema } from '@/lib/validations/schemas';
import { getSessionUser } from '@/lib/auth/session';
import { scoreQuiz, type ScorableQuestion } from '@/lib/database/quiz-scoring';
import type { ApiResponse } from '@/types/database';

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: { message: 'Not authenticated' } }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = quizSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: { message: 'Invalid submission', code: 'VALIDATION_ERROR' } },
      { status: 400 }
    );
  }

  // In a fully configured environment this would fetch quiz_questions from
  // Supabase by quizId. In demo mode we expect the client to have already
  // echoed back the question set alongside its answers (see request body).
  const questions: ScorableQuestion[] = (body.questions ?? []).map((q: any) => ({
    id: q.id,
    correctAnswer: q.correct_answer,
    questionType: q.question_type,
  }));

  const result = scoreQuiz(questions, parsed.data.answers);

  return NextResponse.json<ApiResponse<typeof result>>({ success: true, data: result });
}
