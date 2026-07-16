// ─────────────────────────────────────────────────────────
// Supabase clients for server-side use only.
// - createSupabaseServerClient(): respects the signed-in user's
//   session + RLS policies. Use for almost everything.
// - createSupabaseServiceClient(): uses the SERVICE ROLE key and
//   BYPASSES row-level security. Only use for trusted server-only
//   operations (e.g. admin aggregate analytics) — never expose
//   its result directly to a user without an authorisation check.
// Both are safe here because this file is never imported by
// client components (Next.js "server-only" boundary).
// ─────────────────────────────────────────────────────────
import 'server-only';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isSupabaseConfigured } from './supabase-browser';

export { isSupabaseConfigured };

export function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured — use demo mode data instead.');
  }
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — safe to ignore when
            // middleware is refreshing the session.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // See note above.
          }
        },
      },
    }
  );
}

export function createSupabaseServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Supabase service role is not configured — use demo mode data instead.');
  }
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
