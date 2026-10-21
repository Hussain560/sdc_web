import { createClient } from '@/lib/supabase/server';
import type { ApplicationStatus, CycleQuestion, RubricCriterion } from './types';

/** Reviewer-side reads (membership.review through the permission-gated `membership_review_queue` view). */
export type ReviewApplication = {
  id: string;
  cycleId: string;
  reference: string;
  status: ApplicationStatus;
  fullNameAr: string;
  fullNameEn: string | null;
  firstNameAr: string | null;
  middleNameAr: string | null;
  lastNameAr: string | null;
  firstNameEn: string | null;
  middleNameEn: string | null;
  lastNameEn: string | null;
  email: string;
  phone: string | null;
  academicStatus: string;
  university: string | null;
  major: string | null;
  track: string | null;
  submittedAt: string;
  decidedAt: string | null;
  acceptedAt: string | null;
  lapsedAt: string | null;
  reviewerId: string | null;
  reviewerName: string | null;
  decisionNote: string | null;
  wantsDirectoryListing: boolean;
  scoreAverage: number | null;
  scoreReviewers: number;
  earlierCount: number;
  earlierRejected: number;
  isMember: boolean;
  isBlocked: boolean;
  resubmittedAt: string | null;
};

export type ReviewFilters = {
  cycleId?: string;
  status?: string;
  q?: string;
  track?: string;
  academic?: string;
  /** `me`, `none`, or a reviewer id. */
  reviewer?: string;
  sort?: 'oldest' | 'newest' | 'score';
  /** The signed-in reviewer (for `reviewer=me`). */
  userId?: string;
};

type QueueRow = {
  id: string | null;
  cycle_id: string | null;
  reference: string | null;
  status: string | null;
  full_name_ar: string | null;
  full_name_en: string | null;
  first_name_ar: string | null;
  middle_name_ar: string | null;
  last_name_ar: string | null;
  first_name_en: string | null;
  middle_name_en: string | null;
  last_name_en: string | null;
  email: string | null;
  phone: string | null;
  academic_status: string | null;
  university_id: number | null;
  major_id: number | null;
  track_id: number | null;
  submitted_at: string | null;
  decided_at: string | null;
  accepted_at: string | null;
  lapsed_at: string | null;
  resubmitted_at: string | null;
  reviewer_id: string | null;
  reviewer_name: string | null;
  decision_note: string | null;
  wants_directory_listing: boolean | null;
  score_average: number | null;
  score_reviewers: number | null;
  earlier_count: number | null;
  earlier_rejected: number | null;
  is_member: boolean | null;
  is_blocked: boolean | null;
};

async function referenceNames() {
  const supabase = await createClient();
  const [u, m, t] = await Promise.all([
    supabase.from('universities').select('id, name_ar'),
    supabase.from('majors').select('id, name_ar'),
    supabase.from('tracks').select('id, name_ar'),
  ]);
  const map = (rows: Array<{ id: number; name_ar: string }> | null) =>
    new Map((rows ?? []).map((r) => [r.id, r.name_ar]));
  return { uni: map(u.data), maj: map(m.data), trk: map(t.data) };
}

function toRow(a: QueueRow, names: Awaited<ReturnType<typeof referenceNames>>): ReviewApplication {
  return {
    id: a.id!,
    cycleId: a.cycle_id!,
    reference: a.reference ?? '',
    status: a.status as ApplicationStatus,
    fullNameAr: a.full_name_ar!,
    fullNameEn: a.full_name_en,
    firstNameAr: a.first_name_ar,
    middleNameAr: a.middle_name_ar,
    lastNameAr: a.last_name_ar,
    firstNameEn: a.first_name_en,
    middleNameEn: a.middle_name_en,
    lastNameEn: a.last_name_en,
    email: a.email!,
    phone: a.phone,
    academicStatus: a.academic_status!,
    university: a.university_id ? (names.uni.get(a.university_id) ?? null) : null,
    major: a.major_id ? (names.maj.get(a.major_id) ?? null) : null,
    track: a.track_id ? (names.trk.get(a.track_id) ?? null) : null,
    submittedAt: a.submitted_at!,
    decidedAt: a.decided_at,
    acceptedAt: a.accepted_at,
    lapsedAt: a.lapsed_at,
    reviewerId: a.reviewer_id,
    reviewerName: a.reviewer_name,
    decisionNote: a.decision_note,
    wantsDirectoryListing: a.wants_directory_listing ?? false,
    scoreAverage: a.score_average === null ? null : Number(a.score_average),
    scoreReviewers: a.score_reviewers ?? 0,
    earlierCount: a.earlier_count ?? 0,
    earlierRejected: a.earlier_rejected ?? 0,
    isMember: a.is_member ?? false,
    isBlocked: a.is_blocked ?? false,
    resubmittedAt: a.resubmitted_at,
  };
}

/** A search term for the queue: any part of a name in either language, the e-mail, the phone or the reference. */
const searchOr = (term: string) => {
  const t = term.replace(/[%,()*]/g, ' ').trim();
  return [
    'full_name_ar',
    'full_name_en',
    'first_name_ar',
    'last_name_ar',
    'first_name_en',
    'last_name_en',
    'email',
    'phone',
    'reference',
  ]
    .map((c) => `${c}.ilike.%${t}%`)
    .join(',');
};

export async function listApplications(
  filters: ReviewFilters,
  page: { from: number; to: number },
): Promise<{ rows: ReviewApplication[]; total: number }> {
  const supabase = await createClient();
  let q = supabase.from('membership_review_queue').select('*', { count: 'exact' });
  if (filters.cycleId) q = q.eq('cycle_id', filters.cycleId);
  if (filters.status) q = q.eq('status', filters.status);
  if (filters.track) q = q.eq('track_id', Number(filters.track));
  if (filters.academic) q = q.eq('academic_status', filters.academic);
  if (filters.reviewer === 'me' && filters.userId) q = q.eq('reviewer_id', filters.userId);
  else if (filters.reviewer === 'none') q = q.is('reviewer_id', null);
  else if (filters.reviewer && /^[0-9a-f-]{36}$/i.test(filters.reviewer))
    q = q.eq('reviewer_id', filters.reviewer);
  const term = filters.q?.trim();
  if (term) q = q.or(searchOr(term));
  if (filters.sort === 'score')
    q = q.order('score_average', { ascending: false, nullsFirst: false }).order('submitted_at');
  else q = q.order('submitted_at', { ascending: filters.sort !== 'newest' });
  const { data, count } = await q.order('id').range(page.from, page.to);
  const names = await referenceNames();
  return { total: count ?? 0, rows: (data ?? []).map((a) => toRow(a as QueueRow, names)) };
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
  phase: string;
  capacity: number | null;
  accepted: number;
  reviewEndsAt: string | null;
  rubric: RubricCriterion[];
};

export async function listReviewCycles(): Promise<ReviewCycle[]> {
  const supabase = await createClient();
  const [{ data: cycles }, { data: counts }, { data: caps }] = await Promise.all([
    supabase
      .from('membership_cycle_phase')
      .select('id, name_ar, name_en, opens_at, phase')
      .order('opens_at', { ascending: false }),
    supabase
      .from('membership_cycle_counts')
      .select('cycle_id, status, total')
      .eq('status', 'accepted'),
    // capacity and the rubric are internal (not in the public view): only managers and reviewers read them
    supabase.from('membership_cycles').select('id, capacity, review_ends_at, rubric'),
  ]);
  const accepted = new Map((counts ?? []).map((c) => [c.cycle_id as string, c.total ?? 0]));
  const internal = new Map((caps ?? []).map((c) => [c.id, c]));
  return (cycles ?? []).map((c) => ({
    id: c.id!,
    nameAr: c.name_ar!,
    nameEn: c.name_en,
    phase: c.phase ?? '',
    capacity: internal.get(c.id!)?.capacity ?? null,
    accepted: accepted.get(c.id!) ?? 0,
    reviewEndsAt: internal.get(c.id!)?.review_ends_at ?? null,
    rubric: ((internal.get(c.id!)?.rubric as unknown as RubricCriterion[]) ??
      []) as RubricCriterion[],
  }));
}

export type ReviewHistoryItem = {
  id: number;
  kind: string;
  at: string;
  actorName: string | null;
  data: Record<string, unknown>;
};

export type ReviewScore = {
  reviewerId: string;
  reviewerName: string;
  scores: Record<string, number>;
  comment: string | null;
  mine: boolean;
};

export type ApplicationDetail = ReviewApplication & {
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
  cycleNameEn: string | null;
  cycleCapacity: number | null;
  cycleAccepted: number;
  rubric: RubricCriterion[];
  otherUniversity: string | null;
  otherMajor: string | null;
  infoRequest: string | null;
  infoFields: string[];
  history: ReviewHistoryItem[];
  scores: ReviewScore[];
};

export async function getApplicationDetail(
  id: string,
  userId: string,
): Promise<ApplicationDetail | null> {
  const supabase = await createClient();
  const { data: a } = await supabase
    .from('membership_review_queue')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (!a) return null;
  const row = a as unknown as QueueRow & {
    sub_major_id: number | null;
    portfolio_url: string | null;
    github_url: string | null;
    linkedin_url: string | null;
    x_url: string | null;
    bio_ar: string | null;
    bio_en: string | null;
    answers: unknown;
    consent_version: string;
    consent_at: string;
    info_fields: string[] | null;
    info_request: string | null;
    preferred_committee_id: string | null;
  };

  const [
    names,
    { data: cycle },
    { data: cycleInternal },
    committee,
    sub,
    { data: events },
    { data: scores },
  ] = await Promise.all([
    referenceNames(),
    supabase
      .from('membership_cycle_phase')
      .select('name_ar, name_en, questions')
      .eq('id', row.cycle_id!)
      .maybeSingle(),
    supabase
      .from('membership_cycles')
      .select('capacity, rubric')
      .eq('id', row.cycle_id!)
      .maybeSingle(),
    row.preferred_committee_id
      ? supabase
          .from('committees')
          .select('name_ar')
          .eq('id', row.preferred_committee_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    row.sub_major_id
      ? supabase.from('majors').select('name_ar').eq('id', row.sub_major_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('application_events')
      .select('id, kind, created_at, actor_id, data')
      .eq('application_id', id)
      .order('id'),
    supabase
      .from('application_scores')
      .select('reviewer_id, scores, comment')
      .eq('application_id', id),
  ]);
  const { count: acceptedCount } = await supabase
    .from('membership_review_queue')
    .select('id', { count: 'exact', head: true })
    .eq('cycle_id', row.cycle_id!)
    .eq('status', 'accepted');

  // Names of the people in the history and the scores (reviewers can read their colleagues' names).
  const ids = [
    ...new Set(
      [
        ...(events ?? []).map((e) => e.actor_id),
        ...(scores ?? []).map((s) => s.reviewer_id),
      ].filter((x): x is string => !!x),
    ),
  ];
  const { data: people } = ids.length
    ? await supabase.from('profiles').select('id, full_name_ar').in('id', ids)
    : { data: [] as Array<{ id: string; full_name_ar: string }> };
  const who = new Map((people ?? []).map((p) => [p.id, p.full_name_ar]));

  const raw = (
    row.answers && typeof row.answers === 'object' && !Array.isArray(row.answers) ? row.answers : {}
  ) as Record<string, string | string[]>;
  const { other_university, other_major, ...answers } = raw;
  const links = (
    [
      ['Portfolio', row.portfolio_url],
      ['GitHub', row.github_url],
      ['LinkedIn', row.linkedin_url],
      ['X', row.x_url],
    ] as Array<[string, string | null]>
  )
    .filter((l): l is [string, string] => Boolean(l[1]))
    .map(([label, url]) => ({ label, url }));

  return {
    ...toRow(row, names),
    subMajor: sub.data?.name_ar ?? null,
    preferredCommittee: committee.data?.name_ar ?? null,
    bioAr: row.bio_ar,
    bioEn: row.bio_en,
    links,
    answers,
    consentVersion: row.consent_version,
    consentAt: row.consent_at,
    questions: (Array.isArray(cycle?.questions)
      ? cycle.questions
      : []) as unknown as CycleQuestion[],
    cycleName: cycle?.name_ar ?? '',
    cycleNameEn: cycle?.name_en ?? null,
    cycleCapacity: cycleInternal?.capacity ?? null,
    cycleAccepted: acceptedCount ?? 0,
    rubric: ((cycleInternal?.rubric as unknown as RubricCriterion[]) ?? []) as RubricCriterion[],
    otherUniversity: typeof other_university === 'string' ? other_university : null,
    otherMajor: typeof other_major === 'string' ? other_major : null,
    infoRequest: row.info_request,
    infoFields: row.info_fields ?? [],
    history: (events ?? []).map((e) => ({
      id: e.id,
      kind: e.kind,
      at: e.created_at,
      actorName: e.actor_id ? (who.get(e.actor_id) ?? null) : null,
      data: (e.data ?? {}) as Record<string, unknown>,
    })),
    scores: (scores ?? []).map((s) => ({
      reviewerId: s.reviewer_id,
      reviewerName: who.get(s.reviewer_id) ?? '',
      scores: (s.scores ?? {}) as Record<string, number>,
      comment: s.comment,
      mine: s.reviewer_id === userId,
    })),
  };
}

/** The neighbours in the same queue (same cycle and status), for "previous / next / n of m" on the review page. */
export async function getQueueNeighbours(app: {
  id: string;
  cycleId: string;
  status: string;
  submittedAt: string;
}) {
  const supabase = await createClient();
  const base = () =>
    supabase
      .from('membership_review_queue')
      .select('id', { count: 'exact', head: true })
      .eq('cycle_id', app.cycleId)
      .eq('status', app.status);
  const [before, total, prev, next] = await Promise.all([
    base().lt('submitted_at', app.submittedAt),
    base(),
    supabase
      .from('membership_review_queue')
      .select('id')
      .eq('cycle_id', app.cycleId)
      .eq('status', app.status)
      .lt('submitted_at', app.submittedAt)
      .order('submitted_at', { ascending: false })
      .limit(1),
    supabase
      .from('membership_review_queue')
      .select('id')
      .eq('cycle_id', app.cycleId)
      .eq('status', app.status)
      .gt('submitted_at', app.submittedAt)
      .order('submitted_at')
      .limit(1),
  ]);
  return {
    position: (before.count ?? 0) + 1,
    total: total.count ?? 0,
    prevId: prev.data?.[0]?.id ?? null,
    nextId: next.data?.[0]?.id ?? null,
  };
}

/** Waiting list (best score first when the cycle has a rubric), lapsed people and acceptances still to activate. */
export type WaitlistRow = {
  id: string;
  cycleId: string;
  nameAr: string;
  nameEn: string | null;
  reference: string;
  submittedAt: string;
  score: number | null;
  position: number;
};

export async function getWaitlist(cycleId?: string): Promise<WaitlistRow[]> {
  const supabase = await createClient();
  let q = supabase.from('membership_waitlist').select('*').order('position');
  if (cycleId) q = q.eq('cycle_id', cycleId);
  const { data } = await q;
  return (data ?? []).map((w) => ({
    id: w.application_id!,
    cycleId: w.cycle_id!,
    nameAr: w.full_name_ar!,
    nameEn: w.full_name_en,
    reference: w.reference!,
    submittedAt: w.submitted_at!,
    score: w.score_average === null ? null : Number(w.score_average),
    position: w.position!,
  }));
}

export type ActivationRow = {
  id: string;
  cycleId: string;
  name: { ar: string; en: string | null };
  acceptedAt: string;
  deadlineDays: number;
  reminders: number[];
  activated: boolean;
  lapsedAt: string | null;
  status: 'accepted' | 'lapsed';
};

export async function getActivationRows(cycleId?: string): Promise<ActivationRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from('membership_activation_queue')
    .select('*')
    .order('accepted_at', { ascending: true, nullsFirst: false });
  if (cycleId) q = q.eq('cycle_id', cycleId);
  const { data } = await q;
  return (data ?? []).map((r) => ({
    id: r.application_id!,
    cycleId: r.cycle_id!,
    name: { ar: r.full_name_ar!, en: r.full_name_en },
    acceptedAt: r.accepted_at ?? '',
    deadlineDays: r.activation_deadline_days ?? 7,
    reminders: (r.reminders ?? []).map(Number),
    activated: r.activated ?? false,
    lapsedAt: r.lapsed_at,
    status: r.status as 'accepted' | 'lapsed',
  }));
}
