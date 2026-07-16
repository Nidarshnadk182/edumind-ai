import {
  MessageCircleQuestion,
  NotebookPen,
  ListChecks,
  Layers,
  Route,
  Target,
  CalendarClock,
  LineChart,
  Mic,
  Languages,
} from 'lucide-react';

const features = [
  { icon: MessageCircleQuestion, title: 'AI tutor', description: 'A conversational tutor that explains, simplifies, and adapts to how you learn.' },
  { icon: NotebookPen, title: 'Notes generator', description: 'Turn any topic, text, or file into structured revision notes.' },
  { icon: ListChecks, title: 'Quiz generator', description: 'Auto-built quizzes from a topic, your notes, or a past conversation.' },
  { icon: Layers, title: 'Flashcard generator', description: 'Spaced-repetition flashcards created from your material in seconds.' },
  { icon: Route, title: 'Personalised learning path', description: 'A sequence built around your actual gaps, not a fixed syllabus order.' },
  { icon: Target, title: 'Weak-topic detection', description: 'See exactly which topics need attention and why, at a glance.' },
  { icon: CalendarClock, title: 'Study planner', description: 'A day-by-day plan that adapts around your exam date and free hours.' },
  { icon: LineChart, title: 'Progress analytics', description: 'Mastery, quiz trends, and study time visualised over time.' },
  { icon: Mic, title: 'Voice learning', description: 'Ask doubts and hear explanations read aloud for hands-free review.' },
  { icon: Languages, title: 'Multi-language support', description: 'Learn and ask questions in your preferred language.' },
];

export function Features() {
  return (
    <section id="features" className="py-20 border-t border-navy-100 dark:border-navy-800">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-2">Everything in one place</p>
          <h2 className="font-display text-3xl font-semibold text-navy-900 dark:text-lavender-50">Built for the whole learning loop</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lavender-100 text-purple-700 dark:bg-navy-800 dark:text-lavender-200 mb-4">
                <f.icon className="h-4.5 w-4.5" />
              </span>
              <h3 className="font-medium text-navy-900 dark:text-lavender-50 mb-1.5">{f.title}</h3>
              <p className="text-sm text-navy-500 dark:text-lavender-400 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
