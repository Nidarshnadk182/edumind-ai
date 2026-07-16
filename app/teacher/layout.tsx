import { getSessionUser } from '@/lib/auth/session';
import { AppShell } from '@/components/shared/app-shell';

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  const userName = session?.profile.full_name ?? 'Teacher';
  return <AppShell role="teacher" userName={userName}>{children}</AppShell>;
}
