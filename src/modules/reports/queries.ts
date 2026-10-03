import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';
import type {
  Breakdown,
  CommitteeEventRow,
  CommitteeRow,
  CommitteeStats,
  CommunityStats,
  DashboardSummary,
  Metrics,
  MonthRow,
  MyActivity,
  PendingQueues,
  QueueItem,
} from './types';
import type { Period } from './period';

const obj = (v: Json | undefined | null): Record<string, Json> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, Json>) : {};
const num = (v: Json | undefined) => (typeof v === 'number' ? v : 0);
const numOrNull = (v: Json | undefined) => (typeof v === 'number' ? v : null);
const str = (v: Json | undefined) => (typeof v === 'string' ? v : null);
const arr = (v: Json | undefined): Json[] => (Array.isArray(v) ? v : []);

function metrics(v: Json | undefined): Metrics {
  const m = obj(v);
  return {
    eventsHeld: num(m.events_held),
    registrations: num(m.registrations),
    accepted: num(m.accepted),
    rejected: num(m.rejected),
    acceptanceRate: numOrNull(m.acceptance_rate),
    attendanceRate: numOrNull(m.attendance_rate),
    attendanceEvents: num(m.attendance_events),
    memberShare: numOrNull(m.member_share),
    articlesPublished: num(m.articles_published),
    certificatesSent: num(m.certificates_sent),
    activeMembers: numOrNull(m.active_members),
    newMembers: numOrNull(m.new_members),
    committeeSize: numOrNull(m.committee_size),
  };
}

/** Community dashboard (reports.view_community). Null when the caller may not read it or the period is invalid. */
export async function getCommunityStats(period: Period): Promise<CommunityStats | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('community_stats', {
    p_from: period.from,
    p_to: period.to,
  });
  if (error || !data) return null;
  const o = obj(data);
  const f = obj(o.funnel);
  return {
    period,
    current: metrics(o.current),
    previous: metrics(o.previous),
    funnel: {
      submitted: num(f.submitted),
      accepted: num(f.accepted),
      rejected: num(f.rejected),
      waitlisted: num(f.waitlisted),
      withdrawn: num(f.withdrawn),
      inReview: num(f.in_review),
    },
    monthly: arr(o.monthly).map((m): MonthRow => {
      const x = obj(m);
      return {
        month: str(x.month) ?? '',
        registrations: num(x.registrations),
        attendance: numOrNull(x.attendance),
      };
    }),
    committees: arr(o.committees).map((c): CommitteeRow => {
      const x = obj(c);
      return {
        id: str(x.id) ?? '',
        slug: str(x.slug) ?? '',
        nameAr: str(x.name_ar) ?? '',
        nameEn: str(x.name_en),
        status: str(x.status) ?? 'active',
        metrics: metrics(x.metrics),
      };
    }),
    academicStatus: arr(o.academic_status).map((b): Breakdown => {
      const x = obj(b);
      return { key: str(x.key) ?? '', count: numOrNull(x.count) };
    }),
    universities: arr(o.universities).map((b): Breakdown => {
      const x = obj(b);
      const ar = str(x.name_ar) ?? '';
      return {
        key: str(x.id)?.toString() ?? String(x.id),
        label: { ar, en: str(x.name_en) ?? ar },
        count: numOrNull(x.count),
      };
    }),
  };
}

export async function getCommitteeStats(
  committeeId: string,
  period: Period,
): Promise<CommitteeStats | null> {
  if (!/^[0-9a-f-]{36}$/i.test(committeeId)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('committee_stats', {
    p_committee: committeeId,
    p_from: period.from,
    p_to: period.to,
  });
  if (error || !data) return null;
  const o = obj(data);
  const c = obj(o.committee);
  return {
    period,
    committee: {
      id: str(c.id) ?? committeeId,
      slug: str(c.slug) ?? '',
      nameAr: str(c.name_ar) ?? '',
      nameEn: str(c.name_en),
    },
    current: metrics(o.current),
    previous: metrics(o.previous),
    events: arr(o.events).map((e): CommitteeEventRow => {
      const x = obj(e);
      return {
        id: str(x.id) ?? '',
        slug: str(x.slug) ?? '',
        titleAr: str(x.title_ar) ?? '',
        titleEn: str(x.title_en),
        status: str(x.status) ?? '',
        lastDate: str(x.last_date) ?? '',
        registrations: num(x.registrations),
        accepted: num(x.accepted),
        attendance: numOrNull(x.attendance),
      };
    }),
  };
}

export async function getPendingQueues(): Promise<PendingQueues> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('pending_queues');
  const o = obj(data);
  return {
    eventsPendingReview: num(o.events_pending_review),
    articlesInReview: num(o.articles_in_review),
    applicationsOpen: num(o.applications_open),
    registrationsPending: num(o.registrations_pending),
    changesRequested: num(o.changes_requested),
    failedEmails: num(o.failed_emails),
    items: arr(o.items).map((i): QueueItem => {
      const x = obj(i);
      return {
        kind: (str(x.kind) ?? 'event') as QueueItem['kind'],
        id: str(x.id) ?? '',
        titleAr: str(x.title_ar) ?? '',
        titleEn: str(x.title_en),
        at: str(x.at),
      };
    }),
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('dashboard_summary');
  const o = obj(data);
  const cycle = o.open_cycle ? obj(o.open_cycle) : null;
  return {
    activeMembers: numOrNull(o.active_members),
    newMembersYear: numOrNull(o.new_members_year),
    upcomingEvents: num(o.upcoming_events),
    upcoming: arr(o.upcoming).map((u) => {
      const x = obj(u);
      return {
        id: str(x.id) ?? '',
        slug: str(x.slug) ?? '',
        titleAr: str(x.title_ar) ?? '',
        titleEn: str(x.title_en),
        committeeAr: str(x.committee_ar) ?? '',
        committeeEn: str(x.committee_en),
        startDate: str(x.start_date),
        seats: numOrNull(x.seats),
        accepted: num(x.accepted),
      };
    }),
    openCycle: cycle
      ? {
          nameAr: str(cycle.name_ar) ?? '',
          nameEn: str(cycle.name_en),
          closesAt: str(cycle.closes_at) ?? '',
        }
      : null,
  };
}

export async function getMyActivity(): Promise<MyActivity> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('my_activity');
  const o = obj(data);
  const app = o.application ? obj(o.application) : null;
  const member = o.member ? obj(o.member) : null;
  return {
    registrations: arr(o.registrations).map((r) => {
      const x = obj(r);
      return {
        id: str(x.id) ?? '',
        status: str(x.status) ?? '',
        slug: str(x.slug) ?? '',
        titleAr: str(x.title_ar) ?? '',
        titleEn: str(x.title_en),
        startDate: str(x.start_date),
        attendancePercent: numOrNull(x.attendance_percent),
        certificateId: str(x.certificate_id),
      };
    }),
    application: app
      ? {
          status: str(app.status) ?? '',
          cycleAr: str(app.cycle_ar) ?? '',
          cycleEn: str(app.cycle_en),
          submittedAt: str(app.submitted_at),
        }
      : null,
    member: member
      ? { status: str(member.status) ?? '', joinedAt: str(member.joined_at) ?? '' }
      : null,
    threads: num(o.threads),
  };
}
