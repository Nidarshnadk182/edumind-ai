"use client";

import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
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

import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Difficulty = "beginner" | "intermediate" | "advanced";
type QuizStage = "setup" | "quiz" | "results";

type SourceMode =
  | "paste"
  | "upload"
  | "teacher_material"
  | "ai_tutor";

type QuestionType =
  | "mcq"
  | "true_false"
  | "short_answer"
  | "numerical";

interface Question {
  id: string;
  question_type: QuestionType;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
}

interface QuizResultAnswer {
  questionId: string;
  isCorrect: boolean;
  studentAnswer: string;
}

interface QuizResult {
  scorePercent: number;
  correctCount: number;
  totalCount: number;
  answers: QuizResultAnswer[];
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

interface SourceOption {
  id: SourceMode;
  title: string;
  description: string;
  icon: typeof FileText;
}

interface GenerateQuizResponse {
  success?: boolean;
  data?: {
    questions?: unknown[];
    isDemoResponse?: boolean;
    demoMode?: boolean;
  };
  error?: {
    message?: string;
  };
}

interface UploadResponse {
  success?: boolean;
  data?: {
    extractedText?: string;
    content?: string;
    text?: string;
  };
  error?: {
    message?: string;
  };
  message?: string;
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    id: "paste",
    title: "Paste notes",
    description:
      "Paste notes, textbook extracts or class content.",
    icon: FileText,
  },
  {
    id: "upload",
    title: "Upload file",
    description:
      "Upload TXT, MD, CSV, PDF, DOC or DOCX material.",
    icon: Upload,
  },
  {
    id: "teacher_material",
    title: "Teacher material",
    description:
      "Choose study material published by your teacher.",
    icon: BookOpen,
  },
  {
    id: "ai_tutor",
    title: "AI Tutor answer",
    description:
      "Create a quiz from your latest AI Tutor answer.",
    icon: Sparkles,
  },
];

const inputClassName =
  "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:border-navy-700 dark:bg-navy-900 dark:text-lavender-50 dark:focus:ring-purple-950";

export default function QuizzesPage() {
  const [stage, setStage] =
    useState<QuizStage>("setup");

  const [sourceMode, setSourceMode] =
    useState<SourceMode>("paste");

  const [difficulty, setDifficulty] =
    useState<Difficulty>("intermediate");

  const [numQuestions, setNumQuestions] = useState(4);

  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [topicName, setTopicName] = useState("");
  const [learningOutcome, setLearningOutcome] =
    useState("");

  const [sourceText, setSourceText] = useState("");
  const [uploadedFileName, setUploadedFileName] =
    useState("");
  const [fileLoading, setFileLoading] = useState(false);

  const [teacherMaterials, setTeacherMaterials] =
    useState<SavedMaterial[]>([]);

  const [selectedMaterialId, setSelectedMaterialId] =
    useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [usingDemoQuiz, setUsingDemoQuiz] =
    useState(false);

  const [questions, setQuestions] = useState<Question[]>(
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  const [answers, setAnswers] = useState<
    Record<string, string>
  >({});

  const [result, setResult] =
    useState<QuizResult | null>(null);

  useEffect(() => {
    loadTeacherMaterials();
    loadAiTutorSource();
  }, []);

  const selectedMaterial = useMemo(
    () =>
      teacherMaterials.find(
        (material) =>
          material.id === selectedMaterialId
      ),
    [teacherMaterials, selectedMaterialId]
  );

  function loadTeacherMaterials() {
    try {
      const storageKeys = [
        "edumind-teacher-materials",
        "edumind-materials",
        "teacher-materials",
      ];

      let loadedMaterials: SavedMaterial[] = [];

      for (const storageKey of storageKeys) {
        const storedValue =
          localStorage.getItem(storageKey);

        if (!storedValue) {
          continue;
        }

        const parsed: unknown =
          JSON.parse(storedValue);

        if (!Array.isArray(parsed)) {
          continue;
        }

        loadedMaterials = parsed
          .map((item) =>
            normaliseSavedMaterial(item)
          )
          .filter(
            (
              material
            ): material is SavedMaterial =>
              material !== null &&
              material.content.trim().length > 0 &&
              material.published !== false
          );

        if (loadedMaterials.length > 0) {
          break;
        }
      }

      setTeacherMaterials(loadedMaterials);
    } catch {
      setTeacherMaterials([]);
    }
  }

  function loadAiTutorSource() {
    try {
      const tutorSource =
        localStorage.getItem(
          "edumind-quiz-source"
        );

      if (!tutorSource?.trim()) {
        return;
      }

      setSourceMode("ai_tutor");
      setSourceText(tutorSource);

      setNotice(
        "The latest AI Tutor answer has been loaded as the quiz source."
      );
    } catch {
      // localStorage may not be available.
    }
  }

  function changeSourceMode(mode: SourceMode) {
    setSourceMode(mode);
    setError("");
    setNotice("");

    if (mode === "paste") {
      setUploadedFileName("");
      setSelectedMaterialId("");
      setSourceText("");
      return;
    }

    if (mode === "upload") {
      setUploadedFileName("");
      setSelectedMaterialId("");
      setSourceText("");
      return;
    }

    if (mode === "teacher_material") {
      setUploadedFileName("");
      setSourceText(
        selectedMaterial?.content ?? ""
      );
      return;
    }

    try {
      const tutorSource =
        localStorage.getItem(
          "edumind-quiz-source"
        );

      if (tutorSource?.trim()) {
        setSourceText(tutorSource);

        setNotice(
          "The latest AI Tutor answer has been loaded."
        );
      } else {
        setSourceText("");

        setNotice(
          "Ask the AI Tutor a question and choose Generate quiz below its answer."
        );
      }
    } catch {
      setSourceText("");
    }
  }

  function selectTeacherMaterial(
    materialId: string
  ) {
    setSelectedMaterialId(materialId);
    setError("");
    setNotice("");

    const material = teacherMaterials.find(
      (item) => item.id === materialId
    );

    if (!material) {
      setSourceText("");
      return;
    }

    setSourceText(material.content);

    if (
      !subjectName.trim() &&
      material.subject
    ) {
      setSubjectName(material.subject);
    }

    if (!topicName.trim() && material.topic) {
      setTopicName(material.topic);
    }

    setNotice(
      `Loaded “${material.title}”.`
    );
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
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ?? "";

      if (
        ["txt", "md", "csv"].includes(
          extension
        )
      ) {
        const text = await file.text();

        if (!text.trim()) {
          throw new Error(
            "The uploaded file does not contain readable text."
          );
        }

        setSourceText(text);

        setNotice(
          `${file.name} was loaded successfully.`
        );

        return;
      }

      if (
        !["pdf", "doc", "docx"].includes(
          extension
        )
      ) {
        throw new Error(
          "Please upload a TXT, MD, CSV, PDF, DOC or DOCX file."
        );
      }

      const formData = new FormData();

      formData.append("file", file);
      formData.append(
        "purpose",
        "quiz_source"
      );

      const response = await fetch(
        "/api/files/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const responseText =
        await response.text();

      let payload: UploadResponse | null =
        null;

      try {
        payload = responseText
          ? (JSON.parse(
              responseText
            ) as UploadResponse)
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
        "";

      if (!extractedText.trim()) {
        throw new Error(
          "The file was uploaded, but no readable text was returned."
        );
      }

      setSourceText(extractedText);

      setNotice(
        `${file.name} was uploaded and processed.`
      );
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

    if (sourceMode === "ai_tutor") {
      try {
        localStorage.removeItem(
          "edumind-quiz-source"
        );
      } catch {
        // Ignore storage errors.
      }
    }
  }

  async function generateQuiz() {
    setError("");
    setNotice("");

    if (!subjectName.trim()) {
      setError(
        "Enter the subject name."
      );
      return;
    }

    if (!topicName.trim()) {
      setError("Enter the quiz topic.");
      return;
    }

    if (!learningOutcome.trim()) {
      setError(
        "Enter the learning outcome."
      );
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
      const response = await fetch(
        "/api/quizzes/generate",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            sourceType:
              sourceModeToApiSource(
                sourceMode
              ),
            subjectName:
              subjectName.trim(),
            subjectCode:
              subjectCode.trim() ||
              undefined,
            topicName: topicName.trim(),
            subtopics: [],
            learningOutcome:
              learningOutcome.trim(),
            sourceText:
              sourceText.trim(),
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
            relyOnlyOnProvidedMaterial:
              true,
          }),
        }
      );

      const responseText =
        await response.text();

      let payload:
        | GenerateQuizResponse
        | null = null;

      try {
        payload = responseText
          ? (JSON.parse(
              responseText
            ) as GenerateQuizResponse)
          : null;
      } catch {
        payload = null;
      }

      const returnedQuestions =
        payload?.data?.questions;

      if (
        response.ok &&
        payload?.success &&
        Array.isArray(
          returnedQuestions
        ) &&
        returnedQuestions.length > 0
      ) {
        setQuestions(
          returnedQuestions.map(
            (question, index) =>
              normaliseGeneratedQuestion(
                question,
                index
              )
          )
        );

        setUsingDemoQuiz(
          Boolean(
            payload.data
              ?.isDemoResponse ??
              payload.data?.demoMode
          )
        );
      } else {
        createFallbackQuiz();
      }

      setAnswers({});
      setResult(null);
      setCurrentIndex(0);
      setStage("quiz");
    } catch {
      createFallbackQuiz();

      setAnswers({});
      setResult(null);
      setCurrentIndex(0);
      setStage("quiz");
    } finally {
      setLoading(false);
    }
  }

  function createFallbackQuiz() {
    const fallbackQuestions =
      createDemoQuestions({
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
      "The live quiz service was unavailable, so EduMind created a built-in quiz from your material."
    );
  }

  async function submitQuiz() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/quizzes/submit",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            quizId:
              "00000000-0000-0000-0000-000000000000",
            timeTakenSeconds: 120,
            questions,
            answers: questions.map(
              (question) => ({
                questionId:
                  question.id,
                studentAnswer:
                  answers[
                    question.id
                  ] ?? "",
              })
            ),
          }),
        }
      );

      const payload: unknown =
        await response
          .json()
          .catch(() => null);

      if (
        response.ok &&
        isQuizSubmitResponse(payload) &&
        payload.success
      ) {
        setResult(payload.data);
        setStage("results");
        return;
      }

      setResult(
        scoreQuizLocally(
          questions,
          answers
        )
      );

      setStage("results");
    } catch {
      setResult(
        scoreQuizLocally(
          questions,
          answers
        )
      );

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
    setNotice("");
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
            Generate quizzes from notes,
            uploaded files, teacher
            materials or AI Tutor answers.
          </p>
        </div>

        <Card>
          <CardTitle className="!text-base">
            Choose study material
          </CardTitle>

          <CardDescription>
            Questions will be created
            from the material you provide.
          </CardDescription>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {SOURCE_OPTIONS.map(
              (option) => {
                const Icon = option.icon;
                const active =
                  sourceMode ===
                  option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      changeSourceMode(
                        option.id
                      )
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
                        {
                          option.description
                        }
                      </span>
                    </span>
                  </button>
                );
              }
            )}
          </div>
        </Card>

        <Card>
          <CardTitle className="!text-base">
            New quiz
          </CardTitle>

          <CardDescription>
            Add course information and
            choose what should be tested.
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
                  setSubjectName(
                    event.target.value
                  )
                }
                placeholder="e.g. Derivatives"
                className={
                  inputClassName
                }
              />
            </Field>

            <Field label="Subject code">
              <input
                value={subjectCode}
                onChange={(event) =>
                  setSubjectCode(
                    event.target.value
                  )
                }
                placeholder="e.g. MBA443F"
                className={
                  inputClassName
                }
              />
            </Field>

            <Field
              label="Topic"
              className="sm:col-span-2"
            >
              <input
                value={topicName}
                onChange={(event) =>
                  setTopicName(
                    event.target.value
                  )
                }
                placeholder="e.g. Hedging using futures"
                className={
                  inputClassName
                }
              />
            </Field>

            <Field
              label="Learning outcome"
              className="sm:col-span-2"
            >
              <input
                value={learningOutcome}
                onChange={(event) =>
                  setLearningOutcome(
                    event.target.value
                  )
                }
                placeholder="What should the quiz test?"
                className={
                  inputClassName
                }
              />
            </Field>

            {sourceMode ===
              "paste" && (
              <Field
                label="Study material"
                className="sm:col-span-2"
              >
                <textarea
                  value={sourceText}
                  onChange={(event) =>
                    setSourceText(
                      event.target.value
                    )
                  }
                  rows={9}
                  placeholder="Paste notes, textbook content or teacher material here."
                  className={
                    inputClassName
                  }
                />
              </Field>
            )}

            {sourceMode ===
              "upload" && (
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
                    TXT, MD, CSV, PDF,
                    DOC or DOCX
                  </span>

                  <input
                    type="file"
                    className="hidden"
                    accept=".txt,.md,.csv,.pdf,.doc,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={
                      handleFileUpload
                    }
                    disabled={
                      fileLoading
                    }
                  />
                </label>

                {uploadedFileName && (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-navy-200 px-3 py-2 text-sm dark:border-navy-700">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-purple-600" />

                      <span className="truncate">
                        {
                          uploadedFileName
                        }
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={
                        clearSource
                      }
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
                      setSourceText(
                        event.target
                          .value
                      )
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

            {sourceMode ===
              "teacher_material" && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-navy-600 dark:text-lavender-300">
                  Published teacher
                  material
                </label>

                {teacherMaterials.length >
                0 ? (
                  <>
                    <select
                      value={
                        selectedMaterialId
                      }
                      onChange={(event) =>
                        selectTeacherMaterial(
                          event.target
                            .value
                        )
                      }
                      className={
                        inputClassName
                      }
                    >
                      <option value="">
                        Select a
                        material
                      </option>

                      {teacherMaterials.map(
                        (material) => (
                          <option
                            key={
                              material.id
                            }
                            value={
                              material.id
                            }
                          >
                            {
                              material.title
                            }
                            {material.subject
                              ? ` — ${material.subject}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>

                    {selectedMaterial && (
                      <div className="mt-3 rounded-xl border border-navy-200 p-4 dark:border-navy-700">
                        <p className="text-sm font-semibold text-navy-800 dark:text-lavender-100">
                          {
                            selectedMaterial.title
                          }
                        </p>

                        <p className="mt-1 text-xs text-navy-500 dark:text-lavender-400">
                          {selectedMaterial.subject ??
                            "General material"}

                          {selectedMaterial.topic
                            ? ` · ${selectedMaterial.topic}`
                            : ""}
                        </p>

                        <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-xs leading-5 text-navy-600 dark:text-lavender-300">
                          {
                            selectedMaterial.content
                          }
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed border-navy-200 p-6 text-center dark:border-navy-700">
                    <BookOpen className="mx-auto h-7 w-7 text-navy-300 dark:text-navy-600" />

                    <p className="mt-2 text-sm font-medium text-navy-700 dark:text-lavender-200">
                      No published
                      material is
                      available
                    </p>

                    <p className="mt-1 text-xs text-navy-500 dark:text-lavender-400">
                      Teacher materials
                      will appear here
                      after they are
                      published.
                    </p>
                  </div>
                )}
              </div>
            )}

            {sourceMode ===
              "ai_tutor" && (
              <Field
                label="AI Tutor answer"
                className="sm:col-span-2"
              >
                <textarea
                  value={sourceText}
                  onChange={(event) =>
                    setSourceText(
                      event.target.value
                    )
                  }
                  rows={9}
                  placeholder="No AI Tutor answer has been selected yet."
                  className={
                    inputClassName
                  }
                />
              </Field>
            )}

            <Field label="Difficulty">
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(
                    event.target
                      .value as Difficulty
                  )
                }
                className={
                  inputClassName
                }
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
                onChange={(event) => {
                  const value =
                    Number(
                      event.target.value
                    );

                  setNumQuestions(
                    Number.isFinite(
                      value
                    )
                      ? Math.min(
                          10,
                          Math.max(
                            1,
                            value
                          )
                        )
                      : 1
                  );
                }}
                className={
                  inputClassName
                }
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
    const question =
      questions[currentIndex];

    if (!question) {
      return null;
    }

    const progress =
      ((currentIndex + 1) /
        questions.length) *
      100;

    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div>
          <div className="mb-1.5 flex justify-between text-xs text-navy-500 dark:text-lavender-400">
            <span>
              Question{" "}
              {currentIndex + 1} of{" "}
              {questions.length}
            </span>

            <span>
              {usingDemoQuiz
                ? "Built-in quiz"
                : "Source-grounded quiz"}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-navy-100 dark:bg-navy-800">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {usingDemoQuiz && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
            The external AI service was
            unavailable. EduMind created
            this quiz using its built-in
            fallback mode.
          </div>
        )}

        <Card>
          <p className="mb-2 text-xs uppercase tracking-wide text-navy-400 dark:text-lavender-500">
            {question.question_type.replace(
              "_",
              " "
            )}
          </p>

          <p className="mb-5 font-medium text-navy-900 dark:text-lavender-50">
            {question.question_text}
          </p>

          {question.options ? (
            <div className="space-y-2">
              {question.options.map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setAnswers(
                        (current) => ({
                          ...current,
                          [question.id]:
                            option,
                        })
                      )
                    }
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                      answers[
                        question.id
                      ] === option
                        ? "border-purple-400 bg-purple-50 dark:border-purple-500 dark:bg-purple-900/20"
                        : "border-navy-200 hover:border-purple-300 dark:border-navy-700"
                    )}
                  >
                    {option}
                  </button>
                )
              )}
            </div>
          ) : (
            <textarea
              value={
                answers[
                  question.id
                ] ?? ""
              }
              onChange={(event) =>
                setAnswers(
                  (current) => ({
                    ...current,
                    [question.id]:
                      event.target.value,
                  })
                )
              }
              rows={3}
              placeholder="Type your answer"
              className={
                inputClassName
              }
            />
          )}
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            disabled={
              currentIndex === 0
            }
            onClick={() =>
              setCurrentIndex(
                (index) =>
                  Math.max(
                    0,
                    index - 1
                  )
              )
            }
          >
            Previous
          </Button>

          {currentIndex <
          questions.length - 1 ? (
            <Button
              onClick={() =>
                setCurrentIndex(
                  (index) =>
                    Math.min(
                      questions.length -
                        1,
                      index + 1
                    )
                )
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
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit quiz"
              )}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (
    stage === "results" &&
    result
  ) {
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
            {result.correctCount} of{" "}
            {result.totalCount} correct
          </p>
        </Card>

        <div className="space-y-3">
          {questions.map(
            (question) => {
              const answer =
                result.answers.find(
                  (item) =>
                    item.questionId ===
                    question.id
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
                        {
                          question.question_text
                        }
                      </p>

                      <p className="mt-1 text-xs text-navy-500 dark:text-lavender-400">
                        Your answer:{" "}
                        {answer?.studentAnswer ||
                          "—"}
                      </p>

                      {!answer?.isCorrect && (
                        <p className="text-xs text-navy-500 dark:text-lavender-400">
                          Correct answer:{" "}
                          {
                            question.correct_answer
                          }
                        </p>
                      )}

                      <p className="mt-1.5 text-xs text-navy-400 dark:text-lavender-500">
                        {
                          question.explanation
                        }
                      </p>
                    </div>
                  </div>
                </Card>
              );
            }
          )}
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
  children: ReactNode;
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
  value: unknown
): SavedMaterial | null {
  if (!isRecord(value)) {
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

  const generatedId =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
      ? crypto.randomUUID()
      : `material-${Date.now()}-${Math.random()}`;

  return {
    id: String(
      value.id ??
        value.materialId ??
        generatedId
    ),

    title: String(
      value.title ??
        value.name ??
        value.fileName ??
        "Teacher material"
    ),

    subject:
      typeof value.subject === "string"
        ? value.subject
        : typeof value.subjectName ===
            "string"
          ? value.subjectName
          : undefined,

    topic:
      typeof value.topic === "string"
        ? value.topic
        : typeof value.topicName ===
            "string"
          ? value.topicName
          : undefined,

    content,

    fileName:
      typeof value.fileName ===
      "string"
        ? value.fileName
        : undefined,

    published:
      typeof value.published ===
      "boolean"
        ? value.published
        : typeof value.isPublished ===
            "boolean"
          ? value.isPublished
          : value.status !== "draft",
  };
}

function normaliseGeneratedQuestion(
  value: unknown,
  index: number
): Question {
  if (!isRecord(value)) {
    return {
      id: `generated-${index + 1}`,
      question_type:
        "short_answer",
      question_text:
        `Question ${index + 1}`,
      options: null,
      correct_answer: "",
      explanation:
        "Review the relevant section of the supplied material.",
    };
  }

  const rawQuestionType =
    value.question_type ??
    value.questionType ??
    "mcq";

  const questionType =
    isQuestionType(
      rawQuestionType
    )
      ? rawQuestionType
      : "mcq";

  const options = Array.isArray(
    value.options
  )
    ? value.options.map((option) =>
        String(option)
      )
    : null;

  return {
    id: String(
      value.id ??
        value.questionId ??
        `generated-${index + 1}`
    ),

    question_type:
      questionType,

    question_text: String(
      value.question_text ??
        value.questionText ??
        value.question ??
        `Question ${index + 1}`
    ),

    options,

    correct_answer: String(
      value.correct_answer ??
        value.correctAnswer ??
        value.answer ??
        ""
    ),

    explanation: String(
      value.explanation ??
        "Review the relevant section of the supplied material."
    ),
  };
}

function isQuestionType(
  value: unknown
): value is QuestionType {
  return (
    value === "mcq" ||
    value === "true_false" ||
    value === "short_answer" ||
    value === "numerical"
  );
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
  const cleanSource =
    sourceText
      .replace(/\s+/g, " ")
      .trim();

  const extractedSentences =
    cleanSource
      .split(/(?<=[.!?])\s+/)
      .map((sentence) =>
        sentence.trim()
      )
      .filter(
        (sentence) =>
          sentence.length >= 25 &&
          sentence.length <= 280
      );

  const sourceSentences =
    extractedSentences.length > 0
      ? extractedSentences
      : [
          cleanSource.slice(
            0,
            250
          ) ||
            `${topicName} is an important topic in ${subjectName}.`,
        ];

  const keywords =
    extractKeywords(
      cleanSource,
      topicName,
      subjectName
    );

  const generatedQuestions:
    Question[] = [];

  for (
    let index = 0;
    index < numQuestions;
    index += 1
  ) {
    const sentence =
      sourceSentences[
        index %
          sourceSentences.length
      ] ??
      `${topicName} is an important topic in ${subjectName}.`;

    const keyword =
      keywords[
        index % keywords.length
      ] ?? topicName;

    const typeIndex =
      index % 4;

    if (typeIndex === 0) {
      const distractors =
        buildDistractors(
          keyword,
          keywords
        );

      const options =
        shuffleArray([
          sentence,
          ...distractors,
        ]).slice(0, 4);

      generatedQuestions.push({
        id: `demo-${index + 1}`,
        question_type: "mcq",

        question_text:
          index === 0
            ? `Which statement about ${topicName} is supported by the study material?`
            : `Which option is most closely associated with “${keyword}” in the supplied material?`,

        options,
        correct_answer: sentence,

        explanation:
          `The supplied material states: “${sentence}”`,
      });

      continue;
    }

    if (typeIndex === 1) {
      generatedQuestions.push({
        id: `demo-${index + 1}`,
        question_type:
          "true_false",

        question_text:
          `True or false: The supplied material identifies “${keyword}” as relevant to ${topicName}.`,

        options: [
          "True",
          "False",
        ],

        correct_answer: "True",

        explanation:
          `“${keyword}” appears as a relevant term in the supplied material.`,
      });

      continue;
    }

    if (typeIndex === 2) {
      generatedQuestions.push({
        id: `demo-${index + 1}`,
        question_type:
          "short_answer",

        question_text:
          `Briefly explain ${keyword} in the context of ${topicName}.`,

        options: null,
        correct_answer: sentence,

        explanation:
          `A suitable answer should communicate the main idea contained in: “${sentence}”`,
      });

      continue;
    }

    generatedQuestions.push({
      id: `demo-${index + 1}`,
      question_type:
        "short_answer",

      question_text:
        difficulty === "advanced"
          ? `Analyse how “${keyword}” contributes to this learning outcome: ${learningOutcome}`
          : `Give one example or application of ${keyword}.`,

      options: null,
      correct_answer: sentence,

      explanation:
        "The answer should be consistent with the supplied study material and learning outcome.",
    });
  }

  return generatedQuestions;
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

  const counts =
    new Map<string, number>();

  const words =
    `${topicName} ${subjectName} ${text}`
      .toLowerCase()
      .match(/[a-z][a-z-]{3,}/g);

  for (const word of words ?? []) {
    if (stopWords.has(word)) {
      continue;
    }

    counts.set(
      word,
      (counts.get(word) ?? 0) +
        1
    );
  }

  const rankedWords = [
    ...counts.entries(),
  ]
    .sort(
      (first, second) =>
        second[1] - first[1]
    )
    .map(([word]) =>
      capitalise(word)
    );

  return Array.from(
    new Set([
      topicName.trim(),
      ...rankedWords,
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

  const fallbackDistractors:
    string[] = [
    "The material does not discuss this relationship.",
    "This statement contradicts the supplied notes.",
    "This is not identified as a key point in the source.",
  ];

  while (
    alternatives.length < 3
  ) {
    const fallbackIndex =
      alternatives.length;

    const fallback =
      fallbackDistractors[
        fallbackIndex
      ] ??
      "This option is not supported by the supplied study material.";

    alternatives.push(fallback);
  }

  return alternatives;
}

function shuffleArray<T>(
  values: T[]
): T[] {
  const copy = [...values];

  for (
    let index =
      copy.length - 1;
    index > 0;
    index -= 1
  ) {
    const randomIndex =
      Math.floor(
        Math.random() *
          (index + 1)
      );

    const currentValue =
      copy[index];

    const randomValue =
      copy[randomIndex];

    if (
      currentValue === undefined ||
      randomValue === undefined
    ) {
      continue;
    }

    copy[index] = randomValue;
    copy[randomIndex] =
      currentValue;
  }

  return copy;
}

function scoreQuizLocally(
  quizQuestions: Question[],
  quizAnswers: Record<
    string,
    string
  >
): QuizResult {
  const evaluatedAnswers =
    quizQuestions.map(
      (question) => {
        const studentAnswer =
          quizAnswers[
            question.id
          ]?.trim() ?? "";

        const isCorrect =
          question.question_type ===
            "short_answer" ||
          question.question_type ===
            "numerical"
            ? evaluateWrittenAnswer(
                studentAnswer,
                question.correct_answer
              )
            : normaliseAnswer(
                studentAnswer
              ) ===
              normaliseAnswer(
                question.correct_answer
              );

        return {
          questionId:
            question.id,
          isCorrect,
          studentAnswer,
        };
      }
    );

  const correctCount =
    evaluatedAnswers.filter(
      (answer) =>
        answer.isCorrect
    ).length;

  return {
    scorePercent:
      quizQuestions.length > 0
        ? Math.round(
            (correctCount /
              quizQuestions.length) *
              100
          )
        : 0,

    correctCount,
    totalCount:
      quizQuestions.length,

    answers:
      evaluatedAnswers,
  };
}

function evaluateWrittenAnswer(
  studentAnswer: string,
  expectedAnswer: string
): boolean {
  if (!studentAnswer.trim()) {
    return false;
  }

  const expectedKeywords =
    extractKeywords(
      expectedAnswer,
      "",
      ""
    )
      .map((keyword) =>
        keyword.toLowerCase()
      )
      .slice(0, 6);

  if (
    expectedKeywords.length === 0
  ) {
    return (
      studentAnswer.trim()
        .length >= 15
    );
  }

  const normalisedStudentAnswer =
    studentAnswer.toLowerCase();

  const matches =
    expectedKeywords.filter(
      (keyword) =>
        normalisedStudentAnswer.includes(
          keyword
        )
    ).length;

  return (
    studentAnswer.trim().length >=
      15 &&
    matches >=
      Math.min(
        2,
        expectedKeywords.length
      )
  );
}

function normaliseAnswer(
  value: string
): string {
  return value
    .toLowerCase()
    .replace(
      /[^\w\s.-]/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function capitalise(
  value: string
): string {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isQuizSubmitResponse(
  value: unknown
): value is {
  success: true;
  data: QuizResult;
} {
  if (
    !isRecord(value) ||
    value.success !== true
  ) {
    return false;
  }

  if (!isRecord(value.data)) {
    return false;
  }

  return (
    typeof value.data
      .scorePercent ===
      "number" &&
    typeof value.data
      .correctCount ===
      "number" &&
    typeof value.data
      .totalCount ===
      "number" &&
    Array.isArray(
      value.data.answers
    )
  );
}
