import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';

export default async function DashboardRedirectPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect('/login');
  }
  redirect(`/${session.profile.role}/dashboard`);
}
