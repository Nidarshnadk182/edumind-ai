"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Copy,
  RefreshCw,
  BookmarkPlus,
  Layers,
  ListChecks,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Sparkles,
  Check,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isDemoResponse?: boolean;
  provider?: string;
  error?: boolean;
}

const SUGGESTED_PROMPTS = [
  "Explain put-call parity simply",
  "Give me an example of NPV in practice",
  "What is heteroskedasticity?",
  "Quiz me on Porter’s Five Forces",
];

const QUICK_MODES: Array<{
  mode: string;
  label: string;
}> = [
  { mode: "simplify", label: "Simplify" },
  { mode: "example", label: "Give example" },
  { mode: "eli10", label: "Explain like I’m 10" },
  { mode: "practice_questions", label: "Practice questions" },
  { mode: "summarise", label: "Summarise" },
];

export default function AiTutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I’m your EduMind AI tutor. Ask me anything about your coursework, or choose one of the suggested prompts below.",
      isDemoResponse: false,
      provider: "edumind",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(
    null
  );
  const [feedback, setFeedback] = useState<
    Record<string, "up" | "down">
  >({});

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  function updateAssistantMessage(
    assistantId: string,
    updates: Partial<ChatMessage>
  ) {
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId
          ? {
              ...message,
              ...updates,
            }
          : message
      )
    );
  }

  async function sendMessage(
    text: string,
    mode: string = "explain"
  ) {
    const cleanText = text.trim();

    if (!cleanText || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: cleanText,
    };

    const assistantId = crypto.randomUUID();

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        isDemoResponse: false,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
        },
        body: JSON.stringify({
          message: cleanText,
          mode,
          responseLanguage: "en",
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();

        let errorMessage = `Tutor request failed (${response.status})`;

        try {
          const parsedError = JSON.parse(responseText) as {
            error?: {
              message?: string;
            };
          };

          errorMessage =
            parsedError.error?.message ?? errorMessage;
        } catch {
          if (responseText.trim()) {
            errorMessage = responseText;
          }
        }

        throw new Error(errorMessage);
      }

      const isDemoResponse =
        response.headers.get("X-AI-Demo") === "true";

      const provider =
        response.headers.get("X-AI-Provider") ??
        (isDemoResponse ? "edumind-demo" : "live-ai");

      if (!response.body) {
        throw new Error(
          "The tutor returned no response stream."
        );
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let content = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        content += decoder.decode(value, {
          stream: true,
        });

        updateAssistantMessage(assistantId, {
          content,
          isDemoResponse,
          provider,
        });
      }

      content += decoder.decode();

      if (!content.trim()) {
        throw new Error(
          "The AI tutor returned an empty answer."
        );
      }

      updateAssistantMessage(assistantId, {
        content: content.trim(),
        isDemoResponse,
        provider,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while contacting the tutor.";

      updateAssistantMessage(assistantId, {
        content: `The tutor could not complete that request.

${errorMessage}

Please try again with a shorter question.`,
        error: true,
        isDemoResponse: false,
      });
    } finally {
      setLoading(false);
    }
  }

  function regenerate() {
    if (loading) {
      return;
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === "user");

    if (lastUserMessage) {
      sendMessage(lastUserMessage.content);
    }
  }

  async function copyAnswer(message: ChatMessage) {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);

      window.setTimeout(() => {
        setCopiedMessageId((current) =>
          current === message.id ? null : current
        );
      }, 1800);
    } catch {
      setCopiedMessageId(null);
    }
  }

  function saveAsNote(message: ChatMessage) {
    try {
      const existingNotes = JSON.parse(
        localStorage.getItem("edumind-saved-notes") ?? "[]"
      ) as Array<{
        id: string;
        title: string;
        content: string;
        createdAt: string;
      }>;

      existingNotes.unshift({
        id: crypto.randomUUID(),
        title: createNoteTitle(message.content),
        content: message.content,
        createdAt: new Date().toISOString(),
      });

      localStorage.setItem(
        "edumind-saved-notes",
        JSON.stringify(existingNotes)
      );

      window.alert("Answer saved to your EduMind notes.");
    } catch {
      window.alert("The answer could not be saved.");
    }
  }

  function convertToFlashcards(message: ChatMessage) {
    try {
      localStorage.setItem(
        "edumind-flashcard-source",
        message.content
      );

      window.location.href = "/student/flashcards";
    } catch {
      window.alert(
        "The answer could not be sent to flashcards."
      );
    }
  }

  function generateQuiz(message: ChatMessage) {
    try {
      localStorage.setItem(
        "edumind-quiz-source",
        message.content
      );

      window.location.href = "/student/quizzes";
    } catch {
      window.alert(
        "The answer could not be sent to the quiz generator."
      );
    }
  }

  function submitFeedback(
    messageId: string,
    value: "up" | "down"
  ) {
    setFeedback((current) => ({
      ...current,
      [messageId]: value,
    }));
  }

  const hasConversation = messages.some(
    (message) => message.role === "user"
  );

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col md:h-[calc(100vh-4rem)]">
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50">
            AI Tutor
          </h1>

          <p className="text-sm text-navy-500 dark:text-lavender-400">
            Ask a doubt and receive an explanation suited to
            your level.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 dark:border-purple-900/70 dark:bg-purple-950/30 dark:text-purple-300">
          <Sparkles className="h-3.5 w-3.5" />
          Live AI with automatic demo fallback
        </div>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user"
                ? "justify-end"
                : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[88%] md:max-w-[75%]",
                message.role === "assistant" && "w-full"
              )}
            >
              {message.role === "assistant" && (
                <AssistantHeader message={message} />
              )}

              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-7",
                  message.role === "user"
                    ? "rounded-tr-sm bg-purple-600 text-white"
                    : message.error
                      ? "rounded-tl-sm border border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
                      : "card rounded-tl-sm text-navy-800 dark:text-lavender-100"
                )}
              >
                {message.content ? (
                  <FormattedTutorContent
                    content={message.content}
                  />
                ) : loading ? (
                  <div className="flex items-center gap-2 text-navy-400 dark:text-lavender-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing your answer…
                  </div>
                ) : null}
              </div>

              {message.role === "assistant" &&
                message.id !== "welcome" &&
                message.content && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <IconButton
                      icon={
                        copiedMessageId === message.id
                          ? Check
                          : Copy
                      }
                      title={
                        copiedMessageId === message.id
                          ? "Copied"
                          : "Copy answer"
                      }
                      onClick={() => copyAnswer(message)}
                      active={
                        copiedMessageId === message.id
                      }
                    />

                    <IconButton
                      icon={RefreshCw}
                      title="Regenerate"
                      onClick={regenerate}
                      disabled={loading}
                    />

                    <IconButton
                      icon={BookmarkPlus}
                      title="Save to notes"
                      onClick={() => saveAsNote(message)}
                    />

                    <IconButton
                      icon={Layers}
                      title="Convert to flashcards"
                      onClick={() =>
                        convertToFlashcards(message)
                      }
                    />

                    <IconButton
                      icon={ListChecks}
                      title="Generate quiz"
                      onClick={() => generateQuiz(message)}
                    />

                    <span className="mx-1 h-4 w-px bg-navy-200 dark:bg-navy-700" />

                    <IconButton
                      icon={ThumbsUp}
                      title="Good answer"
                      onClick={() =>
                        submitFeedback(message.id, "up")
                      }
                      active={feedback[message.id] === "up"}
                    />

                    <IconButton
                      icon={ThumbsDown}
                      title="Poor answer"
                      onClick={() =>
                        submitFeedback(message.id, "down")
                      }
                      active={
                        feedback[message.id] === "down"
                      }
                    />
                  </div>
                )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {!hasConversation && (
        <div className="mb-3 mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-400 dark:text-lavender-500">
            Suggested questions
          </p>

          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(prompt)}
                className="rounded-full border border-navy-200 px-3 py-1.5 text-xs text-navy-600 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-700 dark:text-lavender-300 dark:hover:bg-navy-800"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasConversation && (
        <div className="mb-3 mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-navy-400 dark:text-lavender-500">
            Refine the latest question
          </p>

          <div className="flex flex-wrap gap-2">
            {QUICK_MODES.map((quickMode) => (
              <button
                key={quickMode.mode}
                type="button"
                disabled={loading}
                onClick={() => {
                  const lastUserMessage = [...messages]
                    .reverse()
                    .find(
                      (message) =>
                        message.role === "user"
                    );

                  if (lastUserMessage) {
                    sendMessage(
                      lastUserMessage.content,
                      quickMode.mode
                    );
                  }
                }}
                className="rounded-full border border-navy-200 px-3 py-1.5 text-xs text-navy-600 transition hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-navy-700 dark:text-lavender-300 dark:hover:bg-navy-800"
              >
                {quickMode.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(input);
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={input}
          disabled={loading}
          onChange={(event) =>
            setInput(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();
              sendMessage(input);
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Ask a doubt…"
          className="max-h-36 min-h-[48px] flex-1 resize-none rounded-2xl border border-navy-200 px-4 py-3 text-sm text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-70 dark:border-navy-700 dark:bg-navy-900 dark:text-lavender-50 dark:focus:ring-purple-950"
        />

        <Button
          type="submit"
          size="md"
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      <p className="mt-2 text-center text-[11px] text-navy-400 dark:text-lavender-500">
        AI and demo responses may contain mistakes. Verify
        important facts with your teacher or textbook.
      </p>
    </div>
  );
}

function AssistantHeader({
  message,
}: {
  message: ChatMessage;
}) {
  return (
    <div className="mb-1.5 flex flex-wrap items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-600 text-white">
        <Sparkles className="h-3 w-3" />
      </span>

      <span className="text-xs font-semibold text-navy-700 dark:text-lavender-200">
        EduMind Tutor
      </span>

      {message.error ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-3 w-3" />
          Request error
        </span>
      ) : message.isDemoResponse ? (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
          Demo response
        </span>
      ) : message.id !== "welcome" ? (
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
          Live AI
        </span>
      ) : null}
    </div>
  );
}

function FormattedTutorContent({
  content,
}: {
  content: string;
}) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 whitespace-pre-wrap">
      {lines.map((line, index) => {
        const trimmedLine = line.trim();

        if (!trimmedLine) {
          return <div key={index} className="h-1" />;
        }

        if (trimmedLine.startsWith("### ")) {
          return (
            <h3
              key={index}
              className="pt-1 text-sm font-semibold text-navy-900 dark:text-lavender-50"
            >
              {trimmedLine.replace(/^###\s+/, "")}
            </h3>
          );
        }

        if (trimmedLine.startsWith("## ")) {
          return (
            <h2
              key={index}
              className="pt-1 text-base font-semibold text-navy-900 dark:text-lavender-50"
            >
              {trimmedLine.replace(/^##\s+/, "")}
            </h2>
          );
        }

        if (/^[-*]\s+/.test(trimmedLine)) {
          return (
            <div
              key={index}
              className="flex items-start gap-2"
            >
              <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
              <span>
                {renderInlineFormatting(
                  trimmedLine.replace(/^[-*]\s+/, "")
                )}
              </span>
            </div>
          );
        }

        if (/^\d+\.\s+/.test(trimmedLine)) {
          const number =
            trimmedLine.match(/^(\d+)\./)?.[1] ?? "";

          return (
            <div
              key={index}
              className="flex items-start gap-2"
            >
              <span className="min-w-5 font-semibold text-purple-600 dark:text-purple-300">
                {number}.
              </span>
              <span>
                {renderInlineFormatting(
                  trimmedLine.replace(/^\d+\.\s+/, "")
                )}
              </span>
            </div>
          );
        }

        if (trimmedLine.startsWith("> ")) {
          return (
            <div
              key={index}
              className="rounded-r-lg border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-200"
            >
              {renderInlineFormatting(
                trimmedLine.replace(/^>\s+/, "")
              )}
            </div>
          );
        }

        return (
          <p key={index}>
            {renderInlineFormatting(trimmedLine)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineFormatting(text: string) {
  const sections = text.split(/(\*\*.*?\*\*)/g);

  return sections.map((section, index) => {
    if (
      section.startsWith("**") &&
      section.endsWith("**")
    ) {
      return (
        <strong
          key={index}
          className="font-semibold text-navy-900 dark:text-lavender-50"
        >
          {section.slice(2, -2)}
        </strong>
      );
    }

    return <span key={index}>{section}</span>;
  });
}

function createNoteTitle(content: string): string {
  const firstMeaningfulLine = content
    .split("\n")
    .map((line) =>
      line
        .replace(/^#+\s*/, "")
        .replace(/\*\*/g, "")
        .trim()
    )
    .find(Boolean);

  return (
    firstMeaningfulLine?.slice(0, 70) ??
    "AI Tutor Note"
  );
}

interface IconButtonProps {
  icon: typeof Copy;
  title: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}

function IconButton({
  icon: Icon,
  title,
  onClick,
  active = false,
  disabled = false,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={cn(
        "rounded-lg p-1.5 text-navy-400 transition hover:bg-purple-50 hover:text-purple-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-lavender-500 dark:hover:bg-navy-800 dark:hover:text-purple-300",
        active &&
          "bg-purple-50 text-purple-600 dark:bg-navy-800 dark:text-purple-300"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
