import Link from 'next/link';
import { Brain, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-navy-100 dark:border-navy-800 py-14">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 font-display font-semibold text-navy-900 dark:text-lavender-50 mb-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white">
                <Brain className="h-4 w-4" />
              </span>
              EduMind AI
            </div>
            <p className="text-sm text-navy-500 dark:text-lavender-400">A generative AI learning companion for personalised education.</p>
          </div>

          <div>
            <p className="text-sm font-medium text-navy-800 dark:text-lavender-100 mb-3">Product</p>
            <ul className="space-y-2 text-sm text-navy-500 dark:text-lavender-400">
              <li><a href="#features" className="hover:text-navy-800 dark:hover:text-lavender-100">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-navy-800 dark:hover:text-lavender-100">How it works</a></li>
              <li><Link href="/demo" className="hover:text-navy-800 dark:hover:text-lavender-100">Explore demo</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-navy-800 dark:text-lavender-100 mb-3">Legal</p>
            <ul className="space-y-2 text-sm text-navy-500 dark:text-lavender-400">
              <li><Link href="/privacy" className="hover:text-navy-800 dark:hover:text-lavender-100">Privacy Policy</Link></li>
              <li><Link href="/responsible-ai" className="hover:text-navy-800 dark:hover:text-lavender-100">Responsible AI</Link></li>
              <li><Link href="/terms" className="hover:text-navy-800 dark:hover:text-lavender-100">Terms of Use</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-navy-800 dark:text-lavender-100 mb-3">Project</p>
            <ul className="space-y-2 text-sm text-navy-500 dark:text-lavender-400">
              <li>
                <a href="https://github.com/YOUR_USERNAME/edumind-ai" className="hover:text-navy-800 dark:hover:text-lavender-100 inline-flex items-center gap-1.5">
                  <Github className="h-3.5 w-3.5" /> GitHub repository
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-navy-100 dark:border-navy-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-navy-400 dark:text-lavender-500">© {new Date().getFullYear()} EduMind AI. Built as an academic project.</p>
          <p className="text-xs text-navy-400 dark:text-lavender-500">Team: Ankith S · Hiteishi A · Nidarshna DK</p>
        </div>
      </div>
    </footer>
  );
}
