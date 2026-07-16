import { Users, GraduationCap, TrendingUp, BookOpen, Activity, ShieldCheck } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { DemoModeLabel } from '@/components/shared/ai-label';
import { isSupabaseConfigured } from '@/lib/database/supabase-server';

export default function InstitutionDashboardPage() {
  const demoMode = !isSupabaseConfigured();

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-semibold text-navy-900 dark:text-lavender-50">Institution Overview</h1>
          <p className="text-sm text-navy-500 dark:text-lavender-400">Aggregated, privacy-respecting analytics across all classes.</p>
        </div>
        {demoMode && <DemoModeLabel />}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Active students" value="486" />
        <StatCard icon={Users} label="Active teachers" value="24" />
        <StatCard icon={Activity} label="Engagement rate" value="72%" />
        <StatCard icon={TrendingUp} label="Course completion" value="64%" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Most difficult subjects</CardTitle>
          <CardDescription>By average mastery improvement this term</CardDescription>
          <div className="mt-4 space-y-3">
            {[
              { subject: 'Econometrics', improvement: 12 },
              { subject: 'Derivatives', improvement: 18 },
              { subject: 'Strategic Management', improvement: 26 },
              { subject: 'Corporate Finance', improvement: 34 },
            ].map((s) => (
              <div key={s.subject}>
                <div className="flex justify-between text-xs text-navy-500 dark:text-lavender-400 mb-1">
                  <span>{s.subject}</span>
                  <span>+{s.improvement}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-navy-100 dark:bg-navy-800 overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${s.improvement * 2}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-300" />
            <CardTitle className="!text-base">AI-content review status</CardTitle>
          </div>
          <CardDescription>Across all classes</CardDescription>
          <div className="mt-4 space-y-3">
            <ReviewRow label="Approved" value={214} color="bg-emerald-400" />
            <ReviewRow label="Pending" value={18} color="bg-amber-400" />
            <ReviewRow label="Rejected" value={9} color="bg-red-400" />
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-4 w-4 text-purple-600 dark:text-purple-300" />
          <CardTitle className="!text-base">Retention & usage trend</CardTitle>
        </div>
        <CardDescription>90-day active-student retention: 81% — no individual student data is exposed at this level.</CardDescription>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card className="!p-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-navy-800 dark:text-purple-300 mb-3">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="text-xl font-display font-semibold text-navy-900 dark:text-lavender-50">{value}</p>
      <p className="text-xs text-navy-500 dark:text-lavender-400">{label}</p>
    </Card>
  );
}

function ReviewRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-sm text-navy-600 dark:text-lavender-300 flex-1">{label}</span>
      <span className="text-sm font-medium text-navy-800 dark:text-lavender-100">{value}</span>
    </div>
  );
}
