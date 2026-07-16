import { SiteNavbar } from '@/components/shared/site-navbar';
import { Footer } from '@/components/landing/footer';
import { RECOMMENDATION_FACTORS_EXPLAINED } from '@/lib/recommendations/engine';

export default function ResponsibleAiPage() {
  return (
    <>
      <SiteNavbar />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-3xl font-semibold text-navy-900 mb-2">Responsible AI Policy</h1>
        <p className="text-sm text-navy-400 mb-8">Placeholder — for an academic demonstration project. Describes design intent, not a certified compliance claim.</p>

        <div className="space-y-6 text-navy-600 text-sm leading-relaxed">
          <section>
            <h2 className="font-display font-semibold text-navy-900 mb-2">Human oversight</h2>
            <p>AI-generated notes, quizzes, and flashcards are suggestions. Teachers review and approve material before it reaches a class; students can flag anything as unclear or wrong.</p>
          </section>
          <section>
            <h2 className="font-display font-semibold text-navy-900 mb-2">Transparent labelling</h2>
            <p>All AI-generated content is visibly labelled throughout the interface — it is never presented as human-authored.</p>
          </section>
          <section>
            <h2 className="font-display font-semibold text-navy-900 mb-2">Transparent recommendations</h2>
            <p>The learning-path recommendation engine is a simple, rule-based system — not a black box. Every factor it uses is listed below and shown to students on their Learning Path page.</p>
            <ul className="mt-3 space-y-2">
              {RECOMMENDATION_FACTORS_EXPLAINED.map((f) => (
                <li key={f.factor}>
                  <span className="font-medium text-navy-800">{f.factor}:</span> {f.effect}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-display font-semibold text-navy-900 mb-2">Data minimisation & privacy</h2>
            <p>Only data needed to identify learning gaps is collected. Row-level security limits access strictly to authorised accounts — see the Privacy Policy for details.</p>
          </section>
          <section>
            <h2 className="font-display font-semibold text-navy-900 mb-2">Bias monitoring</h2>
            <p>Generated examples and explanations should be periodically reviewed for skewed framing or unrepresentative examples as the project matures beyond a prototype.</p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
