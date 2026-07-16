'use client';

import { useCallback, useEffect, useState } from 'react';
import { ClipboardCheck, Check, X, RotateCcw, Loader2, Database } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AiGeneratedLabel } from '@/components/shared/ai-label';

type ReviewItem = {
  id: string;
  title: string;
  content: string;
  approval_status: string;
  created_at: string;
  topics?: { name?: string } | null;
};

export default function TeacherReviewsPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reviews', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Could not load reviews.');
      setItems(payload.data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadItems(); }, [loadItems]);

  async function decide(id: string, decision: 'approved' | 'rejected' | 'revision_requested') {
    const previous = items;
    setSavingId(id);
    setError('');
    setNotice('');
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materialId: id, decision, recipientIds: [] }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message || 'Review could not be saved.');
      setNotice(decision === 'approved' ? 'Content approved and saved. Select recipients during publication.' : decision === 'rejected' ? 'Content rejected and saved.' : 'Revision requested and saved.');
    } catch (err) {
      setItems(previous);
      setError(err instanceof Error ? err.message : 'Review could not be saved.');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50 flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-purple-600 dark:text-purple-300" /> Content Reviews
          </h1>
          <p className="text-sm text-navy-500 dark:text-lavender-400">These decisions are saved to the database and retained after refresh.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadItems()} disabled={loading}><RotateCcw className="h-3.5 w-3.5" /> Refresh</Button>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
      {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</div>}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-purple-500" /></div>
      ) : items.length === 0 && !error ? (
        <Card className="text-center py-12">
          <Database className="h-9 w-9 mx-auto mb-3 text-navy-300" />
          <CardTitle>No pending material</CardTitle>
          <p className="mt-2 text-sm text-navy-500 dark:text-lavender-400">AI-generated submissions awaiting review will appear here.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex items-center justify-between mb-2">
                <AiGeneratedLabel pendingReview />
                <span className="text-xs text-navy-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <CardTitle className="!text-base">{item.title}</CardTitle>
              <p className="text-xs text-navy-400 dark:text-lavender-500 mb-3">{item.topics?.name || 'General material'}</p>
              <p className="text-sm text-navy-600 dark:text-lavender-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" disabled={savingId === item.id} onClick={() => void decide(item.id, 'approved')}><Check className="h-3.5 w-3.5" /> Approve</Button>
                <Button size="sm" variant="outline" disabled={savingId === item.id} onClick={() => void decide(item.id, 'revision_requested')}><RotateCcw className="h-3.5 w-3.5" /> Request revision</Button>
                <Button size="sm" variant="outline" disabled={savingId === item.id} onClick={() => void decide(item.id, 'rejected')}><X className="h-3.5 w-3.5" /> Reject</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
