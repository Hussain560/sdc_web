import { createPublicClient } from '@/lib/supabase/public';
import { memberThumbUrl } from '@/modules/members/photo-url';
import type { PublicStats } from './sections';

export type HomeMember = {
  id: string;
  nameAr: string;
  nameEn: string;
  trackAr: string | null;
  trackEn: string | null;
  /** 128 px photo, only when the member made it public. */
  thumb: string | null;
};

/** Counts for the stats row. A failed read hides the row (never a made-up number). */
export async function getPublicStats(): Promise<PublicStats | null> {
  const { data, error } = await createPublicClient().from('public_stats').select('*').maybeSingle();
  if (error || !data) return null;
  return {
    events: data.events_held ?? undefined,
    members: data.members_listed ?? undefined,
    committees: data.committees_active ?? undefined,
    certificates: data.certificates_issued ?? undefined,
  };
}

/** The same order for everyone during one UTC day, a different one tomorrow (Q-M9: a daily shuffle, not a random one per request). */
function dayRank(id: string, day: number) {
  let h = day;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
  return h >>> 0;
}

/**
 * Listed members for the home block and the marquee (the directory view already applies consent): members with a public
 * photo first, shuffled once a day inside each group, so the strip changes daily and no one stays in front for good.
 */
export async function listHomeMembers(limit = 24): Promise<HomeMember[]> {
  const { data, error } = await createPublicClient()
    .from('member_directory')
    .select(
      'id, first_name, last_name, first_name_en, last_name_en, track, track_en, headline, headline_en, photo_path',
    )
    .limit(120);
  if (error || !data) return [];
  const day = Math.floor(Date.now() / 86_400_000);
  return data
    .flatMap((m) => {
      const ar = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim();
      if (!m.id || !ar) return [];
      const en = `${m.first_name_en ?? ''} ${m.last_name_en ?? ''}`.trim() || ar;
      return [
        {
          id: m.id,
          nameAr: ar,
          nameEn: en,
          trackAr: m.headline ?? m.track,
          trackEn: m.headline_en ?? m.headline ?? m.track_en ?? m.track,
          thumb: memberThumbUrl(m.photo_path),
        },
      ];
    })
    .sort(
      (a, b) => Number(!!b.thumb) - Number(!!a.thumb) || dayRank(a.id, day) - dayRank(b.id, day),
    )
    .slice(0, limit);
}

/** Below this many listed members a moving strip looks empty, so the home page keeps the plain grid. */
export const MARQUEE_MIN = 6;
