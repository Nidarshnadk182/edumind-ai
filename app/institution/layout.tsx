import { getSessionUser } from '@/lib/auth/session';
import { AppShell } from '@/components/shared/app-shell';

export default async function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUser();
  const userName = session?.profile.full_name ?? 'Admin';
  return <AppShell role="institution" userName={userName}>{children}</AppShell>;
}
