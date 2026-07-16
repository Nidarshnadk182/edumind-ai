import type { UserRole } from '@/types/database';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  MessageCircleQuestion,
  NotebookPen,
  ListChecks,
  Layers,
  Route,
  Target,
  CalendarClock,
  Users,
  ClipboardCheck,
  Building2,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  student: [
    { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/ai-tutor', label: 'AI Tutor', icon: MessageCircleQuestion },
    { href: '/student/notes', label: 'Notes', icon: NotebookPen },
    { href: '/student/quizzes', label: 'Quizzes', icon: ListChecks },
    { href: '/student/flashcards', label: 'Flashcards', icon: Layers },
    { href: '/student/learning-path', label: 'Learning Path', icon: Route },
    { href: '/student/weak-topics', label: 'Weak Topics', icon: Target },
    { href: '/student/study-planner', label: 'Study Planner', icon: CalendarClock },
  ],
  teacher: [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teacher/classes', label: 'Classes', icon: Users },
    { href: '/teacher/reviews', label: 'Content Reviews', icon: ClipboardCheck },
  ],
  parent: [{ href: '/parent/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  institution: [{ href: '/institution/dashboard', label: 'Dashboard', icon: Building2 }],
};

// Mobile bottom nav shows a trimmed set (max 5) for each role.
export const MOBILE_NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  student: [
    NAV_BY_ROLE.student[0]!,
    NAV_BY_ROLE.student[1]!,
    NAV_BY_ROLE.student[2]!,
    NAV_BY_ROLE.student[4]!,
    NAV_BY_ROLE.student[5]!,
  ],
  teacher: NAV_BY_ROLE.teacher,
  parent: NAV_BY_ROLE.parent,
  institution: NAV_BY_ROLE.institution,
};
