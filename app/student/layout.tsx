import { getSessionUser } from '@/lib/auth/session';
import { AppShell } from '@/components/shared/app-shell';

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  const userName = session?.profile.full_name ?? 'Student';

  return (
    <AppShell role="student" userName={userName}>
      {children}
    </AppShell>
  );
}
