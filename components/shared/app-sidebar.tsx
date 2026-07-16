'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Moon, Sun, LogOut } from 'lucide-react';
import { NAV_BY_ROLE } from './nav-config';
import type { UserRole } from '@/types/database';
import { cn } from '@/lib/utils';
import { useTheme } from './theme-provider';

export function AppSidebar({ role, userName }: { role: UserRole; userName: string }) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 border-r border-navy-100 dark:border-navy-800 bg-white dark:bg-navy-950 h-screen sticky top-0">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-navy-100 dark:border-navy-800">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
          <Brain className="h-4.5 w-4.5" />
        </span>
        <span className="font-display font-semibold text-navy-900 dark:text-lavender-50">EduMind AI</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                  : 'text-navy-600 hover:bg-navy-50 dark:text-lavender-300 dark:hover:bg-navy-800'
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-navy-100 dark:border-navy-800 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-navy-600 hover:bg-navy-50 dark:text-lavender-300 dark:hover:bg-navy-800"
        >
          {theme === 'light' ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          {theme === 'light' ? 'Dark mode' : 'Light mode'}
        </button>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-8 w-8 rounded-full bg-lavender-200 dark:bg-navy-700 flex items-center justify-center text-xs font-semibold text-purple-700 dark:text-lavender-100">
            {userName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-navy-800 dark:text-lavender-100 truncate">{userName}</p>
          </div>
          <Link href="/login" className="text-navy-400 hover:text-navy-700 dark:hover:text-lavender-100">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
