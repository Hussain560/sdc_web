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
  'not_activated',
  'suspended',
  'inactive',
  'unclaimed',
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
  committeeAr: string | null;
  committeeEn: string | null;
  roleAr: string | null;
  roleEn: string | null;
};

export type AdminMemberList = {
  total: number;
  rows: AdminMemberRow[];
  counts: Record<
    'all' | 'active' | 'inactive' | 'suspended' | 'not_activated' | 'unclaimed',
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
      inactive: num(d.counts.inactive),
      suspended: num(d.counts.suspended),
      not_activated: num(d.counts.not_activated),
      unclaimed: num(d.counts.unclaimed),
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
    statusReason: string | null;
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
    createdAt: string | null;
    lastSignInAt: string | null;
  } | null;
  completeness: number;
  canContact: boolean;
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
    cycleAr: string;
    cycleEn: string | null;
    status: string;
    submittedAt: string | null;
    decidedAt: string | null;
  }>;
  log: Array<{ at: string; action: string; actorAr: string | null }>;
};

type Str = string | null;
/** The answer of admin_member_detail as the database sends it (snake case). */
type RawDetail = {
  member: {
    id: string;
    status: MemberStatus;
    status_reason: Str;
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
    created_at: Str;
    last_sign_in_at: Str;
  } | null;
  completeness: number;
  can_contact: boolean;
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
    cycle_ar: string;
    cycle_en: Str;
    status: string;
    submitted_at: Str;
    decided_at: Str;
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
      statusReason: m.status_reason,
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
          createdAt: d.account.created_at,
          lastSignInAt: d.account.last_sign_in_at,
        }
      : null,
    completeness: num(d.completeness),
    canContact: !!d.can_contact,
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
      cycleAr: a.cycle_ar,
      cycleEn: a.cycle_en,
      status: a.status,
      submittedAt: a.submitted_at,
      decidedAt: a.decided_at,
    })),
    log: (d.log ?? []).map((l) => ({ at: l.at, action: l.action, actorAr: l.actor_ar })),
  };
}
