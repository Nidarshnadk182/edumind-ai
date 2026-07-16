// ─────────────────────────────────────────────────────────
// Pure quiz-scoring logic — no I/O, fully unit-testable.
// Used by the quiz submission API route.
// ─────────────────────────────────────────────────────────

export interface ScorableQuestion {
  id: string;
  correctAnswer: string;
  questionType: 'mcq' | 'true_false' | 'short_answer' | 'numerical';
}

export interface SubmittedAnswer {
  questionId: string;
  studentAnswer: string;
}

export interface ScoredAnswer {
  questionId: string;
  studentAnswer: string;
  isCorrect: boolean;
}

export interface QuizScoreResult {
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  answers: ScoredAnswer[];
}

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

function isNumericallyEqual(a: string, b: string, tolerance = 0.01): boolean {
  const numA = Number(a);
  const numB = Number(b);
  if (Number.isNaN(numA) || Number.isNaN(numB)) return false;
  return Math.abs(numA - numB) <= tolerance;
}

export function scoreQuiz(
  questions: ScorableQuestion[],
  submitted: SubmittedAnswer[]
): QuizScoreResult {
  const submittedByQuestion = new Map(submitted.map((a) => [a.questionId, a.studentAnswer]));

  const answers: ScoredAnswer[] = questions.map((question) => {
    const studentAnswer = submittedByQuestion.get(question.id) ?? '';
    let isCorrect: boolean;

    if (question.questionType === 'numerical') {
      isCorrect = isNumericallyEqual(studentAnswer, question.correctAnswer);
    } else if (question.questionType === 'short_answer') {
      // Simple normalised exact-match for MVP; can be upgraded to
      // fuzzy/semantic matching without changing the API contract.
      isCorrect = normalise(studentAnswer) === normalise(question.correctAnswer);
    } else {
      isCorrect = normalise(studentAnswer) === normalise(question.correctAnswer);
    }

    return { questionId: question.id, studentAnswer, isCorrect };
  });

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalCount = questions.length;
  const scorePercent = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 10000) / 100;

  return { scorePercent, correctCount, totalCount, answers };
}
