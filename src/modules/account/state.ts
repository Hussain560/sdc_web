import { cache } from 'react';
import { getUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

/** What the signed-in person's account and membership look like right now (one database call per request). */
export type AccountState = {
  blocked: boolean;
  member: {
    id: string;
    status: 'active' | 'suspended' | 'expired' | 'ended';
    endReason: string | null;
    termStartsAt: string | null;
    termEndsAt: string | null;
    suspensionCategory: string | null;
    suspendedUntil: string | null;
    endedAt: string | null;
    memberNo: string;
    joinedAt: string;
    onboardedAt: string | null;
    onboardingStep: number;
    renewalRequestedAt: string | null;
    leavesOn: string | null;
    leaveRequest: {
      id: string;
      createdAt: string;
      preferredLastDay: string | null;
      reason: string | null;
    } | null;
  } | null;
};

type Raw = {
  blocked: boolean;
  member: {
    id: string;
    status: AccountState['member'] extends infer M
      ? M extends { status: infer S }
        ? S
        : never
      : never;
    end_reason: string | null;
    term_starts_at: string | null;
    term_ends_at: string | null;
    suspension_category: string | null;
    suspended_until: string | null;
    ended_at: string | null;
    member_no: string;
    joined_at: string;
    onboarded_at: string | null;
    onboarding_step: number;
    renewal_requested_at: string | null;
    leaves_on: string | null;
    leave_request: {
      id: string;
      created_at: string;
      preferred_last_day: string | null;
      reason: string | null;
    } | null;
  } | null;
};

export const getAccountState = cache(async (): Promise<AccountState | null> => {
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await (await createClient()).rpc('my_account_state');
  if (error || !data) return null;
  const r = data as unknown as Raw;
  return {
    blocked: !!r.blocked,
    member: r.member
      ? {
          id: r.member.id,
          status: r.member.status,
          endReason: r.member.end_reason,
          termStartsAt: r.member.term_starts_at,
          termEndsAt: r.member.term_ends_at,
          suspensionCategory: r.member.suspension_category,
          suspendedUntil: r.member.suspended_until,
          endedAt: r.member.ended_at,
          memberNo: r.member.member_no,
          joinedAt: r.member.joined_at,
          onboardedAt: r.member.onboarded_at,
          onboardingStep: r.member.onboarding_step,
          renewalRequestedAt: r.member.renewal_requested_at,
          leavesOn: r.member.leaves_on,
          leaveRequest: r.member.leave_request
            ? {
                id: r.member.leave_request.id,
                createdAt: r.member.leave_request.created_at,
                preferredLastDay: r.member.leave_request.preferred_last_day,
                reason: r.member.leave_request.reason,
              }
            : null,
        }
      : null,
  };
});
