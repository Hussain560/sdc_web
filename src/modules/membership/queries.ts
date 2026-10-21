import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import type { Json } from '@/lib/supabase/database.types';
import {
  DEFAULT_RUBRIC,
  type ApplicationStatus,
  type CycleFormValues,
  type CyclePhase,
  type CycleQuestion,
  type PublicCycle,
  type ReferenceOption,
  type RubricCriterion,
} from './types';
import { isoToRiyadh } from './schemas';

type PhaseRow = {
  id: string | null;
  name_ar: string | null;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  opens_at: string | null;
  closes_at: string | null;
  effective_closes_at: string | null;
  status: string | null;
  phase: string | null;
  questions: Json | null;
  review_ends_at: string | null;
  capacity: number | null;
  activation_deadline_days: number | null;
  term_ends_at: string | null;
};

const toPublic = (r: PhaseRow): PublicCycle => ({
  id: r.id!,
  nameAr: r.name_ar!,
  nameEn: r.name_en,
  descriptionAr: r.description_ar,
  descriptionEn: r.description_en,
  opensAt: r.opens_at!,
  closesAt: r.closes_at!,
  effectiveClosesAt: r.effective_closes_at!,
  status: r.status as PublicCycle['status'],
  phase: r.phase as PublicCycle['phase'],
  questions: (Array.isArray(r.questions) ? r.questions : []) as unknown as CycleQuestion[],
  reviewEndsAt: r.review_ends_at,
  capacity: r.capacity,
  activationDeadlineDays: r.activation_deadline_days ?? 7,
  termEndsAt: r.term_ends_at,
});

/**
 * The cycle /join should talk about: the open one, else the next scheduled, else the most recent closed or
 * completed. Cookie-less (public view), so the page can be cached and revalidated.
 */
export async function getJoinCycle(): Promise<PublicCycle | null> {
  const { data } = await createPublicClient()
    .from('membership_cycle_phase')
    .select('*')
    .order('opens_at', { ascending: false })
    .limit(20);
  const rows = ((data ?? []) as PhaseRow[]).map(toPublic);
  return (
    rows.find((c) => c.phase === 'open') ??
    [...rows].reverse().find((c) => c.phase === 'scheduled') ??
    rows[0] ??
    null
  );
}

export async function getReferenceData(): Promise<{
  universities: ReferenceOption[];
  majors: ReferenceOption[];
  tracks: ReferenceOption[];
  committees: Array<{ id: string; nameAr: string; nameEn: string | null }>;
}> {
  const db = createPublicClient();
  const [u, m, t, c] = await Promise.all([
    db
      .from('universities')
      .select('id, name_ar, name_en')
      .eq('is_active', true)
      .order('display_order')
      .order('name_ar'),
    db
      .from('majors')
      .select('id, name_ar, name_en, parent_id')
      .eq('is_active', true)
      .order('name_ar'),
    db
      .from('tracks')
      .select('id, name_ar, name_en')
      .eq('is_active', true)
      .order('display_order')
      .order('name_ar'),
    db
      .from('committees')
      .select('id, name_ar, name_en')
      .eq('status', 'active')
      .order('display_order'),
  ]);
  const opt = (r: {
    id: number;
    name_ar: string;
    name_en: string | null;
    parent_id?: number | null;
  }): ReferenceOption => ({
    id: r.id,
    nameAr: r.name_ar,
    nameEn: r.name_en,
    parentId: r.parent_id ?? null,
  });
  return {
    universities: (u.data ?? []).map(opt),
    majors: (m.data ?? []).map(opt),
    tracks: (t.data ?? []).map(opt),
    committees: (c.data ?? []).map((x) => ({ id: x.id, nameAr: x.name_ar, nameEn: x.name_en })),
  };
}

// ----------------------------------------------------------------------------------------------- dashboard
export type CycleFunnel = {
  applied: number;
  inReview: number;
  accepted: number;
  activated: number;
  lapsed: number;
  waitlisted: number;
};

export type CycleRow = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  opensAt: string;
  closesAt: string;
  closedEarlyAt: string | null;
  /** The moment applications actually stop: the earlier of closes_at and a manual early close. */
  closeEffective: string;
  reviewEndsAt: string | null;
  capacity: number | null;
  /** yyyy-mm-dd the membership of this cycle ends (null: one year after acceptance). */
  termEndsAt: string | null;
  activationDeadlineDays: number;
  rubric: RubricCriterion[];
  status: 'draft' | 'published' | 'completed';
  phase: CyclePhase;
  counts: Partial<Record<ApplicationStatus, number>>;
  funnel: CycleFunnel;
  total: number;
  /** Members of this cycle who are still active (completed cycles). */
  stillActive: number;
  updatedAt: string;
};

const phaseOf = (r: {
  status: string;
  opens_at: string;
  closes_at: string;
  closed_early_at: string | null;
}): CyclePhase => {
  if (r.status === 'draft' || r.status === 'completed') return r.status;
  const now = Date.now();
  const end = Math.min(
    Date.parse(r.closes_at),
    r.closed_early_at ? Date.parse(r.closed_early_at) : Infinity,
  );
  if (now < Date.parse(r.opens_at)) return 'scheduled';
  return now < end ? 'open' : 'closed';
};

const rubricOf = (v: unknown): RubricCriterion[] =>
  (Array.isArray(v) ? v : []).map((x) => {
    const r = x as Partial<RubricCriterion>;
    return {
      key: String(r.key ?? ''),
      label_ar: String(r.label_ar ?? ''),
      label_en: String(r.label_en ?? ''),
      weight: (r.weight === 2 || r.weight === 3 ? r.weight : 1) as RubricCriterion['weight'],
    };
  });

/** Cycles for the dashboard (manage_cycles holders read the table; counts and the funnel come from guarded views). */
export async function listCycles(): Promise<CycleRow[]> {
  const supabase = await createClient();
  const [{ data: cycles }, { data: counts }, { data: funnels }, { data: joined }] =
    await Promise.all([
      supabase.from('membership_cycles').select('*').order('opens_at', { ascending: false }),
      supabase.from('membership_cycle_counts').select('cycle_id, status, total'),
      supabase.from('membership_cycle_funnel').select('*'),
      supabase
        .from('members')
        .select('joined_cycle_id')
        .eq('status', 'active')
        .not('joined_cycle_id', 'is', null),
    ]);
  const byCycle = new Map<string, Partial<Record<ApplicationStatus, number>>>();
  for (const c of counts ?? []) {
    const m = byCycle.get(c.cycle_id!) ?? {};
    m[c.status as ApplicationStatus] = c.total ?? 0;
    byCycle.set(c.cycle_id!, m);
  }
  const funnelOf = new Map((funnels ?? []).map((f) => [f.cycle_id!, f]));
  const active = new Map<string, number>();
  for (const m of joined ?? [])
    active.set(m.joined_cycle_id!, (active.get(m.joined_cycle_id!) ?? 0) + 1);
  return (cycles ?? []).map((c) => {
    const cnt = byCycle.get(c.id) ?? {};
    const f = funnelOf.get(c.id);
    return {
      id: c.id,
      nameAr: c.name_ar,
      nameEn: c.name_en,
      opensAt: c.opens_at,
      closesAt: c.closes_at,
      closedEarlyAt: c.closed_early_at,
      closeEffective:
        c.closed_early_at && c.closed_early_at < c.closes_at ? c.closed_early_at : c.closes_at,
      reviewEndsAt: c.review_ends_at,
      capacity: c.capacity,
      termEndsAt: c.term_ends_at,
      activationDeadlineDays: c.activation_deadline_days,
      rubric: rubricOf(c.rubric),
      status: c.status as CycleRow['status'],
      phase: phaseOf(c),
      counts: cnt,
      funnel: {
        applied: f?.applied ?? 0,
        inReview: f?.in_review ?? 0,
        accepted: f?.accepted ?? 0,
        activated: f?.activated ?? 0,
        lapsed: f?.lapsed ?? 0,
        waitlisted: f?.waitlisted ?? 0,
      },
      total: Object.values(cnt).reduce((a, b) => a + (b ?? 0), 0),
      stillActive: active.get(c.id) ?? 0,
      updatedAt: c.updated_at,
    };
  });
}

export async function getCycleForEdit(
  id: string,
): Promise<{ values: CycleFormValues; row: CycleRow; hasApplications: boolean } | null> {
  const rows = await listCycles();
  const row = rows.find((r) => r.id === id);
  if (!row) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('membership_cycles').select('*').eq('id', id).maybeSingle();
  if (!data) return null;
  return {
    row,
    hasApplications: row.total > 0,
    values: {
      nameAr: data.name_ar,
      nameEn: data.name_en ?? '',
      descriptionAr: data.description_ar ?? '',
      descriptionEn: data.description_en ?? '',
      opensAt: isoToRiyadh(data.opens_at),
      closesAt: isoToRiyadh(data.closes_at),
      reviewEndsAt: isoToRiyadh(data.review_ends_at),
      capacity: data.capacity ? String(data.capacity) : '',
      questions: (Array.isArray(data.questions)
        ? data.questions
        : []) as unknown as CycleQuestion[],
      termEndsAt: data.term_ends_at ?? '',
      activationDeadlineDays: String(data.activation_deadline_days),
      rubric: rubricOf(data.rubric),
    },
  };
}

export { DEFAULT_RUBRIC };

/** True once any reviewer has scored an application of this cycle (the rubric is then fixed). */
export async function cycleHasScores(cycleId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('application_scores')
    .select('application_id, membership_applications!inner(cycle_id)')
    .eq('membership_applications.cycle_id', cycleId)
    .limit(1);
  return (data ?? []).length > 0;
}
