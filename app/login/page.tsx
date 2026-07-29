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

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();

  const [authMode, setAuthMode] =
    useState<AuthMode>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] =
    useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const demoMode = !isSupabaseConfigured();

  function switchMode(mode: AuthMode) {
    setAuthMode(mode);
    setError(null);
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  }

  function validateForm(): string | null {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      return 'Please enter your email address.';
    }

    if (!cleanEmail.includes('@')) {
      return 'Please enter a valid email address.';
    }

    if (!password) {
      return 'Please enter your password.';
    }

    if (
      authMode === 'signup' &&
      password.length < 8
    ) {
      return 'Your password must contain at least 8 characters.';
    }

    if (
      authMode === 'signup' &&
      password !== confirmPassword
    ) {
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
      router.push('/student/dashboard');
      return;
    }

    setLoading(true);

    try {
      const supabase =
        createSupabaseBrowserClient();

      const cleanEmail = email
        .trim()
        .toLowerCase();

      if (authMode === 'login') {
        const {
          data,
          error: signInError,
        } =
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

        if (signInError) {
          if (
            /invalid login credentials/i.test(
              signInError.message
            )
          ) {
            setError(
              'The email or password is incorrect.'
            );
            return;
          }

          if (
            /email not confirmed/i.test(
              signInError.message
            )
          ) {
            setError(
              'Please confirm your email address before logging in.'
            );
            return;
          }

          setError(signInError.message);
          return;
        }

        if (!data.session) {
          setError(
            'Login could not be completed. Please try again.'
          );
          return;
        }

        router.replace('/dashboard');
        router.refresh();
        return;
      }

      const emailRedirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const {
        data,
        error: signUpError,
      } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo,
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

      if (data.session) {
        router.replace('/onboarding');
        router.refresh();
        return;
      }

      setSuccessMessage(
        'Your account has been created. Please check your email and click the confirmation link before logging in.'
      );

      setPassword('');
      setConfirmPassword('');
    } catch (authError) {
      console.error(
        'Authentication error:',
        authError
      );

      setError(
        'Something went wrong while connecting to the authentication service. Please try again.'
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

          <section className="card overflow-hidden">
            <div className="border-b border-navy-100 px-7 pt-7">
              <div className="grid grid-cols-2 rounded-xl bg-navy-50 p-1">
                <button
                  type="button"
                  onClick={() =>
                    switchMode('login')
                  }
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    authMode === 'login'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-navy-500 hover:text-navy-800'
                  }`}
                >
                  Log in
                </button>

                <button
                  type="button"
                  onClick={() =>
                    switchMode('signup')
                  }
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    authMode === 'signup'
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-navy-500 hover:text-navy-800'
                  }`}
                >
                  Sign up
                </button>
              </div>
            </div>

            <div className="p-7">
              <div className="mb-6">
                <h1 className="font-display text-2xl font-semibold text-navy-900">
                  {authMode === 'login'
                    ? 'Welcome back'
                    : 'Create your account'}
                </h1>

                <p className="mt-1.5 text-sm leading-6 text-navy-500">
                  {authMode === 'login'
                    ? 'Log in with your email and password to continue.'
                    : 'Create an account first. You can choose your role after signing up.'}
                </p>
              </div>

              {demoMode && (
                <div className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Demo mode is active. Any
                  credentials will open the sample
                  student dashboard.
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
                  <span>{successMessage}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
              >
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
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-navy-700"
                    >
                      Password
                    </label>

                    {authMode === 'login' && (
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-purple-600 hover:text-purple-700"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      autoComplete={
                        authMode === 'login'
                          ? 'current-password'
                          : 'new-password'
                      }
                      required
                      minLength={
                        authMode === 'signup'
                          ? 8
                          : undefined
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(
                          event.target.value
                        )
                      }
                      placeholder={
                        authMode === 'signup'
                          ? 'At least 8 characters'
                          : 'Enter your password'
                      }
                      disabled={loading}
                      className="w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
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

                {authMode === 'signup' && (
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
                      placeholder="Enter the password again"
                      disabled={loading}
                      className="w-full rounded-xl border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 outline-none transition placeholder:text-navy-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {authMode === 'login'
                        ? 'Logging in...'
                        : 'Creating account...'}
                    </>
                  ) : authMode === 'login' ? (
                    'Log in'
                  ) : (
                    'Create account'
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-navy-500">
                {authMode === 'login'
                  ? 'New to EduMind AI?'
                  : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() =>
                    switchMode(
                      authMode === 'login'
                        ? 'signup'
                        : 'login'
                    )
                  }
                  className="font-medium text-purple-600 hover:text-purple-700"
                >
                  {authMode === 'login'
                    ? 'Sign up'
                    : 'Log in'}
                </button>
              </p>
            </div>
          </section>

          <p className="mt-6 text-center text-xs leading-5 text-navy-400">
            By continuing, you agree to the
            platform&apos;s terms of service and
            privacy policy.
          </p>
        </div>
      </div>
    </main>
  );
}
