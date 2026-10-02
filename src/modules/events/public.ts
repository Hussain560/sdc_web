import { createPublicClient } from '@/lib/supabase/public';
import type { Database, Json } from '@/lib/supabase/database.types';
import { clientEnv } from '@/lib/env';
import type { EventPhase } from './types';
import type { ListBlock, PublicEventCard, PublicEventDetail } from './public-types';

type Row = Database['public']['Views']['public_events']['Row'];

const FALLBACK_COVER = '/assets/event-card.png';

/** A path starting with "/" is a static asset of the site; anything else lives in the public-media bucket. */
export function coverSrc(path: string | null): string {
  if (!path) return FALLBACK_COVER;
  if (path.startsWith('/') || /^https?:\/\//.test(path)) return path;
  return `${clientEnv.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/public-media/${path}`;
}

const CARD_COLUMNS =
  'id, slug, title_ar, title_en, location_ar, location_en, start_date, end_date, start_time, end_time, phase, cover_image_path, seats_left';

function toCard(r: Row): PublicEventCard {
  return {
    id: r.id!,
    slug: r.slug!,
    titleAr: r.title_ar!,
    titleEn: r.title_en,
    locationAr: r.location_ar,
    locationEn: r.location_en,
    startDate: r.start_date,
    endDate: r.end_date,
    startTime: r.start_time,
    endTime: r.end_time,
    phase: (r.phase ?? 'announced') as EventPhase,
    cover: coverSrc(r.cover_image_path),
    seatsLeft: r.seats_left,
  };
}

/** Undated (announced) events first, then the newest. Never throws: a failed read renders an empty list. */
export async function listPublicEvents(limit?: number): Promise<PublicEventCard[]> {
  let q = createPublicClient()
    .from('public_events')
    .select(CARD_COLUMNS)
    .order('start_date', { ascending: false, nullsFirst: true })
    .order('published_at', { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) console.error('[events] public list failed', error.code);
  return ((data ?? []) as unknown as Row[]).map(toCard);
}

const asList = (v: Json | undefined): ListBlock => {
  const o = (v && typeof v === 'object' && !Array.isArray(v) ? v : {}) as Record<string, Json>;
  const arr = (x: Json | undefined) =>
    Array.isArray(x) ? x.map(String).filter((s) => s.trim()) : [];
  return { ar: arr(o.ar), en: arr(o.en) };
};

export async function getPublicEvent(slug: string): Promise<PublicEventDetail | null> {
  const { data } = await createPublicClient()
    .from('public_events')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return null;
  const r = data as Row;
  const details = (
    r.details && typeof r.details === 'object' && !Array.isArray(r.details) ? r.details : {}
  ) as Record<string, Json>;
  const cfg = (
    r.display_config && typeof r.display_config === 'object' && !Array.isArray(r.display_config)
      ? r.display_config
      : {}
  ) as Record<string, Json>;
  const faq = (Array.isArray(r.faq) ? r.faq : []).map((f) => {
    const o = (f ?? {}) as Record<string, Json>;
    const s = (k: string) => (typeof o[k] === 'string' ? (o[k] as string) : '');
    return { qAr: s('q_ar'), qEn: s('q_en'), aAr: s('a_ar'), aEn: s('a_en') };
  });
  return {
    ...toCard(r),
    mapUrl: r.map_url,
    awardsAr: r.awards_ar,
    awardsEn: r.awards_en,
    contactEmail: r.contact_email,
    contactPhone: r.contact_phone,
    audience: asList(details.target_audience),
    responsibilities: asList(details.responsibilities),
    requirements: asList(details.requirements),
    deliverables: asList(details.deliverables),
    benefits: asList(details.benefits),
    faq,
    show: { faq: cfg.show_faq !== false, details: cfg.show_details !== false },
  };
}

/** Old numeric URLs (/events/2) keep working: they resolve through events.legacy_id. */
export async function slugForLegacyId(id: number): Promise<string | null> {
  const { data } = await createPublicClient()
    .from('public_events')
    .select('slug')
    .eq('legacy_id', id)
    .maybeSingle();
  return data?.slug ?? null;
}
