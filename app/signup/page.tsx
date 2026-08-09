'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Brain,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  createSupabaseBrowserClient,
  isSupabaseConfigured,
} from '@/lib/database/supabase-browser';

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const demoMode = !isSupabaseConfigured();

  function validateForm(): string | null {
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      return 'Please enter your full name.';
    }

    if (!cleanEmail) {
      return 'Please enter your email address.';
    }

    if (!cleanEmail.includes('@')) {
      return 'Please enter a valid email address.';
    }

    if (!password) {
      return 'Please enter a password.';
    }

    if (password.length < 8) {
      return 'Your password must contain at least 8 characters.';
    }

    if (password !== confirmPassword) {
      return 'The passwords do not match.';
    }

    return null;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);
    setSuccessMessage(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (demoMode) {
      router.push('/signup/onboarding');
      return;
    }

    setLoading(true);

    try {
      const supabase =
        createSupabaseBrowserClient();

      const cleanEmail = email
        .trim()
        .toLowerCase();

      const cleanName = fullName.trim();

      const emailRedirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback?next=/signup/onboarding`
          : undefined;

      const {
        data,
        error: signUpError,
      } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: cleanName,
          },
        },
      });

      if (signUpError) {
        if (
          /already registered|already exists/i.test(
            signUpError.message
          )
        ) {
          setError(
            'An account already exists with this email. Please log in instead.'
          );
          return;
        }

        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError(
          'Your account could not be created. Please try again.'
        );
        return;
      }

      /*
       * Your Supabase database already has a trigger that
       * automatically creates a row inside profiles when a
       * new auth user is created.
       *
       * Therefore we DO NOT manually insert into profiles here.
       */

      if (data.session) {
        /*
         * Email confirmation is disabled or Supabase has created
         * the session immediately.
         *
         * Continue to role selection.
         */
        router.replace('/signup/onboarding');
        router.refresh();
        return;
      }

      /*
       * If email confirmation is enabled, Supabase creates the
       * account but does not create a logged-in session until the
       * email link is clicked.
       */
      setSuccessMessage(
        'Your account has been created. Please check your email and confirm your account. After confirmation, you will continue to EduMind AI setup.'
      );

      setPassword('');
      setConfirmPassword('');
    } catch (authError) {
      console.error(
        'Signup error:',
        authError
      );

      setError(
        'Something went wrong while creating your account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-canvas-light px-6 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-md items-center justify-center">

        <div className="w-full">

          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2 font-display font-semibold text-navy-900"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">
              <Brain className="h-5 w-5" />
            </span>

            <span className="text-lg">
              EduMind AI
            </span>
          </Link>

          <section className="card p-7">

            <div className="mb-6">
              <h1 className="font-display text-2xl font-semibold text-navy-900">
                Create your account
              </h1>

              <p className="mt-1.5 text-sm leading-6 text-navy-500">
                Sign up first. You&apos;ll choose whether
                you&apos;re a student, teacher, or
                institution afterwards.
              </p>
            </div>

            {demoMode && (
              <div className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Supabase is not configured, so the app is
                currently running in demo mode.
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="mb-5 flex items-start gap-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                <span>
                  {successMessage}
                </span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              <div>
                <label
                  htmlFor="fullName"
                  className="mb-1.5 block text-sm font-medium text-navy-700"
                >
                  Full name
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  placeholder="Your full name"
                  disabled={loading}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-navy-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@example.com"
                  disabled={loading}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-navy-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="At least 8 characters"
                    disabled={loading}
                    className="w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) =>
                          !current
                      )
                    }
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-navy-400 hover:text-navy-700"
                    aria-label={
                      showPassword
                        ? 'Hide password'
                        : 'Show password'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-medium text-navy-700"
                >
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter your password again"
                  disabled={loading}
                  className="w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>

            <div className="mt-6 border-t border-navy-100 pt-5">
              <p className="text-center text-sm text-navy-500">
                Already have an account?{' '}

                <Link
                  href="/login"
                  className="font-medium text-purple-600 hover:text-purple-700"
                >
                  Log in
                </Link>
              </p>
            </div>

          </section>

          <p className="mt-6 text-center text-xs leading-5 text-navy-400">
            By creating an account, you agree to
            EduMind AI&apos;s terms and privacy policy.
          </p>

        </div>
      </div>
    </main>
  );
}
