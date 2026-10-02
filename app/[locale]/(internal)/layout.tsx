import { DashboardShell } from '@/components/layout/DashboardShell/DashboardShell';
import { getAccess } from '@/modules/access/queries';

// Frame for every signed-in screen (/dashboard/** and /account/**): sidebar + private header + content.
// Computed on the server per request, so the sidebar is never skeletoned. Pages still call requireUser() and
// check their own permission; if there is no session the page redirects, so the layout just passes through.
export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const access = await getAccess();
  if (!access) return <>{children}</>;
  return <DashboardShell access={access}>{children}</DashboardShell>;
}
