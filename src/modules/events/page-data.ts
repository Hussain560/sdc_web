import type { Json } from '@/lib/supabase/database.types';
import { createPublicClient } from '@/lib/supabase/public';
import { coverSrc, getPublicEvent, listPublicEvents } from './public';
import type { PublicEventCard, PublicEventDetail } from './public-types';

export type EventDay = {
  date: string;
  startsAt: string | null;
  endsAt: string | null;
  locationAr: string | null;
  locationEn: string | null;
};

export type EventPresenter = {
  id: string;
  role: 'presenter' | 'mentor' | 'judge' | 'host';
  nameAr: string;
  nameEn: string;
  titleAr: string | null;
  titleEn: string | null;
  photo: string | null;
  link: string | null;
};

/** Everything the v2 event page shows, read with the cookie-less client so the page stays cacheable. */
export type EventPageData = {
  event: PublicEventDetail & {
    type: string;
    committeeSlug: string | null;
    committeeNameAr: string | null;
    committeeNameEn: string | null;
    audienceMode: 'public' | 'members_only';
    waitlistEnabled: boolean;
    seats: number | null;
    registrationStartAt: string | null;
    registrationEndAt: string | null;
    summaryAr: string | null;
    summaryEn: string | null;
    descriptionAr: string | null;
    descriptionEn: string | null;
    goalsAr: string[];
    goalsEn: string[];
    whatToBringAr: string[];
    whatToBringEn: string[];
    certificateAvailable: boolean;
    cancelReason: string | null;
    locationMode: 'in_person' | 'online' | 'hybrid';
    show: PublicEventDetail['show'] & { presenters: boolean; goals: boolean; seats: boolean };
  };
  days: EventDay[];
  presenters: EventPresenter[];
  certificate: { enabled: boolean; threshold: number };
  checkinOpen: boolean;
  related: PublicEventCard[];
};

const strings = (v: Json | undefined): string[] =>
  Array.isArray(v) ? v.map(String).filter((s) => s.trim()) : [];
const obj = (v: Json | null | undefined) =>
  (v && typeof v === 'object' && !Array.isArray(v) ? v : {}) as Record<string, Json>;
const pair = (v: Json | null | undefined) => {
  const o = obj(v);
  return { ar: strings(o.ar), en: strings(o.en) };
};

type PresenterRow = {
  id: string;
  role: EventPresenter['role'];
  name_ar: string | null;
  name_en: string | null;
  title_ar: string | null;
  title_en: string | null;
  photo_path: string | null;
  link: string | null;
};

export async function getEventPage(slug: string): Promise<EventPageData | null> {
  const base = await getPublicEvent(slug);
  if (!base) return null;
  const sb = createPublicClient();

  const [{ data: raw }, { data: dates }, presenterRes, { data: settings }, { data: open }] =
    await Promise.all([
      sb.from('public_events').select('*').eq('slug', slug).maybeSingle(),
      sb.from('event_dates').select('*').eq('event_id', base.id).order('event_date'),
      sb.rpc('event_presenters_for', { p_event: base.id }),
      sb
        .from('site_settings')
        .select('key, value')
        .in('key', ['certificates_enabled', 'certificate_threshold']),
      sb.rpc('event_checkin_open', { p_slug: slug }),
    ]);
  if (!raw) return null;

  const cfg = obj(raw.display_config);
  const details = obj(raw.details);
  const goals = pair(raw.goals);
  const bring = pair(details.what_to_bring);
  const setting = (k: string) => (settings ?? []).find((s) => s.key === k)?.value;

  const presenters = ((presenterRes.data ?? []) as unknown as PresenterRow[]).map((p) => ({
    id: p.id,
    role: p.role,
    nameAr: p.name_ar ?? '',
    nameEn: p.name_en ?? p.name_ar ?? '',
    titleAr: p.title_ar,
    titleEn: p.title_en,
    photo: p.photo_path ? coverSrc(p.photo_path) : null,
    link: p.link,
  }));

  const all = await listPublicEvents();
  const related = all
    .filter((e) => e.slug !== slug && (e.phase === 'registration_open' || e.phase === 'announced'))
    .slice(0, 3);

  return {
    event: {
      ...base,
      type: raw.type ?? 'workshop',
      committeeSlug: raw.committee_slug,
      committeeNameAr: raw.committee_name_ar,
      committeeNameEn: raw.committee_name_en,
      audienceMode: raw.audience === 'members_only' ? 'members_only' : 'public',
      waitlistEnabled: !!raw.waitlist_enabled,
      seats: raw.seats,
      registrationStartAt: raw.registration_start_at,
      registrationEndAt: raw.registration_end_at,
      summaryAr: raw.summary_ar,
      summaryEn: raw.summary_en,
      descriptionAr: raw.description_ar,
      descriptionEn: raw.description_en,
      goalsAr: goals.ar,
      goalsEn: goals.en,
      whatToBringAr: bring.ar,
      whatToBringEn: bring.en,
      certificateAvailable: !!raw.certificate_available,
      cancelReason: raw.cancel_reason,
      locationMode: (raw.location_mode as 'in_person' | 'online' | 'hybrid') ?? 'in_person',
      show: {
        ...base.show,
        presenters: cfg.show_presenters === true,
        goals: cfg.show_goals !== false,
        seats: cfg.show_seats_remaining === true,
      },
    },
    days: (
      (dates ?? []) as unknown as Array<{
        event_date: string;
        starts_at: string | null;
        ends_at: string | null;
        location_ar?: string | null;
        location_en?: string | null;
      }>
    ).map((d) => ({
      date: d.event_date,
      startsAt: d.starts_at,
      endsAt: d.ends_at,
      locationAr: d.location_ar ?? null,
      locationEn: d.location_en ?? null,
    })),
    presenters,
    certificate: {
      enabled: setting('certificates_enabled') === true,
      threshold:
        typeof setting('certificate_threshold') === 'number'
          ? (setting('certificate_threshold') as number)
          : 70,
    },
    checkinOpen: open === true,
    related,
  };
}
