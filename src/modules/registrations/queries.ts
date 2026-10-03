import { createClient } from '@/lib/supabase/server';
import type { PageRequest } from '@/lib/pagination';

export const REGISTRATION_STATUSES = [
  'pending',
  'accepted',
  'waitlisted',
  'rejected',
  'cancelled',
] as const;
export type RegistrationRowStatus = (typeof REGISTRATION_STATUSES)[number];

export type MyRegistration = {
  id: string;
  eventId: string;
  status: RegistrationRowStatus;
  attendanceResult: string | null;
  createdAt: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  eventStatus: string;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  locationAr: string | null;
  locationEn: string | null;
  groupLink: string | null;
  meetingUrl: string | null;
  attendancePercent: number | null;
  certificateId: string | null;
};

/** The signed-in person's registrations (RLS-filtered view; links appear only once accepted). */
export async function getMyRegistrations(): Promise<MyRegistration[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('my_registrations')
    .select(
      'id, event_id, status, attendance_result, created_at, slug, title_ar, title_en, event_status, start_date, end_date, start_time, location_ar, location_en, group_link, meeting_url, attendance_percent, certificate_id',
    )
    .order('created_at', { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id!,
    eventId: r.event_id!,
    status: r.status as RegistrationRowStatus,
    attendanceResult: r.attendance_result,
    createdAt: r.created_at!,
    slug: r.slug!,
    titleAr: r.title_ar!,
    titleEn: r.title_en,
    eventStatus: r.event_status!,
    startDate: r.start_date,
    endDate: r.end_date,
    startTime: r.start_time,
    locationAr: r.location_ar,
    locationEn: r.location_en,
    groupLink: r.group_link,
    meetingUrl: r.meeting_url,
    attendancePercent: r.attendance_percent,
    certificateId: r.certificate_id,
  }));
}

export type ReviewRow = {
  id: string;
  status: RegistrationRowStatus;
  fullName: string;
  email: string;
  wasMember: boolean;
  createdAt: string;
  decidedAt: string | null;
  decisionNote: string | null;
  notifyStatus: 'not_sent' | 'sending' | 'sent' | 'failed';
  eventId: string;
  eventTitleAr: string;
  eventTitleEn: string | null;
  seats: number | null;
};

export type ReviewFilters = { eventId?: string; status?: string; q?: string };

/** Registrations the caller may review (RLS scopes them to their committees). Oldest pending first. */
export async function listRegistrations(
  filters: ReviewFilters,
  page: Pick<PageRequest, 'from' | 'to'>,
): Promise<{ rows: ReviewRow[]; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from('event_registrations')
    .select(
      'id, status, full_name_snapshot, email_snapshot, was_member, created_at, decided_at, decision_note, notify_status, event_id, events(title_ar, title_en, seats)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: true })
    .order('id');
  if (filters.eventId) query = query.eq('event_id', filters.eventId);
  if (filters.status) query = query.eq('status', filters.status);
  const term = filters.q?.trim().replace(/[%,()]/g, ' ');
  if (term) query = query.or(`full_name_snapshot.ilike.%${term}%,email_snapshot.ilike.%${term}%`);
  const { data, count } = await query.range(page.from, page.to);

  const rows = (data ?? []).map((r) => ({
    id: r.id,
    status: r.status as RegistrationRowStatus,
    fullName: r.full_name_snapshot,
    email: r.email_snapshot,
    wasMember: r.was_member,
    createdAt: r.created_at,
    decidedAt: r.decided_at,
    decisionNote: r.decision_note,
    notifyStatus: r.notify_status as ReviewRow['notifyStatus'],
    eventId: r.event_id,
    eventTitleAr: r.events?.title_ar ?? '',
    eventTitleEn: r.events?.title_en ?? null,
    seats: r.events?.seats ?? null,
  }));
  return { rows, total: count ?? 0 };
}

/** Per-status totals for the tabs, under the caller's scope. */
export async function getRegistrationCounts(eventId?: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  let q = supabase.from('event_registration_counts').select('status, total');
  if (eventId) q = q.eq('event_id', eventId);
  const { data } = await q;
  const out: Record<string, number> = {};
  for (const r of data ?? []) {
    const s = r.status as string;
    out[s] = (out[s] ?? 0) + (r.total ?? 0);
  }
  return out;
}

export type ReviewEventOption = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  seats: number | null;
  accepted: number;
};

/** Events that have registrations, for the filter and the seat summary. */
export async function listReviewEvents(): Promise<ReviewEventOption[]> {
  const supabase = await createClient();
  const [{ data: events }, { data: counts }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title_ar, title_en, seats, start_date')
      .in('status', ['published', 'completed', 'cancelled'])
      .order('start_date', { ascending: false, nullsFirst: true }),
    supabase
      .from('event_registration_counts')
      .select('event_id, status, total')
      .eq('status', 'accepted'),
  ]);
  const accepted = new Map((counts ?? []).map((c) => [c.event_id as string, c.total ?? 0]));
  return (events ?? []).map((e) => ({
    id: e.id,
    titleAr: e.title_ar,
    titleEn: e.title_en,
    seats: e.seats,
    accepted: accepted.get(e.id) ?? 0,
  }));
}
