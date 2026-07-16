// ─────────────────────────────────────────────────────────
// Supabase client for use in Client Components.
// Uses only the public URL + anon key — safe for the browser.
// ─────────────────────────────────────────────────────────
import { createBrowserClient } from '@supabase/ssr';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. The app should be running in demo mode instead of calling this function.'
    );
  }
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
  );
}
