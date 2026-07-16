const phases = [
  { phase: 'Phase 1', title: 'Data collection & foundational prototype', description: 'Core dashboards, AI tutor, notes, quizzes and flashcards live in demo mode.' },
  { phase: 'Phase 2', title: 'Pilot for one subject, one classroom', description: 'A single teacher and class use EduMind AI with real students and real content review.' },
  { phase: 'Phase 3', title: 'Multi-subject scaling & full recommendation layer', description: 'Expand across subjects and institutions with a refined, data-driven recommendation engine.' },
];

export function Roadmap() {
  return (
    <section className="py-20 border-t border-navy-100 dark:border-navy-800">
      <div className="mx-auto max-w-4xl px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-2">Where we're headed</p>
          <h2 className="font-display text-3xl font-semibold text-navy-900 dark:text-lavender-50">Roadmap</h2>
        </div>
        <div className="space-y-6">
          {phases.map((p) => (
            <div key={p.phase} className="card p-6 flex gap-6 items-start">
              <span className="shrink-0 font-display text-sm font-semibold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 rounded-lg px-3 py-1.5">
                {p.phase}
              </span>
              <div>
                <h3 className="font-medium text-navy-900 dark:text-lavender-50">{p.title}</h3>
                <p className="text-sm text-navy-500 dark:text-lavender-400 mt-1">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
