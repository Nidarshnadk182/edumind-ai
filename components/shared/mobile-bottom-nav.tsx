'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MOBILE_NAV_BY_ROLE } from './nav-config';
import type { UserRole } from '@/types/database';
import { cn } from '@/lib/utils';

export function MobileBottomNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = MOBILE_NAV_BY_ROLE[role];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md border-t border-navy-100 dark:border-navy-800 pb-[env(safe-area-inset-bottom)]">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium',
                active ? 'text-purple-700 dark:text-purple-300' : 'text-navy-500 dark:text-lavender-400'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
