import 'server-only';
import { can } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import type { NavCounts } from '@/config/dashboard-nav';
import type { AccessContext } from '@/modules/access/types';

/**
 * The live numbers next to the membership menu items: new applications, people waiting to activate (or lapsed and
 * restorable), pending leave requests. Only what the caller may act on is counted; a failure just hides the badge.
 */
export async function getNavCounts(access: AccessContext): Promise<NavCounts> {
  const counts: NavCounts = {};
  const supabase = await createClient();
  try {
    if (can(access, 'membership.review')) {
      const [fresh, funnel] = await Promise.all([
        supabase
          .from('membership_review_queue')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'submitted'),
        supabase.from('membership_cycle_funnel').select('accepted, activated'),
      ]);
      counts.applications = fresh.count ?? 0;
      counts.waitlist = (funnel.data ?? []).reduce(
        (n, r) => n + Math.max(0, (r.accepted ?? 0) - (r.activated ?? 0)),
        0,
      );
    }
    if (can(access, 'members.manage')) {
      const { count } = await supabase
        .from('member_leave_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      counts.leave = count ?? 0;
    }
  } catch {
    /* badges are a convenience */
  }
  return counts;
}
