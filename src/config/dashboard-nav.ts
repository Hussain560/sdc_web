import { can, canGlobal, committeesWith } from '@/lib/auth/permissions';
import type { AccessContext, Localized, PermissionKey } from '@/modules/access/types';

/**
 * The single list behind the internal sidebar (docs/10-design-system/INTERNAL-SCREENS/02-sidebar-navigation.md §3, §5).
 * One list filtered by permissions — never one hardcoded menu per role.
 * Items whose screens are not built yet carry `ready: false` and are filtered out, so the menu never links to a 404.
 */
export type NavGroupKey = 'general' | 'committee' | 'management' | 'membership' | 'admin';

export type NavIcon =
  | 'dashboard'
  | 'ticket'
  | 'card'
  | 'user'
  | 'events'
  | 'clipboard'
  | 'file'
  | 'users'
  | 'building'
  | 'chart'
  | 'shield'
  | 'scroll'
  | 'mail'
  | 'list'
  | 'settings'
  | 'badge';

type Requirement = { permission: PermissionKey; scope: 'any' | 'global' | 'committee' };

type NavItemDef = {
  key: string;
  label: Localized;
  href: string;
  icon: NavIcon;
  requires?: Requirement;
  /** Alternative requirement: the item shows when ANY listed requirement holds. */
  orRequires?: Requirement[];
  ready: boolean;
  /** Only for users holding at least one active position (plain users have no dashboard). */
  needsPosition?: boolean;
  /** Only for users with no active position. */
  noPosition?: boolean;
  /** Committee-scoped items append `?committee=<id>`. */
  scoped?: boolean;
  children?: NavItemDef[];
};

type NavGroupDef = { key: NavGroupKey; label: Localized; items: NavItemDef[] };

export const DASHBOARD_NAV: NavGroupDef[] = [
  {
    key: 'general',
    label: { ar: 'عام', en: 'General' },
    items: [
      {
        key: 'overview',
        label: { ar: 'نظرة عامة', en: 'Overview' },
        href: '/dashboard',
        icon: 'dashboard',
        needsPosition: true,
        ready: true,
      },
      // A plain user has no dashboard; their home is the account area (profile, security and positions live in the user menu).
      {
        key: 'account-home',
        label: { ar: 'حسابي', en: 'My account' },
        href: '/account',
        icon: 'user',
        noPosition: true,
        ready: true,
      },
    ],
  },
  {
    key: 'committee',
    label: { ar: 'اللجنة', en: 'Committee' },
    items: [
      {
        key: 'committee-events',
        label: { ar: 'فعاليات اللجنة', en: 'Committee events' },
        href: '/dashboard/events',
        icon: 'events',
        scoped: true,
        requires: { permission: 'events.view_drafts', scope: 'committee' },
        ready: true,
      },
      {
        key: 'committee-registrations',
        label: { ar: 'التسجيلات', en: 'Registrations' },
        href: '/dashboard/registrations',
        icon: 'clipboard',
        scoped: true,
        requires: { permission: 'registrations.review', scope: 'committee' },
        ready: true,
      },
      {
        key: 'committee-articles',
        label: { ar: 'مقالات اللجنة', en: 'Committee articles' },
        href: '/dashboard/articles',
        icon: 'file',
        scoped: true,
        requires: { permission: 'articles.create', scope: 'committee' },
        ready: true,
      },
      {
        key: 'committee-members',
        label: { ar: 'أعضاء اللجنة', en: 'Committee members' },
        href: '/dashboard/committees',
        icon: 'users',
        scoped: true,
        requires: { permission: 'committee_members.manage', scope: 'committee' },
        ready: true,
      },
      {
        key: 'committee-report',
        label: { ar: 'تقرير اللجنة', en: 'Committee report' },
        href: '/dashboard/reports',
        icon: 'chart',
        scoped: true,
        requires: { permission: 'reports.view_committee', scope: 'committee' },
        ready: true,
      },
    ],
  },
  {
    key: 'management',
    label: { ar: 'الإدارة', en: 'Management' },
    items: [
      {
        key: 'all-events',
        label: { ar: 'الفعاليات', en: 'Events' },
        href: '/dashboard/events',
        icon: 'events',
        requires: { permission: 'events.view_drafts', scope: 'global' },
        ready: true,
      },
      {
        key: 'all-registrations',
        label: { ar: 'التسجيلات', en: 'Registrations' },
        href: '/dashboard/registrations',
        icon: 'clipboard',
        requires: { permission: 'registrations.review', scope: 'global' },
        ready: true,
      },
      {
        key: 'committees',
        label: { ar: 'اللجان', en: 'Committees' },
        href: '/dashboard/committees',
        icon: 'building',
        requires: { permission: 'committees.manage', scope: 'any' },
        orRequires: [{ permission: 'roles.view', scope: 'any' }],
        ready: true,
      },
      {
        key: 'articles',
        label: { ar: 'المقالات', en: 'Articles' },
        href: '/dashboard/articles',
        icon: 'file',
        requires: { permission: 'articles.publish', scope: 'global' },
        ready: true,
      },
      {
        key: 'reports',
        label: { ar: 'التقارير', en: 'Reports' },
        href: '/dashboard/reports',
        icon: 'chart',
        requires: { permission: 'reports.view_community', scope: 'any' },
        ready: true,
      },
    ],
  },
  {
    key: 'membership',
    label: { ar: 'العضوية', en: 'Membership' },
    items: [
      {
        key: 'membership-cycles',
        label: { ar: 'دورات الاستقبال', en: 'Intake cycles' },
        href: '/dashboard/membership/cycles',
        icon: 'card',
        requires: { permission: 'membership.manage_cycles', scope: 'any' },
        ready: true,
      },
      {
        key: 'membership-applications',
        label: { ar: 'طلبات العضوية', en: 'Applications' },
        href: '/dashboard/membership/applications',
        icon: 'clipboard',
        requires: { permission: 'membership.review', scope: 'any' },
        ready: true,
      },
      {
        key: 'members',
        label: { ar: 'الأعضاء', en: 'Members' },
        href: '/dashboard/members',
        icon: 'users',
        requires: { permission: 'members.view', scope: 'any' },
        ready: true,
      },
    ],
  },
  {
    key: 'admin',
    label: { ar: 'إدارة النظام', en: 'Administration' },
    items: [
      {
        key: 'admin-users',
        label: { ar: 'المستخدمون', en: 'Users' },
        href: '/dashboard/admin/users',
        icon: 'users',
        requires: { permission: 'users.view', scope: 'any' },
        ready: true,
      },
      {
        key: 'admin-roles',
        label: { ar: 'الأدوار والمناصب', en: 'Roles & positions' },
        href: '/dashboard/admin/roles',
        icon: 'badge',
        requires: { permission: 'roles.view', scope: 'any' },
        ready: true,
      },
      {
        key: 'admin-audit',
        label: { ar: 'سجل التدقيق', en: 'Audit log' },
        href: '/dashboard/admin/audit',
        icon: 'scroll',
        requires: { permission: 'audit.view', scope: 'any' },
        ready: true,
      },
      {
        key: 'admin-privacy',
        label: { ar: 'طلبات الخصوصية', en: 'Privacy requests' },
        href: '/dashboard/admin/privacy',
        icon: 'shield',
        requires: { permission: 'settings.manage', scope: 'any' },
        ready: true,
      },
      {
        key: 'admin-emails',
        label: { ar: 'سجل البريد', en: 'Email log' },
        href: '/dashboard/admin/emails',
        icon: 'mail',
        requires: { permission: 'email_logs.view', scope: 'any' },
        ready: true,
      },
      {
        key: 'admin-reference',
        label: { ar: 'القوائم المرجعية', en: 'Reference data' },
        href: '/dashboard/admin/reference-data',
        icon: 'list',
        requires: { permission: 'reference_data.manage', scope: 'any' },
        ready: true,
      },
      {
        key: 'admin-settings',
        label: { ar: 'إعدادات الموقع', en: 'Site settings' },
        href: '/dashboard/admin/settings',
        icon: 'settings',
        requires: { permission: 'settings.manage', scope: 'any' },
        ready: true,
      },
    ],
  },
];

/** A serializable item ready for the client sidebar. */
export type VisibleNavItem = {
  key: string;
  label: Localized;
  href: string;
  icon: NavIcon;
  children?: VisibleNavItem[];
};
export type VisibleNavGroup = { key: NavGroupKey; label: Localized; items: VisibleNavItem[] };

function allowed(access: AccessContext, req: Requirement | undefined): boolean {
  if (!req) return true; // any signed-in user
  switch (req.scope) {
    case 'global':
      return canGlobal(access, req.permission);
    case 'committee': {
      // Committee-scoped items are for holders in specific committees; global holders use the Management item.
      const committees = committeesWith(access, req.permission);
      return committees !== 'all' && committees.length > 0;
    }
    default:
      return can(access, req.permission);
  }
}

/** Removes unready items, items the user may not use, then empty parents and empty groups. */
export function visibleNav(access: AccessContext, committeeId?: string): VisibleNavGroup[] {
  const filter = (item: NavItemDef): VisibleNavItem | null => {
    if (!item.ready) return null;
    if (item.needsPosition && access.positions.length === 0) return null;
    if (item.noPosition && access.positions.length > 0) return null;
    const ok =
      allowed(access, item.requires) || (item.orRequires ?? []).some((r) => allowed(access, r));
    if (!ok) return null;
    const children = item.children?.map(filter).filter((c): c is VisibleNavItem => c !== null);
    if (item.children && (children?.length ?? 0) === 0) return null;
    return {
      key: item.key,
      label: item.label,
      href: item.scoped && committeeId ? `${item.href}?committee=${committeeId}` : item.href,
      icon: item.icon,
      ...(children ? { children } : {}),
    };
  };

  return DASHBOARD_NAV.map((group) => ({
    key: group.key,
    label: group.label,
    items: group.items.map(filter).filter((i): i is VisibleNavItem => i !== null),
  })).filter((group) => group.items.length > 0);
}
