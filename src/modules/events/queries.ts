import { createClient } from '@/lib/supabase/server';
import type { PageRequest } from '@/lib/pagination';
import { derivePhase } from './phase';
import { fromRow } from './mapping';
import type { EventFormValues, EventPhase, EventStatus, EventType } from './types';
import type { Localized } from '@/modules/access/types';

export type EventListRow = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  type: EventType;
  status: EventStatus;
  phase: EventPhase | null;
  committeeId: string;
  committeeName: Localized;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  locationMode: string;
  locationAr: string | null;
  locationEn: string | null;
  seats: number | null;
  reviewNote: string | null;
  coverImagePath: string | null;
  updatedAt: string;
};

export type EventListFilters = {
  status?: string;
  committeeId?: string;
  type?: string;
  period?: 'upcoming' | 'past' | 'all';
  q?: string;
};

const today = () => new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

export async function listEvents(
  filters: EventListFilters,
  page: Pick<PageRequest, 'from' | 'to'>,
): Promise<{ rows: EventListRow[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from('events')
    .select(
      'id, slug, title_ar, title_en, type, status, committee_id, start_date, end_date, start_time, end_time, location_mode, location_ar, location_en, seats, review_note, cover_image_path, updated_at, registration_start_at, registration_end_at, display_config, committees(name_ar, name_en)',
      { count: 'exact' },
    )
    .order('updated_at', { ascending: false })
    .order('id');

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.committeeId) query = query.eq('committee_id', filters.committeeId);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.period === 'upcoming')
    query = query.or(`start_date.gte.${today()},start_date.is.null`);
  if (filters.period === 'past') query = query.lt('start_date', today());
  const term = filters.q?.trim().replace(/[%,()]/g, ' ');
  if (term) query = query.or(`title_ar.ilike.%${term}%,title_en.ilike.%${term}%`);

  const { data, count } = await query.range(page.from, page.to);

  const rows = (data ?? []).map((e): EventListRow => {
    const status = e.status as EventStatus;
    return {
      id: e.id,
      slug: e.slug,
      titleAr: e.title_ar,
      titleEn: e.title_en,
      type: e.type as EventType,
      status,
      phase: derivePhase({
        status,
        startDate: e.start_date,
        lastDate: e.end_date ?? e.start_date,
        startTime: e.start_time,
        endTime: e.end_time,
        registrationStartAt: e.registration_start_at,
        registrationEndAt: e.registration_end_at,
        seats: e.seats,
        accepted: 0,
        autoClose:
          (e.display_config as { auto_close_registration?: boolean } | null)
            ?.auto_close_registration ?? true,
      }),
      committeeId: e.committee_id,
      committeeName: {
        ar: e.committees?.name_ar ?? '',
        en: e.committees?.name_en ?? e.committees?.name_ar ?? '',
      },
      startDate: e.start_date,
      endDate: e.end_date,
      startTime: e.start_time,
      locationMode: e.location_mode,
      locationAr: e.location_ar,
      locationEn: e.location_en,
      seats: e.seats,
      reviewNote: e.review_note,
      coverImagePath: e.cover_image_path,
      updatedAt: e.updated_at,
    };
  });
  return { rows, total: count ?? rows.length };
}

export async function getStatusCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from('event_status_counts').select('status, total');
  return Object.fromEntries((data ?? []).map((r) => [r.status as string, r.total as number]));
}

export type EventDetail = {
  id: string;
  updatedAt: string;
  status: EventStatus;
  phase: EventPhase | null;
  committeeId: string;
  committeeName: Localized;
  form: EventFormValues;
  reviewNote: string | null;
  reviewedAt: string | null;
  submissionNote: string | null;
  submittedAt: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  canSeePrivate: boolean;
  privateNotes: string | null;
  coverUrl: string | null;
};

/** One event for the wizard / detail screen; null when it does not exist or is out of the caller's scope. */
export async function getEventDetail(id: string): Promise<EventDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: e } = await supabase
    .from('events')
    .select('*, committees(name_ar, name_en)')
    .eq('id', id)
    .maybeSingle();
  if (!e) return null;

  const [{ data: priv }, { data: dates }, { data: presenters }] = await Promise.all([
    supabase.from('event_private_details').select('*').eq('event_id', id).maybeSingle(),
    supabase.from('event_dates').select('event_date').eq('event_id', id).order('event_date'),
    supabase.rpc('event_presenters_for', { p_event: id }),
  ]);

  const form = fromRow(
    e as unknown as Record<string, unknown>,
    (priv as unknown as Record<string, unknown>) ?? null,
    (dates ?? []).map((d) => d.event_date),
    (presenters ?? []).map((p) => ({
      profile_id: p.profile_id,
      profileName: p.profile_id ? p.name_ar : '',
      guest_name_ar: p.profile_id ? '' : p.name_ar,
      guest_name_en: p.profile_id ? '' : p.name_en,
      guest_title_ar: p.title_ar,
      guest_title_en: p.title_en,
      guest_link: p.link,
      role: p.role,
    })),
  );

  const status = e.status as EventStatus;
  const cover = e.cover_image_path
    ? supabase.storage.from('public-media').getPublicUrl(e.cover_image_path).data.publicUrl
    : null;

  return {
    id: e.id,
    updatedAt: e.updated_at,
    status,
    phase: derivePhase({
      status,
      startDate: e.start_date,
      lastDate: (dates ?? []).at(-1)?.event_date ?? e.end_date ?? e.start_date,
      startTime: e.start_time,
      endTime: e.end_time,
      registrationStartAt: e.registration_start_at,
      registrationEndAt: e.registration_end_at,
      seats: e.seats,
      accepted: 0,
      autoClose:
        (e.display_config as { auto_close_registration?: boolean } | null)
          ?.auto_close_registration ?? true,
    }),
    committeeId: e.committee_id,
    committeeName: {
      ar: e.committees?.name_ar ?? '',
      en: e.committees?.name_en ?? e.committees?.name_ar ?? '',
    },
    form,
    reviewNote: e.review_note,
    reviewedAt: e.reviewed_at,
    submissionNote: e.submission_note,
    submittedAt: e.submitted_at,
    cancelReason: e.cancel_reason,
    cancelledAt: e.cancelled_at,
    publishedAt: e.published_at,
    createdAt: e.created_at,
    canSeePrivate: priv !== null,
    privateNotes: (priv as { organizer_notes?: string | null } | null)?.organizer_notes ?? null,
    coverUrl: cover,
  };
}

export type HistoryRow = {
  occurredAt: string;
  action: string;
  actor: string | null;
  note: string | null;
  from?: string;
  to?: string;
};

export async function getEventHistory(id: string): Promise<HistoryRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('event_history', { p_id: id });
  return (data ?? []).map((r) => {
    const s = (r.summary ?? {}) as { note?: string | null; from?: string; to?: string };
    return {
      occurredAt: r.occurred_at,
      action: r.action,
      actor: r.actor_name,
      note: s.note ?? null,
      from: s.from,
      to: s.to,
    };
  });
}
