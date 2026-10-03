/** Permission and role keys — mirror the seed data (docs/06-security/permission-catalog.md). pgTAP guards the DB side. */
export const PERMISSION_KEYS = [
  'events.create',
  'events.view_drafts',
  'events.edit',
  'events.submit',
  'events.approve',
  'events.cancel',
  'events.complete',
  'events.delete',
  'registrations.review',
  'registrations.attendance',
  'registrations.export',
  'articles.create',
  'articles.edit',
  'articles.publish',
  'membership.manage_cycles',
  'membership.review',
  'membership.export',
  'members.view',
  'members.manage',
  'members.create',
  'committees.manage',
  'committee_members.manage',
  'roles.view',
  'roles.assign',
  'users.view',
  'reports.view_community',
  'reports.view_committee',
  'reference_data.manage',
  'settings.manage',
  'audit.view',
  'email_logs.view',
] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const ROLE_KEYS = [
  'system_admin',
  'founder',
  'community_leader',
  'advisor',
  'committee_head',
  'committee_deputy',
  'committee_member',
] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

/** Global roles only the system admin may grant (BR-ORG-006 / authorization model §5). */
export const PROTECTED_GLOBAL_ROLES: readonly RoleKey[] = [
  'system_admin',
  'community_leader',
  'founder',
  'advisor',
];

export type Localized<T = string> = { ar: T; en: T };

export type Position = {
  assignmentId: string;
  role: RoleKey;
  roleName: Localized;
  scope: 'global' | 'committee';
  committeeId: string | null;
  committeeName: Localized | null;
  title: Localized | null;
  startsAt: string;
  endsAt: string | null;
};

/** What the signed-in user may do — computed once per request on the server (INTERNAL-SCREENS/03). */
export type AccessContext = {
  userId: string;
  email: string;
  displayName: string;
  positions: Position[];
  /** `'global'` = held everywhere; an array = held only in those committees. */
  grants: Partial<Record<PermissionKey, 'global' | string[]>>;
};
