import { DashboardShell } from '@/components/layout/DashboardShell/DashboardShell';
import { getAccess } from '@/modules/access/queries';
import { AccountStatusNotice } from '@/modules/account/components/AccountStatusNotice';
import { getAccountState } from '@/modules/account/state';
import { SUSPENSION_CATEGORY_LABEL } from '@/modules/members/schemas';

// Frame for every signed-in screen (/dashboard/** and /account/**): sidebar + private header + content.
// Computed on the server per request, so the sidebar is never skeletoned. Pages still call requireUser() and
// check their own permission; if there is no session the page redirects, so the layout just passes through.
// A paused, expired or ended membership gets one notice per sign-in (ACC-008).
export default async function InternalLayout({ children }: { children: React.ReactNode }) {
  const access = await getAccess();
  if (!access) return <>{children}</>;
  const member = (await getAccountState())?.member;
  const notice = member && member.status !== 'active' ? { ...member, status: member.status } : null;
  return (
    <DashboardShell access={access}>
      {notice && (
        <AccountStatusNotice
          status={notice.status as 'suspended' | 'expired' | 'ended'}
          categoryLabel={
            notice.suspensionCategory
              ? (SUSPENSION_CATEGORY_LABEL[
                  notice.suspensionCategory as keyof typeof SUSPENSION_CATEGORY_LABEL
                ] ?? null)
              : null
          }
          until={notice.suspendedUntil}
          termEndsAt={notice.termEndsAt}
        />
      )}
      {children}
    </DashboardShell>
  );
}
