import 'server-only';
import { createPublicClient } from '@/lib/supabase/public';
import type { ApplicationStatus, CycleQuestion } from './types';
import { ipHash } from '@/lib/ip-hash';

export type TrackingTimelineKind =
  'submitted' | 'review_started' | 'info_requested' | 'resubmitted' | 'decided' | 'withdrawn';

export type Tracking = {
  reference: string;
  status: ApplicationStatus;
  submittedAt: string;
  firstName: string;
  firstNameEn: string;
  locale: 'ar' | 'en';
  emailMasked: string;
  cycle: {
    nameAr: string;
    nameEn: string | null;
    reviewEndsAt: string | null;
    closesAt: string;
    status: string;
  };
  infoRequest: string | null;
  infoRequestedAt: string | null;
  infoDeadline: string | null;
  /** Current values of the parts the reviewer asked to fix, keyed by field (`q:<key>` for a cycle question). */
  editValues: Record<string, unknown>;
  editQuestions: CycleQuestion[];
  acceptedAt: string | null;
  activationDeadline: string | null;
  timeline: Array<{ kind: TrackingTimelineKind; at: string }>;
  editable: boolean;
  withdrawable: boolean;
};

export type TrackingResult =
  { ok: true; tracking: Tracking } | { ok: false; code: 'TOKEN_INVALID' | 'RATE_LIMITED' };

/** What an applicant may see, from the opaque token only (no sign-in, nothing personal in the URL). */
export async function getTracking(token: string): Promise<TrackingResult> {
  if (!/^[0-9a-f]{40,80}$/i.test(token)) return { ok: false, code: 'TOKEN_INVALID' };
  const { data, error } = await createPublicClient().rpc('track_application', {
    p_token: token,
    p_ip_hash: (await ipHash()) as string,
  });
  if (error || !data) return { ok: false, code: 'TOKEN_INVALID' };
  const r = data as Record<string, unknown> & {
    ok: boolean;
    code?: string;
    cycle?: {
      name_ar: string;
      name_en: string | null;
      review_ends_at: string | null;
      closes_at: string;
      status: string;
    };
  };
  if (!r.ok)
    return { ok: false, code: r.code === 'RATE_LIMITED' ? 'RATE_LIMITED' : 'TOKEN_INVALID' };
  const c = r.cycle!;
  const str = (k: string) => (typeof r[k] === 'string' ? (r[k] as string) : null);
  return {
    ok: true,
    tracking: {
      reference: String(r.reference),
      status: r.status as ApplicationStatus,
      submittedAt: String(r.submitted_at),
      firstName: String(r.first_name ?? ''),
      firstNameEn: String(r.first_name_en ?? ''),
      locale: r.locale === 'en' ? 'en' : 'ar',
      emailMasked: String(r.email_masked ?? ''),
      cycle: {
        nameAr: c.name_ar,
        nameEn: c.name_en,
        reviewEndsAt: c.review_ends_at,
        closesAt: c.closes_at,
        status: c.status,
      },
      infoRequest: str('info_request'),
      infoRequestedAt: str('info_requested_at'),
      infoDeadline: str('info_deadline'),
      editValues: (r.edit_values ?? {}) as Record<string, unknown>,
      editQuestions: (r.edit_questions ?? []) as CycleQuestion[],
      acceptedAt: str('accepted_at'),
      activationDeadline: str('activation_deadline'),
      timeline: ((r.timeline ?? []) as Array<{ kind: TrackingTimelineKind; at: string }>).filter(
        (x) => x.at,
      ),
      editable: r.editable === true,
      withdrawable: r.withdrawable === true,
    },
  };
}
