'use client';

import { useState } from 'react';
import { NotebookPen, Loader2, Save, Copy, Download, Printer, ListChecks, Layers } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function NotesGeneratorPage() {
  const [sourceText, setSourceText] = useState('');
  const [length, setLength] = useState<'short' | 'detailed' | 'exam_focused'>('short');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setNotes(null);
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType: 'text', sourceText, length, difficulty, language }),
      });
      const json = await res.json();
      setNotes(json.success ? json.data.content : `Error: ${json.error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50 flex items-center gap-2">
          <NotebookPen className="h-6 w-6 text-purple-600 dark:text-purple-300" /> Notes Generator
        </h1>
        <p className="text-sm text-navy-500 dark:text-lavender-400">Paste text or a topic, and get structured revision notes.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="!text-base">Source material</CardTitle>
          <CardDescription>Paste text, or type a topic name.</CardDescription>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={8}
            placeholder="e.g. Paste your lecture notes, or type 'Weighted Average Cost of Capital'"
            className="mt-4 w-full rounded-xl border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <p className="text-xs text-navy-400 dark:text-lavender-500 mt-2">
            File upload (PDF, DOCX, PPTX) uses placeholder extraction in this version — see /student/notes upload flow. Real parsers can be connected later.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <Select label="Length" value={length} onChange={(v) => setLength(v as any)} options={[
              { value: 'short', label: 'Short' },
              { value: 'detailed', label: 'Detailed' },
              { value: 'exam_focused', label: 'Exam-focused' },
            ]} />
            <Select label="Difficulty" value={difficulty} onChange={(v) => setDifficulty(v as any)} options={[
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]} />
            <Select label="Language" value={language} onChange={setLanguage} options={[
              { value: 'en', label: 'English' },
              { value: 'hi', label: 'Hindi' },
              { value: 'kn', label: 'Kannada' },
            ]} />
          </div>

          <Button className="w-full mt-5" onClick={generate} disabled={loading || !sourceText.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate notes'}
          </Button>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle className="!text-base">Generated notes</CardTitle>
            {notes && (
              <div className="flex items-center gap-1">
                <IconBtn icon={Save} title="Save" />
                <IconBtn icon={Copy} title="Copy" onClick={() => navigator.clipboard.writeText(notes)} />
                <IconBtn icon={Download} title="Download" />
                <IconBtn icon={Printer} title="Print" />
                <IconBtn icon={ListChecks} title="Convert to quiz" />
                <IconBtn icon={Layers} title="Convert to flashcards" />
              </div>
            )}
          </div>
          <div className="mt-4 min-h-[280px]">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-navy-400 dark:text-lavender-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Generating notes…
              </div>
            )}
            {!loading && !notes && (
              <p className="text-sm text-navy-400 dark:text-lavender-500">Your generated notes will appear here.</p>
            )}
            {notes && <div className="text-sm text-navy-700 dark:text-lavender-200 whitespace-pre-wrap leading-relaxed">{notes}</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-navy-600 dark:text-lavender-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-navy-200 dark:border-navy-700 dark:bg-navy-900 px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function IconBtn({ icon: Icon, title, onClick }: { icon: typeof Save; title: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} title={title} className={cn('p-1.5 rounded-lg text-navy-400 hover:text-purple-600 hover:bg-purple-50 dark:text-lavender-500 dark:hover:bg-navy-800')}>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
