import { after } from 'next/server';
import { visibleNav } from '@/config/dashboard-nav';
import type { AccessContext } from '@/modules/access/types';
import { getNavCounts } from '@/modules/membership/nav-counts';
import { flushIfDue } from '@/modules/notifications/lifecycle';
import { ShellFrame } from './ShellFrame';

/**
 * Server component: computes the permission-filtered sidebar from the access context, so the menu never
 * flashes or is skeletoned (docs/10-design-system/INTERNAL-SCREENS/01-shell-layout.md §3). The membership items
 * carry live counts (new applications, people waiting to activate, pending leave requests).
 */
export async function DashboardShell({
  access,
  children,
}: {
  access: AccessContext;
  children: React.ReactNode;
}) {
  // Decision mails that are due but were not released (a restart, a closed tab) go out with the next page view.
  after(() => flushIfDue().catch(() => undefined));
  const nav = visibleNav(
    access,
    access.positions.find((p) => p.committeeId)?.committeeId ?? undefined,
    await getNavCounts(access),
  );

  // Most senior position first: global roles before committee roles, in catalogue order.
  const main = access.positions[0];
  const positionLabel = main
    ? {
        ar: `${main.title?.ar ?? main.roleName.ar}${main.committeeName ? ` · ${main.committeeName.ar}` : ''}`,
        en: `${main.title?.en ?? main.roleName.en}${main.committeeName ? ` · ${main.committeeName.en}` : ''}`,
      }
    : null;

  return (
    <ShellFrame nav={nav} user={{ name: access.displayName, email: access.email, positionLabel }}>
      {children}
    </ShellFrame>
  );
}
