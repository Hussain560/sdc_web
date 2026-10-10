import { createPublicClient } from '@/lib/supabase/public';
import type { PublicStats } from './sections';

export type HomeMember = {
  id: string;
  nameAr: string;
  nameEn: string;
  trackAr: string | null;
  trackEn: string | null;
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

/** A few listed members for the home block (names and track only; the directory view already applies consent). */
export async function listHomeMembers(limit = 4): Promise<HomeMember[]> {
  const { data, error } = await createPublicClient()
    .from('member_directory')
    .select('id, first_name, last_name, first_name_en, last_name_en, track, track_en, joined_at')
    .order('joined_at', { ascending: false, nullsFirst: false })
    .limit(limit);
  if (error || !data) return [];
  return data.flatMap((m) => {
    const ar = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim();
    if (!m.id || !ar) return [];
    const en = `${m.first_name_en ?? ''} ${m.last_name_en ?? ''}`.trim() || ar;
    return [{ id: m.id, nameAr: ar, nameEn: en, trackAr: m.track, trackEn: m.track_en }];
  });
}
