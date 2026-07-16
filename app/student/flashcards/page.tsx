'use client';

import { useState } from 'react';
import { Layers, Shuffle, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DEMO_FLASHCARDS, DEMO_FLASHCARD_DECKS } from '@/lib/database/demo-data';

export default function FlashcardsPage() {
  const [deckId, setDeckId] = useState(DEMO_FLASHCARD_DECKS[0]!.id);
  const [cards, setCards] = useState(DEMO_FLASHCARDS.filter((c) => c.deck_id === deckId));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  function switchDeck(id: string) {
    setDeckId(id);
    setCards(DEMO_FLASHCARDS.filter((c) => c.deck_id === id));
    setIndex(0);
    setFlipped(false);
  }

  function shuffle() {
    setCards((c) => [...c].sort(() => Math.random() - 0.5));
    setIndex(0);
    setFlipped(false);
  }

  function next() {
    setFlipped(false);
    setIndex((i) => (i + 1) % cards.length);
  }
  function prev() {
    setFlipped(false);
    setIndex((i) => (i - 1 + cards.length) % cards.length);
  }

  const card = cards[index];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-lavender-50 flex items-center gap-2">
          <Layers className="h-6 w-6 text-purple-600 dark:text-purple-300" /> Flashcards
        </h1>
        <p className="text-sm text-navy-500 dark:text-lavender-400">Review with spaced repetition.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DEMO_FLASHCARD_DECKS.map((d) => (
          <button
            key={d.id}
            onClick={() => switchDeck(d.id)}
            className={cn(
              'text-xs rounded-full border px-3 py-1.5 font-medium',
              deckId === d.id ? 'border-purple-400 bg-purple-50 text-purple-700 dark:bg-purple-900/20' : 'border-navy-200 dark:border-navy-700 text-navy-600 dark:text-lavender-300'
            )}
          >
            {d.title}
          </button>
        ))}
        <button className="text-xs rounded-full border border-dashed border-navy-300 dark:border-navy-600 px-3 py-1.5 font-medium text-navy-500 dark:text-lavender-400 inline-flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> Generate with AI
        </button>
      </div>

      {card ? (
        <>
          <div className="flex justify-between text-xs text-navy-500 dark:text-lavender-400">
            <span>Card {index + 1} of {cards.length}</span>
            <button onClick={shuffle} className="inline-flex items-center gap-1 hover:text-purple-600">
              <Shuffle className="h-3.5 w-3.5" /> Shuffle
            </button>
          </div>

          <button
            onClick={() => setFlipped((f) => !f)}
            className="w-full"
            style={{ perspective: '1000px' }}
          >
            <div
              className="card min-h-[220px] flex items-center justify-center p-8 text-center transition-transform duration-300"
              style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none' }}
            >
              <p
                className="text-navy-900 dark:text-lavender-50 font-medium text-lg leading-relaxed"
                style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}
              >
                {flipped ? card.back : card.front}
              </p>
            </div>
          </button>
          <p className="text-center text-xs text-navy-400 dark:text-lavender-500">Tap the card to flip</p>

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={prev}><ChevronLeft className="h-4 w-4" /> Prev</Button>
            <div className="flex gap-2">
              <DifficultyBtn label="Easy" color="text-emerald-600 border-emerald-200" />
              <DifficultyBtn label="Medium" color="text-amber-600 border-amber-200" />
              <DifficultyBtn label="Difficult" color="text-red-600 border-red-200" />
            </div>
            <Button variant="outline" size="sm" onClick={next}>Next <ChevronRight className="h-4 w-4" /></Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-navy-500 dark:text-lavender-400">
            <Star className={cn('h-4 w-4', card.is_starred ? 'fill-amber-400 text-amber-400' : '')} />
            {card.is_starred ? 'Starred' : 'Star this card'}
            <span className="mx-2">·</span>
            Spaced repetition stage {card.spaced_repetition_stage}
          </div>
        </>
      ) : (
        <p className="text-sm text-navy-400 dark:text-lavender-500 text-center py-12">No cards in this deck yet.</p>
      )}
    </div>
  );
}

function DifficultyBtn({ label, color }: { label: string; color: string }) {
  return (
    <button className={cn('text-xs rounded-lg border px-3 py-1.5 font-medium', color)}>
      {label}
    </button>
  );
}
