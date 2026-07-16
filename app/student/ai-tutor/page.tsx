'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Send, Copy, RefreshCw, BookmarkPlus, Layers, ListChecks,
  ThumbsUp, ThumbsDown, Loader2, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiGeneratedLabel } from '@/components/shared/ai-label';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isDemoResponse?: boolean;
}

const SUGGESTED_PROMPTS = [
  'Explain put-call parity simply',
  'Give me an example of NPV in practice',
  'What is heteroskedasticity?',
  'Quiz me on Porter\u2019s Five Forces',
];

const QUICK_MODES: { mode: string; label: string }[] = [
  { mode: 'simplify', label: 'Simplify' },
  { mode: 'example', label: 'Give example' },
  { mode: 'eli10', label: 'Explain like I\u2019m 10' },
  { mode: 'practice_questions', label: 'Practice questions' },
];

export default function AiTutorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your EduMind AI tutor. Ask me anything about your coursework, or pick a suggested prompt below to get started.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text: string, mode = 'explain') {
    if (!text.trim() || loading) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    setMessages((m) => [...m, userMessage]);
    setInput('');
    setLoading(true);

    const assistantId = crypto.randomUUID();
    setMessages((m) => [...m, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain',
        },
        body: JSON.stringify({ message: text, mode }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message || `Tutor request failed (${res.status})`);
      }

      if (!res.body) throw new Error('The tutor returned no response stream.');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        content += decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...message, content } : message
          )
        );
      }

      if (!content.trim()) throw new Error('The AI tutor returned an empty answer.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong reaching the AI tutor.';
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId ? { ...item, content: `Sorry — ${message}` } : item
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function regenerate() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUser) sendMessage(lastUser.content);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50">AI Tutor</h1>
        <p className="text-sm text-navy-500 dark:text-lavender-400">Ask a doubt, get an explanation tailored to you.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[85%] md:max-w-[70%]', msg.role === 'user' ? '' : 'w-full')}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-600 text-white">
                    <Sparkles className="h-3 w-3" />
                  </span>
                  {msg.isDemoResponse && <AiGeneratedLabel />}
                </div>
              )}
              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-tr-sm'
                    : 'card rounded-tl-sm'
                )}
              >
                {msg.content}
              </div>
              {msg.role === 'assistant' && msg.id !== 'welcome' && (
                <div className="flex items-center gap-1 mt-2">
                  <IconBtn icon={Copy} title="Copy answer" onClick={() => navigator.clipboard.writeText(msg.content)} />
                  <IconBtn icon={RefreshCw} title="Regenerate" onClick={regenerate} />
                  <IconBtn icon={BookmarkPlus} title="Save to notes" />
                  <IconBtn icon={Layers} title="Convert to flashcards" />
                  <IconBtn icon={ListChecks} title="Generate quiz" />
                  <span className="mx-1 h-4 w-px bg-navy-200 dark:bg-navy-700" />
                  <IconBtn icon={ThumbsUp} title="Good answer" />
                  <IconBtn icon={ThumbsDown} title="Poor answer" />
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-navy-400 dark:text-lavender-400 pl-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> EduMind AI is typing…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="text-xs rounded-full border border-navy-200 dark:border-navy-700 px-3 py-1.5 text-navy-600 dark:text-lavender-300 hover:border-purple-300 hover:text-purple-700"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {messages.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_MODES.map((m) => (
            <button
              key={m.mode}
              onClick={() => {
                const lastUser = [...messages].reverse().find((msg) => msg.role === 'user');
                if (lastUser) sendMessage(lastUser.content, m.mode);
              }}
              className="text-xs rounded-full border border-navy-200 dark:border-navy-700 px-3 py-1.5 text-navy-600 dark:text-lavender-300 hover:border-purple-300 hover:text-purple-700"
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
          rows={1}
          placeholder="Ask a doubt…"
          className="flex-1 resize-none rounded-2xl border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <Button type="submit" size="md" disabled={loading || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <p className="text-[11px] text-navy-400 dark:text-lavender-500 mt-2 text-center">
        AI responses may contain mistakes. Verify important facts with your teacher or textbook.
      </p>
    </div>
  );
}

function IconBtn({ icon: Icon, title, onClick }: { icon: typeof Copy; title: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg text-navy-400 hover:text-purple-600 hover:bg-purple-50 dark:text-lavender-500 dark:hover:bg-navy-800 dark:hover:text-purple-300"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
