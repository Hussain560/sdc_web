import { describe, expect, it } from 'vitest';
import { can, canGlobal, committeesWith, hasDashboardAccess } from '@/lib/auth/permissions';
import { visibleNav, DASHBOARD_NAV } from '@/config/dashboard-nav';
import {
  PERMISSION_KEYS,
  ROLE_KEYS,
  type AccessContext,
  type PermissionKey,
  type RoleKey,
} from '@/modules/access/types';
// @ts-expect-error — plain ESM fixture shared with the pgTAP generator
import { GRANTS, PERMISSIONS } from '../fixtures/rbac-matrix.mjs';

const COMMITTEE_A = 'committee-a';
const COMMITTEE_B = 'committee-b';
const GLOBAL_ROLES: RoleKey[] = ['system_admin', 'community_leader', 'founder', 'advisor'];

/** Builds the access context the server would compute for a single position. */
function persona(role: RoleKey | 'plain_user'): AccessContext {
  const granted: PermissionKey[] = GRANTS[role];
  const global = role !== 'plain_user' && GLOBAL_ROLES.includes(role as RoleKey);
  const grants: AccessContext['grants'] = {};
  for (const key of granted) grants[key] = global ? 'global' : [COMMITTEE_A];
  return {
    userId: role,
    email: `${role}@example.test`,
    displayName: role,
    positions:
      role === 'plain_user'
        ? []
        : [
            {
              assignmentId: role,
              role: role as RoleKey,
              roleName: { ar: role, en: role },
              scope: global ? 'global' : 'committee',
              committeeId: global ? null : COMMITTEE_A,
              committeeName: null,
              title: null,
              startsAt: '2026-01-01T00:00:00Z',
              endsAt: null,
            },
          ],
    grants,
  };
}

const sidebarOf = (role: RoleKey | 'plain_user') =>
  Object.fromEntries(visibleNav(persona(role)).map((g) => [g.key, g.items.map((i) => i.key)]));

describe('catalogue constants', () => {
  it('lists 31 permissions and 7 roles, matching the documented matrix', () => {
    expect(PERMISSION_KEYS).toHaveLength(31);
    expect([...PERMISSION_KEYS].sort()).toEqual([...PERMISSIONS].sort());
    expect(ROLE_KEYS).toHaveLength(7);
    expect(Object.keys(GRANTS).sort()).toEqual([...ROLE_KEYS, 'plain_user'].sort());
  });
});

describe('can() — truth table against the documented matrix', () => {
  for (const role of Object.keys(GRANTS) as Array<RoleKey | 'plain_user'>) {
    it(`${role}`, () => {
      const access = persona(role);
      const global = GLOBAL_ROLES.includes(role as RoleKey);
      for (const key of PERMISSIONS as PermissionKey[]) {
        const granted = GRANTS[role].includes(key);
        expect(can(access, key), `${role} ${key} anywhere`).toBe(granted);
        expect(can(access, key, COMMITTEE_A), `${role} ${key} in A`).toBe(granted);
        // Committee roles never reach another committee; global roles reach every committee.
        expect(can(access, key, COMMITTEE_B), `${role} ${key} in B`).toBe(global ? granted : false);
        expect(canGlobal(access, key)).toBe(global && granted);
      }
    });
  }

  it('is false without an access context', () => {
    expect(can(null, 'events.create')).toBe(false);
    expect(hasDashboardAccess(null)).toBe(false);
  });

  it('reports committee scope', () => {
    expect(committeesWith(persona('committee_head'), 'events.create')).toEqual([COMMITTEE_A]);
    expect(committeesWith(persona('community_leader'), 'events.create')).toBe('all');
    expect(committeesWith(persona('plain_user'), 'events.create')).toEqual([]);
  });
});

describe('sidebar per persona (role → view matrix)', () => {
  it('plain user: only the account group, no dashboard', () => {
    // Profile, positions and security live in the user menu, not the sidebar.
    expect(sidebarOf('plain_user')).toEqual({ general: ['account-home'] });
    expect(hasDashboardAccess(persona('plain_user'))).toBe(false);
  });

  it('committee member: overview + committee events, no admin or management items', () => {
    const nav = sidebarOf('committee_member');
    expect(nav.general).toEqual(['overview']);
    expect(nav.committee).toEqual(['committee-events', 'committee-articles']);
    expect(nav.admin).toBeUndefined();
    expect(nav.management).toBeUndefined();
  });

  it('committee head: committee events, no administration items', () => {
    expect(sidebarOf('committee_head').admin).toBeUndefined();
    expect(sidebarOf('committee_head').committee).toEqual([
      'committee-events',
      'committee-registrations',
      'committee-articles',
      'committee-members',
      'committee-report',
    ]);
  });

  it('founder: read-only roles screen and the events pipeline, no users list', () => {
    expect(sidebarOf('founder').admin).toEqual(['admin-roles']);
    expect(sidebarOf('founder').management).toEqual(['all-events', 'committees', 'reports']);
    expect(sidebarOf('founder').membership).toEqual(['members']);
  });

  it('community leader: users and roles, not the audit log', () => {
    const admin = sidebarOf('community_leader').admin ?? [];
    expect(admin).toContain('admin-users');
    expect(admin).toContain('admin-roles');
    expect(admin).not.toContain('admin-audit');
  });

  it('system admin: sees every built item (global holders use Management items, not the committee group)', () => {
    const keys = Object.values(sidebarOf('system_admin')).flat();
    const built = DASHBOARD_NAV.filter((g) => g.key !== 'committee')
      .flatMap((g) => g.items)
      .filter((i) => i.ready && !i.noPosition);
    expect(keys.sort()).toEqual(built.map((i) => i.key).sort());
  });

  it('never links to a screen that is not built yet', () => {
    for (const role of Object.keys(GRANTS) as Array<RoleKey | 'plain_user'>) {
      const readyKeys = new Set(
        DASHBOARD_NAV.flatMap((g) => g.items)
          .filter((i) => i.ready)
          .map((i) => i.key),
      );
      for (const item of Object.values(sidebarOf(role)).flat()) {
        expect(readyKeys.has(item)).toBe(true);
      }
    }
  });
});
