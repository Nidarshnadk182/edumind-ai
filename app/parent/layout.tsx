import { getSessionUser } from '@/lib/auth/session';
import { AppShell } from '@/components/shared/app-shell';

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  const userName = session?.profile.full_name ?? 'Parent';
  return <AppShell role="parent" userName={userName}>{children}</AppShell>;
}
