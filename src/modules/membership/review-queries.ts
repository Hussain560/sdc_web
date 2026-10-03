import { createClient } from '@/lib/supabase/server';
import type { ApplicationStatus, CycleQuestion } from './types';

/** Reviewer-side reads (membership.review through the permission-gated `membership_review_queue` view). */
export type ReviewApplication = {
  id: string;
  cycleId: string;
  status: ApplicationStatus;
  fullNameAr: string;
  fullNameEn: string | null;
  email: string;
  academicStatus: string;
  university: string | null;
  major: string | null;
  track: string | null;
  submittedAt: string;
  decidedAt: string | null;
  reviewerId: string | null;
  decisionNote: string | null;
  wantsDirectoryListing: boolean;
};

export type ReviewFilters = { cycleId?: string; status?: string; q?: string };

export async function listApplications(
  filters: ReviewFilters,
  page: { from: number; to: number },
): Promise<{ rows: ReviewApplication[]; total: number }> {
  const supabase = await createClient();
  let q = supabase
    .from('membership_review_queue')
    .select('*', { count: 'exact' })
    .order('submitted_at', { ascending: true })
    .order('id');
  if (filters.cycleId) q = q.eq('cycle_id', filters.cycleId);
  if (filters.status) q = q.eq('status', filters.status);
  const term = filters.q?.trim().replace(/[%,()]/g, ' ');
  if (term)
    q = q.or(`full_name_ar.ilike.%${term}%,full_name_en.ilike.%${term}%,email.ilike.%${term}%`);
  const { data, count } = await q.range(page.from, page.to);

  const [u, m, t] = await Promise.all([
    supabase.from('universities').select('id, name_ar'),
    supabase.from('majors').select('id, name_ar'),
    supabase.from('tracks').select('id, name_ar'),
  ]);
  const map = (rows: Array<{ id: number; name_ar: string }> | null) =>
    new Map((rows ?? []).map((r) => [r.id, r.name_ar]));
  const uni = map(u.data);
  const maj = map(m.data);
  const trk = map(t.data);

  return {
    total: count ?? 0,
    rows: (data ?? []).map((a) => ({
      id: a.id!,
      cycleId: a.cycle_id!,
      status: a.status as ApplicationStatus,
      fullNameAr: a.full_name_ar!,
      fullNameEn: a.full_name_en,
      email: a.email!,
      academicStatus: a.academic_status!,
      university: a.university_id ? (uni.get(a.university_id) ?? null) : null,
      major: a.major_id ? (maj.get(a.major_id) ?? null) : null,
      track: a.track_id ? (trk.get(a.track_id) ?? null) : null,
      submittedAt: a.submitted_at!,
      decidedAt: a.decided_at,
      reviewerId: a.reviewer_id,
      decisionNote: a.decision_note,
      wantsDirectoryListing: a.wants_directory_listing ?? false,
    })),
  };
}

export async function getReviewCounts(cycleId?: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  let q = supabase.from('membership_cycle_counts').select('status, total');
  if (cycleId) q = q.eq('cycle_id', cycleId);
  const { data } = await q;
  const out: Record<string, number> = {};
  for (const r of data ?? [])
    out[r.status as string] = (out[r.status as string] ?? 0) + (r.total ?? 0);
  return out;
}

export type ReviewCycle = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  capacity: number | null;
  accepted: number;
};

export async function listReviewCycles(): Promise<ReviewCycle[]> {
  const supabase = await createClient();
  const [{ data: cycles }, { data: counts }, { data: caps }] = await Promise.all([
    supabase
      .from('membership_cycle_phase')
      .select('id, name_ar, name_en, opens_at')
      .order('opens_at', { ascending: false }),
    supabase
      .from('membership_cycle_counts')
      .select('cycle_id, status, total')
      .eq('status', 'accepted'),
    // capacity is internal (not in the public view): only managers can read it, others see no limit
    supabase.from('membership_cycles').select('id, capacity'),
  ]);
  const accepted = new Map((counts ?? []).map((c) => [c.cycle_id as string, c.total ?? 0]));
  const cap = new Map((caps ?? []).map((c) => [c.id, c.capacity]));
  return (cycles ?? []).map((c) => ({
    id: c.id!,
    nameAr: c.name_ar!,
    nameEn: c.name_en,
    capacity: cap.get(c.id!) ?? null,
    accepted: accepted.get(c.id!) ?? 0,
  }));
}

export type ApplicationDetail = ReviewApplication & {
  phone: string | null;
  subMajor: string | null;
  preferredCommittee: string | null;
  bioAr: string | null;
  bioEn: string | null;
  links: Array<{ label: string; url: string }>;
  answers: Record<string, string | string[]>;
  consentVersion: string;
  consentAt: string;
  questions: CycleQuestion[];
  cycleName: string;
  otherUniversity: string | null;
  otherMajor: string | null;
};

export async function getApplicationDetail(id: string): Promise<ApplicationDetail | null> {
  const supabase = await createClient();
  const { data: a } = await supabase
    .from('membership_applications')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!a) return null;

  const [list, { data: cycle }, committee, sub] = await Promise.all([
    listApplications({ cycleId: a.cycle_id }, { from: 0, to: 999 }),
    supabase
      .from('membership_cycle_phase')
      .select('name_ar, questions')
      .eq('id', a.cycle_id)
      .maybeSingle(),
    a.preferred_committee_id
      ? supabase
          .from('committees')
          .select('name_ar')
          .eq('id', a.preferred_committee_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    a.sub_major_id
      ? supabase.from('majors').select('name_ar').eq('id', a.sub_major_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const base = list.rows.find((r) => r.id === a.id);
  if (!base) return null;

  const raw = (
    a.answers && typeof a.answers === 'object' && !Array.isArray(a.answers) ? a.answers : {}
  ) as Record<string, string | string[]>;
  const { other_university, other_major, ...answers } = raw;
  const links = (
    [
      ['Portfolio', a.portfolio_url],
      ['GitHub', a.github_url],
      ['LinkedIn', a.linkedin_url],
      ['X', a.x_url],
    ] as Array<[string, string | null]>
  )
    .filter((l): l is [string, string] => Boolean(l[1]))
    .map(([label, url]) => ({ label, url }));

  return {
    ...base,
    phone: a.phone,
    subMajor: sub.data?.name_ar ?? null,
    preferredCommittee: committee.data?.name_ar ?? null,
    bioAr: a.bio_ar,
    bioEn: a.bio_en,
    links,
    answers,
    consentVersion: a.consent_version,
    consentAt: a.consent_at,
    questions: (Array.isArray(cycle?.questions)
      ? cycle.questions
      : []) as unknown as CycleQuestion[],
    cycleName: cycle?.name_ar ?? '',
    otherUniversity: typeof other_university === 'string' ? other_university : null,
    otherMajor: typeof other_major === 'string' ? other_major : null,
  };
}
