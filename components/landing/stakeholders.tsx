import { GraduationCap, Presentation, Heart, Building2 } from 'lucide-react';

const groups = [
  { icon: GraduationCap, title: 'Students', description: 'Get explanations pitched at your level, practice built around your actual gaps, and a clear next step every day.' },
  { icon: Presentation, title: 'Teachers', description: 'See exactly which students and topics need attention, and review every piece of AI-generated content before it reaches a class.' },
  { icon: Heart, title: 'Parents', description: 'Follow progress, strengths and upcoming assessments — without access to your child\u2019s private tutor conversations.' },
  { icon: Building2, title: 'Institutions', description: 'Track engagement and outcomes across cohorts with aggregated, privacy-respecting analytics.' },
];

export function Stakeholders() {
  return (
    <section id="stakeholders" className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-purple-600 dark:text-purple-300 mb-2">Four groups, one loop</p>
          <h2 className="font-display text-3xl font-semibold text-navy-900 dark:text-lavender-50">Built for everyone around the learner</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {groups.map((g) => (
            <div key={g.title} className="text-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-white dark:bg-purple-600 mb-4">
                <g.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display font-semibold text-navy-900 dark:text-lavender-50 mb-2">{g.title}</h3>
              <p className="text-sm text-navy-500 dark:text-lavender-400 leading-relaxed">{g.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
