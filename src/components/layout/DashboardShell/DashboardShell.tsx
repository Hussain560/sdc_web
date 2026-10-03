import { visibleNav } from '@/config/dashboard-nav';
import type { AccessContext } from '@/modules/access/types';
import { ShellFrame } from './ShellFrame';

/**
 * Server component: computes the permission-filtered sidebar from the access context, so the menu never
 * flashes or is skeletoned (docs/10-design-system/INTERNAL-SCREENS/01-shell-layout.md §3).
 */
export function DashboardShell({
  access,
  children,
}: {
  access: AccessContext;
  children: React.ReactNode;
}) {
  const nav = visibleNav(
    access,
    access.positions.find((p) => p.committeeId)?.committeeId ?? undefined,
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
