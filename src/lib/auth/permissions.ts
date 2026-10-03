import type { AccessContext, PermissionKey } from '@/modules/access/types';

/**
 * Pure permission helpers — UX only. The database re-checks every action (RLS + functions),
 * so hiding something here never replaces enforcing it (ADR-004, AC-9).
 */

/** Held anywhere, or — with a committee — held globally or in that committee. */
export function can(
  access: AccessContext | null,
  key: PermissionKey,
  committeeId?: string | null,
): boolean {
  const grant = access?.grants[key];
  if (!grant) return false;
  if (grant === 'global') return true;
  return committeeId ? grant.includes(committeeId) : grant.length > 0;
}

export function canGlobal(access: AccessContext | null, key: PermissionKey): boolean {
  return access?.grants[key] === 'global';
}

export function canAny(access: AccessContext | null, keys: readonly PermissionKey[]): boolean {
  return keys.some((key) => can(access, key));
}

/** Committee ids where the permission is held (`'all'` when it is held globally). */
export function committeesWith(access: AccessContext | null, key: PermissionKey): 'all' | string[] {
  const grant = access?.grants[key];
  if (!grant) return [];
  return grant === 'global' ? 'all' : grant;
}

/** A user with at least one active position sees the dashboard; everyone else only /account. */
export function hasDashboardAccess(access: AccessContext | null): boolean {
  return !!access && access.positions.length > 0;
}
