// ─────────────────────────────────────────────────────────
// Server-side auth helpers: get the current user + enforce
// role-based access control. Used by protected route layouts,
// server actions and API routes.
// ─────────────────────────────────────────────────────────
import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/database/supabase-server';
import type { Profile, UserRole } from '@/types/database';
import { DEMO_STUDENT } from '@/lib/database/demo-data';

export interface SessionUser {
  id: string;
  email: string | null;
  profile: Profile;
}

/**
 * Returns the current session user, or null if unauthenticated.
 * In demo mode (no Supabase configured), returns a mock student
 * session so every page remains explorable without sign-up —
 * clearly labelled as demo data throughout the UI.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!isSupabaseConfigured()) {
    return {
      id: DEMO_STUDENT.profileId,
      email: 'demo.student@edumind.ai',
      profile: {
        id: DEMO_STUDENT.profileId,
        role: 'student',
        full_name: DEMO_STUDENT.fullName,
        avatar_url: null,
        preferred_language: 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  return { id: user.id, email: user.email ?? null, profile: profile as Profile };
}

/**
 * Guards a page/layout so only authenticated users can render it.
 * Redirects to /login otherwise.
 */
export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }
  return session;
}

/**
 * Guards a page/layout so only users with an allowed role can render it.
 * Redirects unauthenticated users to /login, and authenticated users
 * with the wrong role to their own dashboard.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!allowedRoles.includes(session.profile.role)) {
    redirect(`/${session.profile.role}/dashboard`);
  }
  return session;
}
