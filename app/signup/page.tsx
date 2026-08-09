'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Brain,
  GraduationCap,
  School,
  Building2,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/lib/database/supabase-browser';

type Role = 'student' | 'teacher' | 'institution';

const ROLE_OPTIONS: Array<{
  role: Role;
  title: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}> = [
  {
    role: 'student',
    title: 'Student',
    description:
      'Learn with the AI Tutor, take practice tests, track scores and receive personalised study plans.',
    icon: GraduationCap,
  },
  {
    role: 'teacher',
    title: 'Teacher',
    description:
      'Manage learning activities, review student performance and support students with AI-assisted insights.',
    icon: School,
  },
  {
    role: 'institution',
    title: 'Institution',
    description:
      'Manage users, monitor academic performance and view institution-level learning analytics.',
    icon: Building2,
  },
];

export default function RoleOnboardingPage() {
  const router = useRouter();

  const [selectedRole, setSelectedRole] =
    useState<Role | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [checkingSession, setCheckingSession] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  const demoMode =
    !isSupabaseConfigured();

  useEffect(() => {
    async function checkSession() {
      if (demoMode) {
        setCheckingSession(false);
        return;
      }

      try {
        const supabase =
          createSupabaseBrowserClient();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace('/login');
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select(
            'role, onboarding_completed'
          )
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            'Profile lookup error:',
            profileError
          );

          setError(
            'We could not load your profile. Please try again.'
          );

          setCheckingSession(false);
          return;
        }

        /*
         * If onboarding has already been completed,
         * the user should not select their role again.
         */
        if (
          profile?.onboarding_completed &&
          profile?.role
        ) {
          router.replace(
            `/${profile.role}/dashboard`
          );

          return;
        }
      } catch (sessionError) {
        console.error(
          'Session check error:',
          sessionError
        );

        setError(
          'We could not verify your account. Please log in again.'
        );
      } finally {
        setCheckingSession(false);
      }
    }

    void checkSession();
  }, [demoMode, router]);

  async function handleContinue() {
    if (!selectedRole) {
      setError(
        'Please select how you will use EduMind AI.'
      );
      return;
    }

    setError(null);
    setSuccess(false);

    if (demoMode) {
      if (selectedRole === 'student') {
        router.push(
          '/signup/onboarding/student'
        );
        return;
      }

      if (selectedRole === 'teacher') {
        router.push(
          '/signup/onboarding/teacher'
        );
        return;
      }

      router.push(
        '/institution/dashboard'
      );

      return;
    }

    setLoading(true);

    try {
      const supabase =
        createSupabaseBrowserClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError(
          'Your session has expired. Please log in again.'
        );

        router.replace('/login');
        return;
      }

      /*
       * Save the selected role.
       *
       * onboarding_completed remains FALSE for students
       * and teachers because they still have another
       * profile setup page to complete.
       *
       * Institution onboarding is currently completed
       * here because the existing project does not yet
       * contain a separate institution setup page.
       */
      const onboardingCompleted =
        selectedRole === 'institution';

      const {
        error: updateError,
      } = await supabase
        .from('profiles')
        .update({
          role: selectedRole,
          onboarding_completed:
            onboardingCompleted,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(
          'Role update error:',
          updateError
        );

        setError(
          'We could not save your role. Please try again.'
        );

        return;
      }

      setSuccess(true);

      if (selectedRole === 'student') {
        router.replace(
          '/signup/onboarding/student'
        );

        return;
      }

      if (selectedRole === 'teacher') {
        router.replace(
          '/signup/onboarding/teacher'
        );

        return;
      }

      /*
       * Institution profile setup will be built as
       * its own step next.
       */
      router.replace(
        '/institution/dashboard'
      );

      router.refresh();
    } catch (onboardingError) {
      console.error(
        'Role onboarding error:',
        onboardingError
      );

      setError(
        'Something went wrong while saving your account type. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas-light">
        <div className="flex flex-col items-center gap-3 text-navy-600">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />

          <p className="text-sm">
            Preparing your account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-canvas-light px-6 py-12">
      <div className="mx-auto w-full max-w-3xl">

        <div className="mb-8 flex items-center justify-center gap-2 font-display font-semibold text-navy-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">
            <Brain className="h-5 w-5" />
          </span>

          <span className="text-lg">
            EduMind AI
          </span>
        </div>

        <section className="card p-7 md:p-9">

          <div className="mx-auto mb-8 max-w-xl text-center">

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-purple-600">
              Account setup
            </p>

            <h1 className="font-display text-2xl font-semibold text-navy-900 md:text-3xl">
              How will you use EduMind AI?
            </h1>

            <p className="mt-3 text-sm leading-6 text-navy-500">
              Choose your role so we can personalise
              your dashboard and learning experience.
            </p>

          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4" />

              Role saved successfully.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">

            {ROLE_OPTIONS.map(
              ({
                role,
                title,
                description,
                icon: Icon,
              }) => {
                const selected =
                  selectedRole === role;

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(
                        role
                      );

                      setError(null);
                    }}
                    disabled={loading}
                    className={`group relative rounded-2xl border p-5 text-left transition-all ${
                      selected
                        ? 'border-purple-500 bg-purple-50 shadow-sm ring-2 ring-purple-100'
                        : 'border-navy-200 bg-white hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    )}

                    <div
                      className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                        selected
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-50 text-purple-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <h2 className="font-display text-base font-semibold text-navy-900">
                      {title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-navy-500">
                      {description}
                    </p>
                  </button>
                );
              }
            )}

          </div>

          <div className="mt-8">

            <Button
              type="button"
              className="w-full"
              disabled={
                !selectedRole ||
                loading
              }
              onClick={
                handleContinue
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>

          </div>

          <p className="mt-5 text-center text-xs leading-5 text-navy-400">
            Your role controls which tools and
            dashboards are available to you.
          </p>

        </section>

      </div>
    </main>
  );
}
