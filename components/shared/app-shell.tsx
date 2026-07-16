import type { UserRole } from '@/types/database';
import { AppSidebar } from './app-sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';

export function AppShell({
  role,
  userName,
  children,
}: {
  role: UserRole;
  userName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-canvas-light dark:bg-canvas-dark">
      <AppSidebar role={role} userName={userName} />
      <main className="flex-1 min-w-0 pb-20 md:pb-0">
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-6 md:py-8">{children}</div>
      </main>
      <MobileBottomNav role={role} />
    </div>
  );
}
