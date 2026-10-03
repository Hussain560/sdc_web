import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import type { Json } from '@/lib/supabase/database.types';
import type {
  ApplicationStatus,
  CycleFormValues,
  CyclePhase,
  CycleQuestion,
  PublicCycle,
  ReferenceOption,
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

export type MyApplication = {
  id: string;
  cycleId: string;
  status: ApplicationStatus;
  submittedAt: string;
  decidedAt: string | null;
  row: Record<string, unknown>;
};

/** The signed-in person's application in a cycle (the view hides the internal decision note, MA-5). */
export async function getMyApplication(cycleId: string): Promise<MyApplication | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('my_membership_application')
    .select('*')
    .eq('cycle_id', cycleId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id!,
    cycleId: data.cycle_id!,
    status: data.status as ApplicationStatus,
    submittedAt: data.submitted_at!,
    decidedAt: data.decided_at,
    row: data as Record<string, unknown>,
  };
}

export type MyApplicationSummary = MyApplication & { cycle: PublicCycle };

export async function listMyApplications(): Promise<MyApplicationSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('my_membership_application')
    .select('*')
    .order('submitted_at', { ascending: false });
  if (!data || data.length === 0) return [];
  const { data: cycles } = await supabase
    .from('membership_cycle_phase')
    .select('*')
    .in(
      'id',
      data.map((a) => a.cycle_id!),
    );
  const byId = new Map(((cycles ?? []) as PhaseRow[]).map((c) => [c.id!, toPublic(c)]));
  return data
    .filter((a) => byId.has(a.cycle_id!))
    .map((a) => ({
      id: a.id!,
      cycleId: a.cycle_id!,
      status: a.status as ApplicationStatus,
      submittedAt: a.submitted_at!,
      decidedAt: a.decided_at,
      row: a as Record<string, unknown>,
      cycle: byId.get(a.cycle_id!)!,
    }));
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
  status: 'draft' | 'published' | 'completed';
  phase: CyclePhase;
  counts: Partial<Record<ApplicationStatus, number>>;
  total: number;
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

/** Cycles for the dashboard (manage_cycles holders read the table; counts come from the invoker view). */
export async function listCycles(): Promise<CycleRow[]> {
  const supabase = await createClient();
  const [{ data: cycles }, { data: counts }] = await Promise.all([
    supabase.from('membership_cycles').select('*').order('opens_at', { ascending: false }),
    supabase.from('membership_cycle_counts').select('cycle_id, status, total'),
  ]);
  const byCycle = new Map<string, Partial<Record<ApplicationStatus, number>>>();
  for (const c of counts ?? []) {
    const m = byCycle.get(c.cycle_id!) ?? {};
    m[c.status as ApplicationStatus] = c.total ?? 0;
    byCycle.set(c.cycle_id!, m);
  }
  return (cycles ?? []).map((c) => {
    const cnt = byCycle.get(c.id) ?? {};
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
      status: c.status as CycleRow['status'],
      phase: phaseOf(c),
      counts: cnt,
      total: Object.values(cnt).reduce((a, b) => a + (b ?? 0), 0),
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
    },
  };
}
