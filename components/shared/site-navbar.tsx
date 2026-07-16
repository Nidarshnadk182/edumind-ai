'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

const links = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#stakeholders', label: 'Who it\u2019s for' },
  { href: '#responsible-ai', label: 'Responsible AI' },
];

export function SiteNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-navy-100/70 bg-canvas-light/80 backdrop-blur-md dark:bg-canvas-dark/80 dark:border-navy-800">
      <nav className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display font-semibold text-navy-900 dark:text-lavender-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
            <Brain className="h-4.5 w-4.5" />
          </span>
          EduMind AI
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-navy-600 hover:text-navy-900 dark:text-lavender-300 dark:hover:text-lavender-50 transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-navy-700 dark:text-lavender-100"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-navy-100 dark:border-navy-800 px-6 py-4 flex flex-col gap-4">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-navy-700 dark:text-lavender-200" onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="flex gap-3 pt-2">
            <Link href="/login" className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">Log in</Button>
            </Link>
            <Link href="/signup" className="flex-1">
              <Button variant="primary" size="sm" className="w-full">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
