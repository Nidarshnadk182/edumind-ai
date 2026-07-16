'use client';

import { useState } from 'react';
import { ListChecks, Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question_type: 'mcq' | 'true_false' | 'short_answer' | 'numerical';
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
}

export default function QuizzesPage() {
  const [stage, setStage] = useState<'setup' | 'quiz' | 'results'>('setup');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [numQuestions, setNumQuestions] = useState(4);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [topicName, setTopicName] = useState('');
  const [learningOutcome, setLearningOutcome] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ scorePercent: number; correctCount: number; totalCount: number; answers: { questionId: string; isCorrect: boolean; studentAnswer: string }[] } | null>(null);

  async function generateQuiz() {
    setLoading(true);
    try {
      const res = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'pasted_text',
          subjectName,
          subjectCode: subjectCode || undefined,
          topicName,
          learningOutcome,
          sourceText,
          questionTypes: ['mcq', 'true_false', 'short_answer', 'numerical'],
          numQuestions,
          difficulty,
          difficultyDistribution: {
            recall: 20,
            understanding: 25,
            application: 30,
            analysis: 20,
            evaluation: 5,
          },
          relyOnlyOnProvidedMaterial: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Quiz generation failed.');
      setQuestions(json.data.questions);
      setAnswers({});
      setCurrentIndex(0);
      setStage('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Quiz generation failed.');
    } finally {
      setLoading(false);
    }
  }

  async function submitQuiz() {
    const res = await fetch('/api/quizzes/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: '00000000-0000-0000-0000-000000000000',
        timeTakenSeconds: 120,
        questions,
        answers: questions.map((q) => ({ questionId: q.id, studentAnswer: answers[q.id] ?? '' })),
      }),
    });
    const json = await res.json();
    if (json.success) {
      setResult(json.data);
      setStage('results');
    }
  }

  if (stage === 'setup') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50 flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-purple-600 dark:text-purple-300" /> Quizzes
          </h1>
          <p className="text-sm text-navy-500 dark:text-lavender-400">Generate a quiz from a topic, your notes, or a past conversation.</p>
        </div>
        <Card>
          <CardTitle className="!text-base">New quiz</CardTitle>
          <CardDescription>Create a source-grounded quiz. Questions will be generated only from the material you provide.</CardDescription>
          {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
          <div className="grid sm:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">Subject</label>
              <input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Derivatives" className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">Subject code</label>
              <input value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} placeholder="e.g. MBA443F" className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">Topic</label>
              <input value={topicName} onChange={(e) => setTopicName(e.target.value)} placeholder="e.g. Hedging using futures" className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">Learning outcome</label>
              <input value={learningOutcome} onChange={(e) => setLearningOutcome(e.target.value)} placeholder="What should the quiz test?" className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">Study material</label>
              <textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} rows={8} placeholder="Paste the relevant notes, textbook extract, or teacher material here." className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-sm">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">Number of questions</label>
              <input type="number" min={1} max={10} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-sm" />
            </div>
          </div>
          <Button className="w-full mt-5" onClick={generateQuiz} disabled={loading || !subjectName.trim() || !topicName.trim() || !learningOutcome.trim() || !sourceText.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate quiz'}
          </Button>
        </Card>
      </div>
    );
  }

  if (stage === 'quiz') {
    const q = questions[currentIndex];
    if (!q) return null;
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <div className="flex justify-between text-xs text-navy-500 dark:text-lavender-400 mb-1.5">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>Time limit: 10 min</span>
          </div>
          <div className="h-1.5 rounded-full bg-navy-100 dark:bg-navy-800 overflow-hidden">
            <div className="h-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Card>
          <p className="text-xs uppercase tracking-wide text-navy-400 dark:text-lavender-500 mb-2">{q.question_type.replace('_', ' ')}</p>
          <p className="font-medium text-navy-900 dark:text-lavender-50 mb-5">{q.question_text}</p>

          {q.options ? (
            <div className="space-y-2">
              {q.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  className={cn(
                    'w-full text-left rounded-xl border px-4 py-3 text-sm transition-colors',
                    answers[q.id] === opt ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500' : 'border-navy-200 dark:border-navy-700'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <input
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
              placeholder="Type your answer"
              className="w-full rounded-xl border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          )}
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}>Previous</Button>
          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex((i) => i + 1)}>Next</Button>
          ) : (
            <Button onClick={submitQuiz}>Submit quiz</Button>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'results' && result) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Card className="text-center">
          <p className="text-sm text-navy-500 dark:text-lavender-400 mb-2">Your score</p>
          <p className="font-display text-5xl font-semibold text-purple-600 dark:text-purple-300">{result.scorePercent}%</p>
          <p className="text-sm text-navy-500 dark:text-lavender-400 mt-2">{result.correctCount} of {result.totalCount} correct</p>
        </Card>

        <div className="space-y-3">
          {questions.map((q) => {
            const a = result.answers.find((x) => x.questionId === q.id);
            return (
              <Card key={q.id} className="!p-4">
                <div className="flex items-start gap-3">
                  {a?.isCorrect ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" /> : <XCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />}
                  <div>
                    <p className="text-sm font-medium text-navy-800 dark:text-lavender-100">{q.question_text}</p>
                    <p className="text-xs text-navy-500 dark:text-lavender-400 mt-1">Your answer: {a?.studentAnswer || '—'}</p>
                    {!a?.isCorrect && <p className="text-xs text-navy-500 dark:text-lavender-400">Correct answer: {q.correct_answer}</p>}
                    <p className="text-xs text-navy-400 dark:text-lavender-500 mt-1.5">{q.explanation}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Button variant="outline" className="w-full" onClick={() => setStage('setup')}>
          <RotateCcw className="h-4 w-4" /> Retry quiz
        </Button>
      </div>
    );
  }

  return null;
}
