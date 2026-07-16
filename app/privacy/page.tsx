import { SiteNavbar } from '@/components/shared/site-navbar';
import { Footer } from '@/components/landing/footer';

export default function PrivacyPage() {
  return (
    <>
      <SiteNavbar />
      <div className="mx-auto max-w-2xl px-6 py-16 prose-container">
        <h1 className="font-display text-3xl font-semibold text-navy-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-navy-400 mb-8">Placeholder — for an academic demonstration project. Not independently legally verified.</p>

        <div className="space-y-6 text-navy-600 text-sm leading-relaxed">
          <section>
            <h2 className="font-display font-semibold text-navy-900 mb-2">What we collect</h2>
            <p>EduMind AI collects the minimum data needed to identify learning gaps and generate personalised content: account details, subjects and goals you provide, quiz and interaction results, and content you generate or upload.</p>
          </section>
          <section>
            <h2 className="font-display font-semibold text-navy-900 mb-2">How it's used</h2>
            <p>Data is used to power dashboards, the recommendation engine, and AI-generated content for your account. Row-level security ensures other users cannot access your data without explicit, consented sharing (e.g. a linked parent account).</p>
          </section>
          <section>
            <h2 className="font-display font-semibold text-navy-900 mb-2">AI tutor conversations</h2>
            <p>Conversations with the AI tutor are private to the student by default and are not visible to linked parent accounts.</p>
          </section>
          <section>
            <h2 className="font-display font-semibold text-navy-900 mb-2">Data deletion</h2>
            <p>You may request deletion of your account and associated data at any time.</p>
          </section>
          <section>
            <h2 className="font-display font-semibold text-navy-900 mb-2">Compliance</h2>
            <p>This project does not claim certified compliance with any specific data-protection regulation. Consult a qualified professional before using this codebase with real student data.</p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
