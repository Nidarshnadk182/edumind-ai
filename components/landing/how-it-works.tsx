import { Database, Brain, Wand2, Compass, LineChart } from 'lucide-react';

const steps = [
  { icon: Database, title: 'Capture data', description: 'Quiz scores, doubts asked, time spent, and lesson completion feed a live picture of each student.' },
  { icon: Brain, title: 'Understand the gap', description: 'NLP reads the student\u2019s questions and answers to pinpoint exactly which concept is missing.' },
  { icon: Wand2, title: 'Generate content', description: 'Fresh notes, quizzes and flashcards are created for that specific gap — not pulled from a fixed bank.' },
  { icon: Compass, title: 'Recommend next step', description: 'A transparent scoring engine ranks what to study next, and explains why.' },
  { icon: LineChart, title: 'Measure & improve', description: 'New results flow back into the loop, refining every future recommendation.' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-2">The loop</p>
          <h2 className="font-display text-3xl font-semibold text-navy-900 dark:text-lavender-50">How EduMind AI works</h2>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          {steps.map((step, i) => (
            <div key={step.title} className="relative">
              <div className="card p-5 h-full">
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                    <step.icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="text-xs font-mono text-navy-300 dark:text-navy-600">Step {i + 1}</span>
                </div>
                <h3 className="font-display font-semibold text-navy-900 dark:text-lavender-50 mb-2">{step.title}</h3>
                <p className="text-sm text-navy-500 dark:text-lavender-400 leading-relaxed">{step.description}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-navy-200 dark:bg-navy-700" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
