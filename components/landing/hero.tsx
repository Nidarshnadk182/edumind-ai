'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, TrendingUp, Target, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      {/* ambient gradient wash — quiet, not a spotlight */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(151,105,216,0.14),transparent)]"
      />

      <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="badge-ai mb-6">Built for students, teachers, parents & institutions</span>
          <h1 className="font-display text-4xl md:text-6xl font-semibold leading-[1.08] tracking-tight text-navy-900 dark:text-lavender-50">
            Learning content created for every student.
          </h1>
          <p className="mt-6 text-lg text-navy-600 dark:text-lavender-300 max-w-xl leading-relaxed">
            EduMind AI identifies individual learning gaps and generates personalised explanations, notes, quizzes and flashcards — so no two students get the same static syllabus.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/signup">
              <Button size="lg">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline">
                <PlayCircle className="h-4 w-4" /> View Demo
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-navy-500 dark:text-lavender-400">
            <span>Teacher-reviewed AI content</span>
            <span className="h-1 w-1 rounded-full bg-navy-300 dark:bg-navy-600" />
            <span>Built on Claude</span>
            <span className="h-1 w-1 rounded-full bg-navy-300 dark:bg-navy-600" />
            <span>Works in demo mode — no sign-up needed</span>
          </div>
        </motion.div>

        {/* Signature element: a living dashboard mock-up card that
            reads as "your gap, made visible" — the product's actual
            core idea rendered as an object, not a generic screenshot. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative"
        >
          <div className="card p-6 shadow-lift rotate-1">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-navy-400 dark:text-lavender-400">Today's focus</p>
                <p className="font-display font-semibold text-navy-900 dark:text-lavender-50">Option Greeks</p>
              </div>
              <span className="badge-ai">
                <Target className="h-3 w-3" /> Priority 91
              </span>
            </div>

            <div className="space-y-3 mb-5">
              <MiniBar label="Mastery" value={42} color="bg-purple-500" />
              <MiniBar label="Last quiz" value={55} color="bg-lavender-400" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatChip icon={Flame} label="Streak" value="6 days" />
              <StatChip icon={TrendingUp} label="Weekly" value="340 min" />
              <StatChip icon={Target} label="XP" value="1,280" />
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 card p-4 -rotate-2 hidden sm:block shadow-lift">
            <p className="text-xs text-navy-400 dark:text-lavender-400 mb-1">AI just generated</p>
            <p className="text-sm font-medium text-navy-800 dark:text-lavender-100">5 flashcards on Put-Call Parity</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-navy-500 dark:text-lavender-400 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-navy-50 dark:bg-navy-800 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-navy-50/70 dark:bg-navy-800/60 p-3 text-center">
      <Icon className="h-4 w-4 mx-auto mb-1 text-purple-600 dark:text-purple-300" />
      <p className="text-xs font-semibold text-navy-800 dark:text-lavender-100">{value}</p>
      <p className="text-[10px] text-navy-400 dark:text-lavender-400">{label}</p>
    </div>
  );
}
