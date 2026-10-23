import { createClient } from '@/lib/supabase/server';
import type { PageRequest } from '@/lib/pagination';
import type { MemberStatus } from './schemas';

/**
 * Dashboard reads for members (MEM-015). The database functions decide what the caller may see: e-mail and phone are
 * absent from the answer without `members.view_contact`, so nothing here hides anything on its own.
 */
export const ADMIN_MEMBER_TABS = [
  'all',
  'active',
  'ending_soon',
  'not_activated',
  'suspended',
  'expired',
  'ended',
  'unclaimed',
  'leave_requests',
] as const;
export type AdminMemberTab = (typeof ADMIN_MEMBER_TABS)[number];

export type AdminMemberRow = {
  id: string;
  userId: string | null;
  status: MemberStatus;
  nameAr: string;
  nameEn: string | null;
  email: string | null;
  photoPath: string | null;
  activated: boolean;
  linked: boolean;
  listed: boolean;
  completeness: number;
  joinedAt: string;
  memberNo: string;
  termEndsAt: string | null;
  daysLeft: number | null;
  endingSoon: boolean;
  endReason: string | null;
  suspensionCategory: string | null;
  suspendedUntil: string | null;
  leavesOn: string | null;
  leaveRequest: {
    id: string;
    createdAt: string;
    reason: string | null;
    preferredLastDay: string | null;
  } | null;
  committeeAr: string | null;
  committeeEn: string | null;
  roleAr: string | null;
  roleEn: string | null;
};

export type AdminMemberList = {
  total: number;
  rows: AdminMemberRow[];
  counts: Record<
    | 'all'
    | 'active'
    | 'ending_soon'
    | 'not_activated'
    | 'suspended'
    | 'expired'
    | 'ended'
    | 'unclaimed'
    | 'leave_requests',
    number
  >;
  kpis: { active: number; listed: number; avgCompleteness: number; lowCompleteness: number };
  canContact: boolean;
};

export type AdminMemberFilters = {
  status?: string;
  q?: string;
  committee?: string;
  track?: string;
  completeness?: string;
};

const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0));

export async function listAdminMembers(
  f: AdminMemberFilters,
  page: Pick<PageRequest, 'from' | 'to'>,
): Promise<AdminMemberList> {
  const supabase = await createClient();
  const status = (ADMIN_MEMBER_TABS as readonly string[]).includes(f.status ?? '')
    ? f.status
    : undefined;
  const { data, error } = await supabase.rpc('admin_list_members', {
    ...(status && status !== 'all' ? { p_status: status } : {}),
    ...(f.q?.trim() ? { p_q: f.q.trim() } : {}),
    ...(f.committee ? { p_committee: f.committee } : {}),
    ...(f.track && /^\d+$/.test(f.track) ? { p_track: Number(f.track) } : {}),
    ...(f.completeness === 'low' || f.completeness === 'complete'
      ? { p_completeness: f.completeness }
      : {}),
    p_from: page.from,
    p_to: page.to,
  });
  if (error) throw new Error(`admin_list_members: ${error.message}`);
  const d = data as unknown as {
    total: number;
    rows: Array<Record<string, unknown>>;
    counts: Record<string, number>;
    kpis: Record<string, number>;
    can_contact: boolean;
  };
  return {
    total: num(d.total),
    canContact: !!d.can_contact,
    counts: {
      all: num(d.counts.all),
      active: num(d.counts.active),
      ending_soon: num(d.counts.ending_soon),
      not_activated: num(d.counts.not_activated),
      suspended: num(d.counts.suspended),
      expired: num(d.counts.expired),
      ended: num(d.counts.ended),
      unclaimed: num(d.counts.unclaimed),
      leave_requests: num(d.counts.leave_requests),
    },
    kpis: {
      active: num(d.kpis.active),
      listed: num(d.kpis.listed),
      avgCompleteness: num(d.kpis.avg_completeness),
      lowCompleteness: num(d.kpis.low_completeness),
    },
    rows: d.rows.map((r) => ({
      id: String(r.id),
      userId: (r.user_id as string | null) ?? null,
      status: r.status as MemberStatus,
      nameAr: String(r.name_ar ?? ''),
      nameEn: (r.name_en as string | null) ?? null,
      email: (r.email as string | null) ?? null,
      photoPath: (r.photo_path as string | null) ?? null,
      activated: !!r.activated,
      linked: !!r.linked,
      listed: !!r.listed,
      completeness: num(r.completeness),
      joinedAt: String(r.joined_at),
      memberNo: String(r.member_no ?? ''),
      termEndsAt: (r.term_ends_at as string | null) ?? null,
      daysLeft: r.days_left === null || r.days_left === undefined ? null : num(r.days_left),
      endingSoon: !!r.ending_soon,
      endReason: (r.end_reason as string | null) ?? null,
      suspensionCategory: (r.suspension_category as string | null) ?? null,
      suspendedUntil: (r.suspended_until as string | null) ?? null,
      leavesOn: (r.leaves_on as string | null) ?? null,
      leaveRequest: r.leave_request
        ? {
            id: String((r.leave_request as Record<string, unknown>).id),
            createdAt: String((r.leave_request as Record<string, unknown>).created_at),
            reason: ((r.leave_request as Record<string, unknown>).reason as string | null) ?? null,
            preferredLastDay:
              ((r.leave_request as Record<string, unknown>).preferred_last_day as string | null) ??
              null,
          }
        : null,
      committeeAr: (r.committee_ar as string | null) ?? null,
      committeeEn: (r.committee_en as string | null) ?? null,
      roleAr: (r.role_ar as string | null) ?? null,
      roleEn: (r.role_en as string | null) ?? null,
    })),
  };
}

export type AdminMemberDetail = {
  member: {
    id: string;
    status: MemberStatus;
    memberNo: string;
    termStartsAt: string | null;
    termEndsAt: string | null;
    endReason: string | null;
    suspensionCategory: string | null;
    suspendedUntil: string | null;
    leavesOn: string | null;
    endedAt: string | null;
    activatedAt: string | null;
    onboardedAt: string | null;
    renewalRequestedAt: string | null;
    cardActive: boolean;
    joinedAt: string;
    joinedVia: 'application' | 'legacy' | 'manual';
    legacy: boolean;
    listed: boolean;
    firstNameAr: string;
    middleNameAr: string | null;
    lastNameAr: string;
    firstNameEn: string | null;
    middleNameEn: string | null;
    lastNameEn: string | null;
    academicStatus: string | null;
    /** Private: null unless the viewer may see contact data (members.view_contact). */
    gender: string | null;
    studyYear: number | null;
    universityAr: string | null;
    universityEn: string | null;
    majorAr: string | null;
    majorEn: string | null;
    trackAr: string | null;
    trackEn: string | null;
    headlineAr: string | null;
    headlineEn: string | null;
    aboutAr: string | null;
    aboutEn: string | null;
    openTo: string[];
    photoPath: string | null;
    links: Record<string, string | null>;
    show: Record<string, boolean>;
    cycleNameAr: string | null;
  };
  account: {
    userId: string;
    email: string | null;
    phone: string | null;
    activated: boolean;
    blocked: boolean;
    blockedAt: string | null;
    createdAt: string | null;
    lastSignInAt: string | null;
  } | null;
  completeness: number;
  canContact: boolean;
  leaveRequest: {
    id: string;
    createdAt: string;
    reason: string | null;
    preferredLastDay: string | null;
  } | null;
  timeline: Array<{
    id: number;
    at: string;
    kind: string;
    data: Record<string, unknown>;
    actorAr: string | null;
  }>;
  skills: Array<{ slug: string; nameAr: string; nameEn: string; category: string }>;
  projects: Array<{ id: string; titleAr: string; titleEn: string | null; url: string }>;
  positions: Array<{
    id: string;
    roleKey: string;
    roleAr: string;
    roleEn: string;
    committeeSlug: string | null;
    committeeAr: string | null;
    committeeEn: string | null;
    startsAt: string;
    endsAt: string | null;
    endReason: string | null;
    active: boolean;
    assignedByAr: string | null;
  }>;
  registrations: Array<{
    id: string;
    eventSlug: string;
    titleAr: string;
    titleEn: string | null;
    startDate: string;
    status: string;
    attendance: string | null;
  }>;
  applications: Array<{
    id: string;
    reference: string | null;
    cycleAr: string;
    cycleEn: string | null;
    status: string;
    submittedAt: string | null;
    decidedAt: string | null;
    scoreAverage: number | null;
  }>;
  log: Array<{ at: string; action: string; actorAr: string | null }>;
};

type Str = string | null;
/** The answer of admin_member_detail as the database sends it (snake case). */
type RawDetail = {
  member: {
    id: string;
    status: MemberStatus;
    member_no: string;
    term_starts_at: Str;
    term_ends_at: Str;
    end_reason: Str;
    suspension_category: Str;
    suspended_until: Str;
    leaves_on: Str;
    ended_at: Str;
    activated_at: Str;
    onboarded_at: Str;
    renewal_requested_at: Str;
    card_active: boolean;
    joined_at: string;
    joined_via: 'application' | 'legacy' | 'manual';
    legacy: boolean;
    listed: boolean;
    first_name_ar: string;
    middle_name_ar: Str;
    last_name_ar: string;
    first_name_en: Str;
    middle_name_en: Str;
    last_name_en: Str;
    academic_status: Str;
    gender: Str;
    study_year: number | null;
    university_ar: Str;
    university_en: Str;
    major_ar: Str;
    major_en: Str;
    track_ar: Str;
    track_en: Str;
    headline_ar: Str;
    headline_en: Str;
    about_ar: Str;
    about_en: Str;
    open_to: string[] | null;
    photo_path: Str;
    links: Record<string, string | null>;
    show: Record<string, boolean>;
    cycle_name_ar: Str;
  };
  account: {
    user_id: string;
    email: Str;
    phone: Str;
    activated: boolean;
    blocked: boolean;
    blocked_at: Str;
    created_at: Str;
    last_sign_in_at: Str;
  } | null;
  completeness: number;
  can_contact: boolean;
  leave_request: { id: string; created_at: string; reason: Str; preferred_last_day: Str } | null;
  timeline: Array<{
    id: number;
    at: string;
    kind: string;
    data: Record<string, unknown> | null;
    actor_ar: Str;
  }> | null;
  skills: Array<{ slug: string; name_ar: string; name_en: string; category: string }> | null;
  projects: Array<{ id: string; title_ar: string; title_en: Str; url: string }> | null;
  positions: Array<{
    id: string;
    role_key: string;
    role_ar: string;
    role_en: string;
    committee_slug: Str;
    committee_ar: Str;
    committee_en: Str;
    starts_at: string;
    ends_at: Str;
    end_reason: Str;
    active: boolean;
    assigned_by_ar: Str;
  }> | null;
  registrations: Array<{
    id: string;
    event_slug: string;
    title_ar: string;
    title_en: Str;
    start_date: string;
    status: string;
    attendance: Str;
  }> | null;
  applications: Array<{
    id: string;
    reference: Str;
    cycle_ar: string;
    cycle_en: Str;
    status: string;
    submitted_at: Str;
    decided_at: Str;
    score_average: number | null;
  }> | null;
  log: Array<{ at: string; action: string; actor_ar: Str }> | null;
};

/** One member for the dashboard, or null when there is none (404). Throws when the caller may not look. */
export async function getAdminMember(id: string): Promise<AdminMemberDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_member_detail', { p_id: id });
  if (error) {
    if (error.message?.includes('NOT_FOUND') || error.code === '22P02') return null;
    throw new Error(`admin_member_detail: ${error.message}`);
  }
  const d = data as unknown as RawDetail;
  const m = d.member;
  return {
    member: {
      id: m.id,
      status: m.status,
      memberNo: m.member_no,
      termStartsAt: m.term_starts_at,
      termEndsAt: m.term_ends_at,
      endReason: m.end_reason,
      suspensionCategory: m.suspension_category,
      suspendedUntil: m.suspended_until,
      leavesOn: m.leaves_on,
      endedAt: m.ended_at,
      activatedAt: m.activated_at,
      onboardedAt: m.onboarded_at,
      renewalRequestedAt: m.renewal_requested_at,
      cardActive: !!m.card_active,
      joinedAt: m.joined_at,
      joinedVia: m.joined_via,
      legacy: !!m.legacy,
      listed: !!m.listed,
      firstNameAr: m.first_name_ar,
      middleNameAr: m.middle_name_ar,
      lastNameAr: m.last_name_ar,
      firstNameEn: m.first_name_en,
      middleNameEn: m.middle_name_en,
      lastNameEn: m.last_name_en,
      academicStatus: m.academic_status,
      gender: m.gender,
      studyYear: m.study_year,
      universityAr: m.university_ar,
      universityEn: m.university_en,
      majorAr: m.major_ar,
      majorEn: m.major_en,
      trackAr: m.track_ar,
      trackEn: m.track_en,
      headlineAr: m.headline_ar,
      headlineEn: m.headline_en,
      aboutAr: m.about_ar,
      aboutEn: m.about_en,
      openTo: m.open_to ?? [],
      photoPath: m.photo_path,
      links: m.links ?? {},
      show: m.show ?? {},
      cycleNameAr: m.cycle_name_ar,
    },
    account: d.account
      ? {
          userId: d.account.user_id,
          email: d.account.email,
          phone: d.account.phone,
          activated: !!d.account.activated,
          blocked: !!d.account.blocked,
          blockedAt: d.account.blocked_at,
          createdAt: d.account.created_at,
          lastSignInAt: d.account.last_sign_in_at,
        }
      : null,
    completeness: num(d.completeness),
    canContact: !!d.can_contact,
    leaveRequest: d.leave_request
      ? {
          id: d.leave_request.id,
          createdAt: d.leave_request.created_at,
          reason: d.leave_request.reason,
          preferredLastDay: d.leave_request.preferred_last_day,
        }
      : null,
    timeline: (d.timeline ?? []).map((t) => ({
      id: t.id,
      at: t.at,
      kind: t.kind,
      data: t.data ?? {},
      actorAr: t.actor_ar,
    })),
    skills: (d.skills ?? []).map((s) => ({
      slug: s.slug,
      nameAr: s.name_ar,
      nameEn: s.name_en,
      category: s.category,
    })),
    projects: (d.projects ?? []).map((p) => ({
      id: p.id,
      titleAr: p.title_ar,
      titleEn: p.title_en,
      url: p.url,
    })),
    positions: (d.positions ?? []).map((p) => ({
      id: p.id,
      roleKey: p.role_key,
      roleAr: p.role_ar,
      roleEn: p.role_en,
      committeeSlug: p.committee_slug,
      committeeAr: p.committee_ar,
      committeeEn: p.committee_en,
      startsAt: p.starts_at,
      endsAt: p.ends_at,
      endReason: p.end_reason,
      active: !!p.active,
      assignedByAr: p.assigned_by_ar,
    })),
    registrations: (d.registrations ?? []).map((r) => ({
      id: r.id,
      eventSlug: r.event_slug,
      titleAr: r.title_ar,
      titleEn: r.title_en,
      startDate: r.start_date,
      status: r.status,
      attendance: r.attendance,
    })),
    applications: (d.applications ?? []).map((a) => ({
      id: a.id,
      reference: a.reference,
      cycleAr: a.cycle_ar,
      cycleEn: a.cycle_en,
      status: a.status,
      submittedAt: a.submitted_at,
      decidedAt: a.decided_at,
      scoreAverage: a.score_average === null ? null : Number(a.score_average),
    })),
    log: (d.log ?? []).map((l) => ({ at: l.at, action: l.action, actorAr: l.actor_ar })),
  };
}
