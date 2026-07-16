import Link from 'next/link';
import { GraduationCap, Presentation, Heart, Building2, ArrowRight } from 'lucide-react';
import { SiteNavbar } from '@/components/shared/site-navbar';
import { Footer } from '@/components/landing/footer';
import { Card } from '@/components/ui/card';
import { DemoModeLabel } from '@/components/shared/ai-label';

const DEMO_ROLES = [
  { role: 'student', label: 'Student', icon: GraduationCap, href: '/student/dashboard', description: 'Explore the AI tutor, notes, quizzes, flashcards and learning path.' },
  { role: 'teacher', label: 'Teacher', icon: Presentation, href: '/teacher/dashboard', description: 'See class performance, weak-topic detection and content review.' },
  { role: 'parent', label: 'Parent', icon: Heart, href: '/parent/dashboard', description: 'Follow a student\u2019s progress, strengths and upcoming assessments.' },
  { role: 'institution', label: 'Institution', icon: Building2, href: '/institution/dashboard', description: 'Review aggregated engagement and outcome analytics.' },
];

export default function DemoPage() {
  return (
    <>
      <SiteNavbar />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center mb-4">
          <DemoModeLabel />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-navy-900 text-center mb-3">Explore EduMind AI</h1>
        <p className="text-navy-600 text-center max-w-xl mx-auto mb-12">
          No sign-up needed. Every dashboard below runs on realistic sample data — the same demo mode the app falls back to when Supabase and AI credentials aren't configured.
        </p>

        <div className="grid sm:grid-cols-2 gap-5">
          {DEMO_ROLES.map((r) => (
            <Link key={r.role} href={r.href}>
              <Card className="h-full hover:shadow-lift transition-shadow">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-4">
                  <r.icon className="h-5 w-5" />
                </span>
                <h3 className="font-display font-semibold text-navy-900 mb-1.5">{r.label} dashboard</h3>
                <p className="text-sm text-navy-500 mb-4">{r.description}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-purple-600">
                  Explore <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
