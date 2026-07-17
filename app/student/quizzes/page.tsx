"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  ListChecks,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Difficulty = "beginner" | "intermediate" | "advanced";
type QuizStage = "setup" | "quiz" | "results";
type SourceMode = "paste" | "upload" | "teacher_material" | "ai_tutor";

interface Question {
  id: string;
  question_type:
    | "mcq"
    | "true_false"
    | "short_answer"
    | "numerical";
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
}

interface QuizResult {
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  answers: Array<{
    questionId: string;
    isCorrect: boolean;
    studentAnswer: string;
  }>;
}

interface SavedMaterial {
  id: string;
  title: string;
  subject?: string;
  topic?: string;
  content: string;
  fileName?: string;
  published?: boolean;
}

const SOURCE_OPTIONS: Array<{
  id: SourceMode;
  title: string;
  description: string;
  icon: typeof FileText;
}> = [
  {
    id: "paste",
    title: "Paste notes",
    description: "Paste notes, textbook extracts or class content.",
    icon: FileText,
  },
  {
    id: "upload",
    title: "Upload file",
    description: "Upload TXT, MD, CSV, PDF or DOCX material.",
    icon: Upload,
  },
  {
    id: "teacher_material",
    title: "Teacher material",
    description: "Choose material published by your teacher.",
    icon: BookOpen,
  },
  {
    id: "ai_tutor",
    title: "AI Tutor answer",
    description: "Create a quiz from your latest AI Tutor answer.",
    icon: Sparkles,
  },
];

export default function QuizzesPage() {
  const [stage, setStage] = useState<QuizStage>("setup");
  const [sourceMode, setSourceMode] = useState<SourceMode>("paste");

  const [difficulty, setDifficulty] =
    useState<Difficulty>("intermediate");
  const [numQuestions, setNumQuestions] = useState(4);

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [topicName, setTopicName] = useState("");
  const [learningOutcome, setLearningOutcome] = useState("");

  const [sourceText, setSourceText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [fileLoading, setFileLoading] = useState(false);

  const [teacherMaterials, setTeacherMaterials] = useState<
    SavedMaterial[]
  >([]);
  const [selectedMaterialId, setSelectedMaterialId] =
    useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [usingDemoQuiz, setUsingDemoQuiz] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, string>
  >({});
  const [result, setResult] = useState<QuizResult | null>(null);

  useEffect(() => {
    loadTeacherMaterials();
    loadAiTutorSource();
  }, []);

  const selectedMaterial = useMemo(
    () =>
      teacherMaterials.find(
        (material) => material.id === selectedMaterialId
      ),
    [teacherMaterials, selectedMaterialId]
  );

  function loadTeacherMaterials() {
    try {
      const possibleKeys = [
        "edumind-teacher-materials",
        "edumind-materials",
        "teacher-materials",
      ];

      let materials: SavedMaterial[] = [];

      for (const key of possibleKeys) {
        const storedValue = localStorage.getItem(key);

        if (!storedValue) {
          continue;
        }

        const parsed = JSON.parse(storedValue) as unknown;

        if (!Array.isArray(parsed)) {
          continue;
        }

        materials = parsed
          .map(normaliseSavedMaterial)
          .filter(
            (material): material is SavedMaterial =>
              material !== null &&
              material.content.trim().length > 0 &&
              material.published !== false
          );

        if (materials.length > 0) {
          break;
        }
      }

      setTeacherMaterials(materials);
    } catch {
      setTeacherMaterials([]);
    }
  }

  function loadAiTutorSource() {
    try {
      const tutorSource = localStorage.getItem(
        "edumind-quiz-source"
      );

      if (!tutorSource?.trim()) {
        return;
      }

      setSourceMode("ai_tutor");
      setSourceText(tutorSource);
      setNotice(
        "The latest AI Tutor answer has been added as the quiz source."
      );
    } catch {
      // localStorage may be unavailable in restricted browsers.
    }
  }

  function changeSourceMode(mode: SourceMode) {
    setSourceMode(mode);
    setError("");
    setNotice("");

    if (mode === "ai_tutor") {
      const tutorSource = localStorage.getItem(
        "edumind-quiz-source"
      );

      if (tutorSource?.trim()) {
        setSourceText(tutorSource);
        setNotice("AI Tutor answer loaded.");
      } else {
        setSourceText("");
        setNotice(
          "Ask the AI Tutor a question and select “Generate quiz” below its answer."
        );
      }
    }

    if (mode === "teacher_material") {
      setSourceText(selectedMaterial?.content ?? "");
    }

    if (mode === "upload") {
      setSourceText("");
      setUploadedFileName("");
    }
  }

  function selectTeacherMaterial(materialId: string) {
    setSelectedMaterialId(materialId);

    const material = teacherMaterials.find(
      (item) => item.id === materialId
    );

    if (!material) {
      setSourceText("");
      return;
    }

    setSourceText(material.content);

    if (!subjectName && material.subject) {
      setSubjectName(material.subject);
    }

    if (!topicName && material.topic) {
      setTopicName(material.topic);
    }

    setNotice(`Loaded “${material.title}”.`);
  }

  async function handleFileUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setNotice("");
    setFileLoading(true);
    setUploadedFileName(file.name);

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase() ?? "";

      if (["txt", "md", "csv"].includes(extension)) {
        const text = await file.text();

        if (!text.trim()) {
          throw new Error(
            "The uploaded file does not contain readable text."
          );
        }

        setSourceText(text);
        setNotice(`${file.name} was loaded successfully.`);
        return;
      }

      if (!["pdf", "docx", "doc"].includes(extension)) {
        throw new Error(
          "Please upload a TXT, MD, CSV, PDF, DOC or DOCX file."
        );
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "quiz_source");

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      let payload: any = null;

      try {
        payload = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(
          payload?.error?.message ??
            payload?.message ??
            `File upload failed (${response.status}).`
        );
      }

      const extractedText =
        payload?.data?.extractedText ??
        payload?.data?.content ??
        payload?.data?.text ??
        payload?.extractedText ??
        payload?.content ??
        payload?.text ??
        "";

      if (!String(extractedText).trim()) {
        throw new Error(
          "The file was uploaded, but its text could not be extracted. Paste the relevant content manually for now."
        );
      }

      setSourceText(String(extractedText));
      setNotice(`${file.name} was uploaded and processed.`);
    } catch (uploadError) {
      setSourceText("");
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The file could not be processed."
      );
    } finally {
      setFileLoading(false);
      event.target.value = "";
    }
  }

  function clearSource() {
    setSourceText("");
    setUploadedFileName("");
    setSelectedMaterialId("");
    setNotice("");
    setError("");

    try {
      if (sourceMode === "ai_tutor") {
        localStorage.removeItem("edumind-quiz-source");
      }
    } catch {
      // Ignore storage errors.
    }
  }

  async function generateQuiz() {
    setError("");
    setNotice("");

    if (!subjectName.trim()) {
      setError("Enter the subject name.");
      return;
    }

    if (!topicName.trim()) {
      setError("Enter the quiz topic.");
      return;
    }

    if (!learningOutcome.trim()) {
      setError("Enter the learning outcome.");
      return;
    }

    if (!sourceText.trim()) {
      setError(
        "Add study material by pasting text, uploading a file or selecting teacher material."
      );
      return;
    }

    setLoading(true);
    setUsingDemoQuiz(false);

    try {
      const response = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceType: sourceModeToApiSource(sourceMode),
          subjectName: subjectName.trim(),
          subjectCode: subjectCode.trim() || undefined,
          topicName: topicName.trim(),
          subtopics: [],
          learningOutcome: learningOutcome.trim(),
          sourceText: sourceText.trim(),
          questionTypes: [
            "mcq",
            "true_false",
            "short_answer",
            "numerical",
          ],
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

      const responseText = await response.text();

      let payload: any = null;

      try {
        payload = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        payload = null;
      }

      if (
        response.ok &&
        payload?.success &&
        Array.isArray(payload?.data?.questions) &&
        payload.data.questions.length > 0
      ) {
        setQuestions(
          payload.data.questions.map(
            normaliseGeneratedQuestion
          )
        );
        setUsingDemoQuiz(
          Boolean(
            payload.data.isDemoResponse ??
              payload.data.demoMode
          )
        );
      } else {
        const fallbackQuestions = createDemoQuestions({
          sourceText,
          topicName,
          subjectName,
          learningOutcome,
          numQuestions,
          difficulty,
        });

        setQuestions(fallbackQuestions);
        setUsingDemoQuiz(true);
        setNotice(
          "The live AI quiz service was unavailable, so EduMind created a demo quiz from your study material."
        );
      }

      setAnswers({});
      setResult(null);
      setCurrentIndex(0);
      setStage("quiz");
    } catch {
      const fallbackQuestions = createDemoQuestions({
        sourceText,
        topicName,
        subjectName,
        learningOutcome,
        numQuestions,
        difficulty,
      });

      setQuestions(fallbackQuestions);
      setAnswers({});
      setResult(null);
      setCurrentIndex(0);
      setUsingDemoQuiz(true);
      setStage("quiz");
    } finally {
      setLoading(false);
    }
  }

  async function submitQuiz() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/quizzes/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId:
            "00000000-0000-0000-0000-000000000000",
          timeTakenSeconds: 120,
          questions,
          answers: questions.map((question) => ({
            questionId: question.id,
            studentAnswer: answers[question.id] ?? "",
          })),
        }),
      });

      const payload = await response
        .json()
        .catch(() => null);

      if (response.ok && payload?.success) {
        setResult(payload.data);
        setStage("results");
        return;
      }

      const localResult = scoreQuizLocally(
        questions,
        answers
      );

      setResult(localResult);
      setStage("results");
    } catch {
      const localResult = scoreQuizLocally(
        questions,
        answers
      );

      setResult(localResult);
      setStage("results");
    } finally {
      setLoading(false);
    }
  }

  function resetQuiz() {
    setStage("setup");
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setUsingDemoQuiz(false);
    setError("");
  }

  if (stage === "setup") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50">
            <ListChecks className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            Quizzes
          </h1>

          <p className="text-sm text-navy-500 dark:text-lavender-400">
            Generate a quiz from notes, uploaded files,
            teacher materials or an AI Tutor answer.
          </p>
        </div>

        <Card>
          <CardTitle className="!text-base">
            Choose study material
          </CardTitle>

          <CardDescription>
            Questions will be grounded in the material you
            provide.
          </CardDescription>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {SOURCE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = sourceMode === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    changeSourceMode(option.id)
                  }
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4 text-left transition",
                    active
                      ? "border-purple-400 bg-purple-50 dark:border-purple-500 dark:bg-purple-950/20"
                      : "border-navy-200 hover:border-purple-300 dark:border-navy-700"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      active
                        ? "bg-purple-600 text-white"
                        : "bg-navy-100 text-navy-500 dark:bg-navy-800 dark:text-lavender-300"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>

                  <span>
                    <span className="block text-sm font-semibold text-navy-800 dark:text-lavender-100">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-navy-500 dark:text-lavender-400">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardTitle className="!text-base">
            New quiz
          </CardTitle>

          <CardDescription>
            Add the course information and select the content
            that should be tested.
          </CardDescription>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          )}

          {notice && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-300">
              {notice}
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Subject">
              <input
                value={subjectName}
                onChange={(event) =>
                  setSubjectName(event.target.value)
                }
                placeholder="e.g. Derivatives"
                className={inputClassName}
              />
            </Field>

            <Field label="Subject code">
              <input
                value={subjectCode}
                onChange={(event) =>
                  setSubjectCode(event.target.value)
                }
                placeholder="e.g. MBA443F"
                className={inputClassName}
              />
            </Field>

            <Field
              label="Topic"
              className="sm:col-span-2"
            >
              <input
                value={topicName}
                onChange={(event) =>
                  setTopicName(event.target.value)
                }
                placeholder="e.g. Hedging using futures"
                className={inputClassName}
              />
            </Field>

            <Field
              label="Learning outcome"
              className="sm:col-span-2"
            >
              <input
                value={learningOutcome}
                onChange={(event) =>
                  setLearningOutcome(event.target.value)
                }
                placeholder="What should the quiz test?"
                className={inputClassName}
              />
            </Field>

            {sourceMode === "paste" && (
              <Field
                label="Study material"
                className="sm:col-span-2"
              >
                <textarea
                  value={sourceText}
                  onChange={(event) =>
                    setSourceText(event.target.value)
                  }
                  rows={9}
                  placeholder="Paste the relevant notes, textbook extract or teacher material here."
                  className={inputClassName}
                />
              </Field>
            )}

            {sourceMode === "upload" && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-navy-600 dark:text-lavender-300">
                  Upload study material
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-navy-200 px-5 py-8 text-center transition hover:border-purple-400 hover:bg-purple-50/50 dark:border-navy-700 dark:hover:bg-purple-950/10">
                  {fileLoading ? (
                    <Loader2 className="mb-2 h-7 w-7 animate-spin text-purple-600" />
                  ) : (
                    <Upload className="mb-2 h-7 w-7 text-purple-600" />
                  )}

                  <span className="text-sm font-medium text-navy-700 dark:text-lavender-200">
                    {fileLoading
                      ? "Processing file…"
                      : "Choose a study-material file"}
                  </span>

                  <span className="mt-1 text-xs text-navy-400 dark:text-lavender-500">
                    TXT, MD, CSV, PDF, DOC or DOCX
                  </span>

                  <input
                    type="file"
                    className="hidden"
                    accept=".txt,.md,.csv,.pdf,.doc,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    disabled={fileLoading}
                  />
                </label>

                {uploadedFileName && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-navy-200 px-3 py-2 text-sm dark:border-navy-700">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-purple-600" />
                      <span className="truncate">
                        {uploadedFileName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={clearSource}
                      className="rounded p-1 text-navy-400 hover:bg-red-50 hover:text-red-600"
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {sourceText && (
                  <textarea
                    value={sourceText}
                    onChange={(event) =>
                      setSourceText(event.target.value)
                    }
                    rows={7}
                    className={cn(
                      inputClassName,
                      "mt-3"
                    )}
                    placeholder="Extracted file text"
                  />
                )}
              </div>
            )}

            {sourceMode === "teacher_material" && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-navy-600 dark:text-lavender-300">
                  Published teacher material
                </label>

                {teacherMaterials.length > 0 ? (
                  <>
                    <select
                      value={selectedMaterialId}
                      onChange={(event) =>
                        selectTeacherMaterial(
                          event.target.value
                        )
                      }
                      className={inputClassName}
                    >
                      <option value="">
                        Select a material
                      </option>

                      {teacherMaterials.map((material) => (
                        <option
                          key={material.id}
                          value={material.id}
                        >
                          {material.title}
                          {material.subject
                            ? ` — ${material.subject}`
                            : ""}
                        </option>
                      ))}
                    </select>

                    {selectedMaterial && (
                      <div className="mt-3 rounded-xl border border-navy-200 p-4 dark:border-navy-700">
                        <p className="text-sm font-semibold text-navy-800 dark:text-lavender-100">
                          {selectedMaterial.title}
                        </p>

                        <p className="mt-1 text-xs text-navy-500 dark:text-lavender-400">
                          {selectedMaterial.subject ??
                            "General material"}
                          {selectedMaterial.topic
                            ? ` · ${selectedMaterial.topic}`
                            : ""}
                        </p>

                        <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-xs leading-5 text-navy-600 dark:text-lavender-300">
                          {selectedMaterial.content}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-navy-200 p-6 text-center dark:border-navy-700">
                    <BookOpen className="mx-auto h-7 w-7 text-navy-300 dark:text-navy-600" />
                    <p className="mt-2 text-sm font-medium text-navy-700 dark:text-lavender-200">
                      No published material is available
                    </p>
                    <p className="mt-1 text-xs text-navy-500 dark:text-lavender-400">
                      Your teacher must upload and publish
                      material before it appears here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {sourceMode === "ai_tutor" && (
              <Field
                label="AI Tutor answer"
                className="sm:col-span-2"
              >
                <textarea
                  value={sourceText}
                  onChange={(event) =>
                    setSourceText(event.target.value)
                  }
                  rows={9}
                  placeholder="No AI Tutor answer has been selected yet."
                  className={inputClassName}
                />
              </Field>
            )}

            <Field label="Difficulty">
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(
                    event.target.value as Difficulty
                  )
                }
                className={inputClassName}
              >
                <option value="beginner">
                  Beginner
                </option>
                <option value="intermediate">
                  Intermediate
                </option>
                <option value="advanced">
                  Advanced
                </option>
              </select>
            </Field>

            <Field label="Number of questions">
              <input
                type="number"
                min={1}
                max={10}
                value={numQuestions}
                onChange={(event) =>
                  setNumQuestions(
                    Math.min(
                      10,
                      Math.max(
                        1,
                        Number(event.target.value) || 1
                      )
                    )
                  )
                }
                className={inputClassName}
              />
            </Field>
          </div>

          <Button
            className="mt-5 w-full"
            onClick={generateQuiz}
            disabled={
              loading ||
              fileLoading ||
              !subjectName.trim() ||
              !topicName.trim() ||
              !learningOutcome.trim() ||
              !sourceText.trim()
            }
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating quiz…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate quiz
              </>
            )}
          </Button>
        </Card>
      </div>
    );
  }

  if (stage === "quiz") {
    const question = questions[currentIndex];

    if (!question) {
      return null;
    }

    const progress =
      ((currentIndex + 1) / questions.length) * 100;

    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-navy-500 dark:text-lavender-400">
            <span>
              Question {currentIndex + 1} of{" "}
              {questions.length}
            </span>

            <span>
              {usingDemoQuiz
                ? "Demo quiz"
                : "Source-grounded quiz"}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-navy-100 dark:bg-navy-800">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {usingDemoQuiz && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
            The external AI service was unavailable. These
            questions were generated using EduMind&apos;s
            built-in quiz mode.
          </div>
        )}

        <Card>
          <p className="mb-2 text-xs uppercase tracking-wide text-navy-400 dark:text-lavender-500">
            {question.question_type.replace("_", " ")}
          </p>

          <p className="mb-5 font-medium text-navy-900 dark:text-lavender-50">
            {question.question_text}
          </p>

          {question.options ? (
            <div className="space-y-2">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: option,
                    }))
                  }
                  className={cn(
                    "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    answers[question.id] === option
                      ? "border-purple-400 bg-purple-50 dark:border-purple-500 dark:bg-purple-900/20"
                      : "border-navy-200 hover:border-purple-300 dark:border-navy-700"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              value={answers[question.id] ?? ""}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [question.id]: event.target.value,
                }))
              }
              rows={3}
              placeholder="Type your answer"
              className={inputClassName}
            />
          )}
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            disabled={currentIndex === 0}
            onClick={() =>
              setCurrentIndex((index) => index - 1)
            }
          >
            Previous
          </Button>

          {currentIndex < questions.length - 1 ? (
            <Button
              onClick={() =>
                setCurrentIndex((index) => index + 1)
              }
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={submitQuiz}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit quiz"
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (stage === "results" && result) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <Card className="text-center">
          <p className="mb-2 text-sm text-navy-500 dark:text-lavender-400">
            Your score
          </p>

          <p className="font-display text-5xl font-semibold text-purple-600 dark:text-purple-300">
            {result.scorePercent}%
          </p>

          <p className="mt-2 text-sm text-navy-500 dark:text-lavender-400">
            {result.correctCount} of {result.totalCount}{" "}
            correct
          </p>
        </Card>

        <div className="space-y-3">
          {questions.map((question) => {
            const answer = result.answers.find(
              (item) =>
                item.questionId === question.id
            );

            return (
              <Card
                key={question.id}
                className="!p-4"
              >
                <div className="flex items-start gap-3">
                  {answer?.isCorrect ? (
                    <CheckCircle2 className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-500" />
                  ) : (
                    <XCircle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-500" />
                  )}

                  <div>
                    <p className="text-sm font-medium text-navy-800 dark:text-lavender-100">
                      {question.question_text}
                    </p>

                    <p className="mt-1 text-xs text-navy-500 dark:text-lavender-400">
                      Your answer:{" "}
                      {answer?.studentAnswer || "—"}
                    </p>

                    {!answer?.isCorrect && (
                      <p className="text-xs text-navy-500 dark:text-lavender-400">
                        Correct answer:{" "}
                        {question.correct_answer}
                      </p>
                    )}

                    <p className="mt-1.5 text-xs text-navy-400 dark:text-lavender-500">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={resetQuiz}
        >
          <RotateCcw className="h-4 w-4" />
          Create another quiz
        </Button>
      </div>
    );
  }

  return null;
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-medium text-navy-600 dark:text-lavender-300">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:border-navy-700 dark:bg-navy-900 dark:text-lavender-50 dark:focus:ring-purple-950";

function sourceModeToApiSource(
  sourceMode: SourceMode
): string {
  switch (sourceMode) {
    case "upload":
      return "uploaded_file";
    case "teacher_material":
      return "teacher_material";
    case "ai_tutor":
      return "ai_tutor";
    case "paste":
    default:
      return "pasted_text";
  }
}

function normaliseSavedMaterial(
  value: any
): SavedMaterial | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const content = String(
    value.content ??
      value.text ??
      value.sourceText ??
      value.description ??
      ""
  );

  if (!content.trim()) {
    return null;
  }

  return {
    id: String(
      value.id ??
        value.materialId ??
        crypto.randomUUID()
    ),
    title: String(
      value.title ??
        value.name ??
        value.fileName ??
        "Teacher material"
    ),
    subject: value.subject
      ? String(value.subject)
      : value.subjectName
        ? String(value.subjectName)
        : undefined,
    topic: value.topic
      ? String(value.topic)
      : value.topicName
        ? String(value.topicName)
        : undefined,
    content,
    fileName: value.fileName
      ? String(value.fileName)
      : undefined,
    published:
      value.published ??
      value.isPublished ??
      value.status !== "draft",
  };
}

function normaliseGeneratedQuestion(
  value: any,
  index: number
): Question {
  const questionType =
    value?.question_type ??
    value?.questionType ??
    "mcq";

  const options = Array.isArray(value?.options)
    ? value.options.map(String)
    : null;

  return {
    id: String(
      value?.id ??
        value?.questionId ??
        `generated-${index + 1}`
    ),
    question_type: isQuestionType(questionType)
      ? questionType
      : "mcq",
    question_text: String(
      value?.question_text ??
        value?.questionText ??
        value?.question ??
        `Question ${index + 1}`
    ),
    options,
    correct_answer: String(
      value?.correct_answer ??
        value?.correctAnswer ??
        value?.answer ??
        ""
    ),
    explanation: String(
      value?.explanation ??
        "Review the relevant section of the provided study material."
    ),
  };
}

function isQuestionType(
  value: unknown
): value is Question["question_type"] {
  return [
    "mcq",
    "true_false",
    "short_answer",
    "numerical",
  ].includes(String(value));
}

function createDemoQuestions({
  sourceText,
  topicName,
  subjectName,
  learningOutcome,
  numQuestions,
  difficulty,
}: {
  sourceText: string;
  topicName: string;
  subjectName: string;
  learningOutcome: string;
  numQuestions: number;
  difficulty: Difficulty;
}): Question[] {
  const cleanSource = sourceText
    .replace(/\s+/g, " ")
    .trim();

  const sentences = cleanSource
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(
      (sentence) =>
        sentence.length >= 25 &&
        sentence.length <= 280
    );

  const sourceSentences =
    sentences.length > 0
      ? sentences
      : [cleanSource.slice(0, 250)];

  const keywords = extractKeywords(
    cleanSource,
    topicName,
    subjectName
  );

  const questions: Question[] = [];

  for (let index = 0; index < numQuestions; index++) {
    const sentence =
      sourceSentences[index % sourceSentences.length] ||
      `${topicName} is an important topic in ${subjectName}.`;

    const keyword =
      keywords[index % keywords.length] ||
      topicName;

    const typeIndex = index % 4;

    if (typeIndex === 0) {
      const distractors = buildDistractors(
        keyword,
        keywords
      );

      questions.push({
        id: `demo-${index + 1}`,
        question_type: "mcq",
        question_text:
          index === 0
            ? `Which statement about ${topicName} is supported by the study material?`
            : `Which option is most closely associated with “${keyword}” in the provided material?`,
        options: shuffleArray([
          sentence,
          ...distractors,
        ]).slice(0, 4),
        correct_answer: sentence,
        explanation: `The provided material states: “${sentence}”`,
      });

      continue;
    }

    if (typeIndex === 1) {
      questions.push({
        id: `demo-${index + 1}`,
        question_type: "true_false",
        question_text: `True or false: The study material identifies “${keyword}” as relevant to ${topicName}.`,
        options: ["True", "False"],
        correct_answer: "True",
        explanation: `“${keyword}” appears as a significant term in the supplied study material.`,
      });

      continue;
    }

    if (typeIndex === 2) {
      questions.push({
        id: `demo-${index + 1}`,
        question_type: "short_answer",
        question_text: `Briefly explain ${keyword} in the context of ${topicName}.`,
        options: null,
        correct_answer: sentence,
        explanation: `A suitable answer should communicate the key idea from this source statement: “${sentence}”`,
      });

      continue;
    }

    questions.push({
      id: `demo-${index + 1}`,
      question_type: "short_answer",
      question_text:
        difficulty === "advanced"
          ? `Analyse how “${keyword}” contributes to the learning outcome: ${learningOutcome}`
          : `Give one example or application of ${keyword}.`,
      options: null,
      correct_answer: sentence,
      explanation: `The response should be consistent with the study material and the learning outcome.`,
    });
  }

  return questions;
}

function extractKeywords(
  text: string,
  topicName: string,
  subjectName: string
): string[] {
  const stopWords = new Set([
    "about",
    "after",
    "again",
    "also",
    "because",
    "been",
    "being",
    "between",
    "could",
    "does",
    "from",
    "have",
    "into",
    "more",
    "most",
    "other",
    "should",
    "than",
    "that",
    "their",
    "there",
    "these",
    "they",
    "this",
    "those",
    "through",
    "using",
    "when",
    "where",
    "which",
    "while",
    "will",
    "with",
    "would",
  ]);

  const counts = new Map<string, number>();

  const words = `${topicName} ${subjectName} ${text}`
    .toLowerCase()
    .match(/[a-z][a-z-]{3,}/g);

  for (const word of words ?? []) {
    if (stopWords.has(word)) {
      continue;
    }

    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => capitalise(word));

  return Array.from(
    new Set([
      topicName.trim(),
      ...ranked,
      subjectName.trim(),
    ])
  )
    .filter(Boolean)
    .slice(0, 12);
}

function buildDistractors(
  correctKeyword: string,
  keywords: string[]
): string[] {
  const alternatives = keywords
    .filter(
      (keyword) =>
        keyword.toLowerCase() !==
        correctKeyword.toLowerCase()
    )
    .slice(0, 3)
    .map(
      (keyword) =>
        `${keyword} is unrelated to the main idea discussed in this section.`
    );

  while (alternatives.length < 3) {
    alternatives.push(
      [
        "The material does not discuss this relationship.",
        "This statement contradicts the supplied notes.",
        "This is not identified as a key point in the source.",
      ][alternatives.length]
    );
  }

  return alternatives;
}

function shuffleArray<T>(values: T[]): T[] {
  const copy = [...values];

  for (let index = copy.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(
      Math.random() * (index + 1)
    );

    [copy[index], copy[randomIndex]] = [
      copy[randomIndex],
      copy[index],
    ];
  }

  return copy;
}

function scoreQuizLocally(
  questions: Question[],
  answers: Record<string, string>
): QuizResult {
  const evaluatedAnswers = questions.map((question) => {
    const studentAnswer =
      answers[question.id]?.trim() ?? "";

    const isCorrect =
      question.question_type === "short_answer" ||
      question.question_type === "numerical"
        ? evaluateWrittenAnswer(
            studentAnswer,
            question.correct_answer
          )
        : normaliseAnswer(studentAnswer) ===
          normaliseAnswer(question.correct_answer);

    return {
      questionId: question.id,
      isCorrect,
      studentAnswer,
    };
  });

  const correctCount = evaluatedAnswers.filter(
    (answer) => answer.isCorrect
  ).length;

  return {
    scorePercent:
      questions.length > 0
        ? Math.round(
            (correctCount / questions.length) * 100
          )
        : 0,
    correctCount,
    totalCount: questions.length,
    answers: evaluatedAnswers,
  };
}

function evaluateWrittenAnswer(
  studentAnswer: string,
  expectedAnswer: string
): boolean {
  if (!studentAnswer.trim()) {
    return false;
  }

  const expectedKeywords = extractKeywords(
    expectedAnswer,
    "",
    ""
  )
    .map((keyword) => keyword.toLowerCase())
    .slice(0, 6);

  if (expectedKeywords.length === 0) {
    return studentAnswer.length >= 15;
  }

  const normalisedStudent =
    studentAnswer.toLowerCase();

  const matches = expectedKeywords.filter((keyword) =>
    normalisedStudent.includes(keyword)
  ).length;

  return (
    studentAnswer.trim().length >= 15 &&
    matches >= Math.min(2, expectedKeywords.length)
  );
}

function normaliseAnswer(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s.-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
