import { SiteNavbar } from '@/components/shared/site-navbar';
import { Hero } from '@/components/landing/hero';
import { Problem } from '@/components/landing/problem';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Features } from '@/components/landing/features';
import { Stakeholders } from '@/components/landing/stakeholders';
import { ResponsibleAi } from '@/components/landing/responsible-ai';
import { Roadmap } from '@/components/landing/roadmap';
import { Footer } from '@/components/landing/footer';

export default function HomePage() {
  return (
    <>
      <SiteNavbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <Stakeholders />
      <ResponsibleAi />
      <Roadmap />
      <Footer />
    </>
  );
}
