import { Eye, UserCheck, Database, ShieldCheck, ClipboardCheck, Scale, Tag } from 'lucide-react';

const commitments = [
  { icon: UserCheck, title: 'Human oversight', description: 'AI suggests; teachers and students decide what to keep.' },
  { icon: ClipboardCheck, title: 'Teacher approval', description: 'AI-generated material for a class is reviewed before students see it.' },
  { icon: Database, title: 'Data minimisation', description: 'We collect only what is needed to identify and close learning gaps.' },
  { icon: ShieldCheck, title: 'Privacy protection', description: 'Row-level security ensures each account only reaches its own authorised data.' },
  { icon: Eye, title: 'AI-content review', description: 'Every generated note, quiz and answer can be flagged and revised.' },
  { icon: Scale, title: 'Bias monitoring', description: 'Content generation is checked for skewed examples or framing over time.' },
  { icon: Tag, title: 'Transparent labels', description: 'AI-generated content is always marked as such, never presented as human-authored.' },
];

export function ResponsibleAi() {
  return (
    <section id="responsible-ai" className="py-20 border-t border-navy-100 dark:border-navy-800 bg-navy-900 dark:bg-navy-950">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-medium text-lavender-300 mb-2">Our commitment</p>
          <h2 className="font-display text-3xl font-semibold text-white">Responsible AI, by design</h2>
          <p className="mt-3 text-navy-300 max-w-2xl mx-auto text-sm">
            This is a demonstration project and does not claim certified legal or regulatory compliance. The principles below describe our design intent.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {commitments.map((c) => (
            <div key={c.title} className="rounded-2xl bg-navy-800/60 border border-navy-700 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20 text-lavender-300 mb-4">
                <c.icon className="h-4.5 w-4.5" />
              </span>
              <h3 className="font-medium text-white mb-1.5">{c.title}</h3>
              <p className="text-sm text-navy-300 leading-relaxed">{c.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
