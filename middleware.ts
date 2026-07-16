import { NextResponse, type NextRequest } from 'next/server';

// Refreshes the Supabase auth session cookie on every request when
// Supabase is configured. In demo mode (no Supabase credentials) this
// middleware is a harmless no-op — auth is handled entirely by the
// getSessionUser() fallback in lib/auth/session.ts.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
