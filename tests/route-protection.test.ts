import { describe, it, expect } from 'vitest';
import { NAV_BY_ROLE, MOBILE_NAV_BY_ROLE } from '@/components/shared/nav-config';
import type { UserRole } from '@/types/database';

const ALL_ROLES: UserRole[] = ['student', 'teacher', 'parent', 'institution'];

describe('role-based navigation configuration', () => {
  it('defines a non-empty nav list for every role', () => {
    for (const role of ALL_ROLES) {
      expect(NAV_BY_ROLE[role].length).toBeGreaterThan(0);
    }
  });

  it('keeps mobile nav to 5 items or fewer for every role (bottom nav constraint)', () => {
    for (const role of ALL_ROLES) {
      expect(MOBILE_NAV_BY_ROLE[role].length).toBeLessThanOrEqual(5);
    }
  });

  it('every mobile nav href exists in the full desktop nav for that role', () => {
    for (const role of ALL_ROLES) {
      const desktopHrefs = new Set(NAV_BY_ROLE[role].map((i) => i.href));
      for (const item of MOBILE_NAV_BY_ROLE[role]) {
        expect(desktopHrefs.has(item.href)).toBe(true);
      }
    }
  });

  it('routes each role only to paths under its own namespace', () => {
    for (const role of ALL_ROLES) {
      for (const item of NAV_BY_ROLE[role]) {
        expect(item.href.startsWith(`/${role}/`)).toBe(true);
      }
    }
  });
});
