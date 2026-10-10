import { createPublicClient } from '@/lib/supabase/public';
import { coverSrc } from '@/modules/events/public';

/** Public member data. Only what `member_directory` exposes: never an e-mail or a phone number. */
export type DirectoryMember = {
  id: string;
  nameAr: string;
  nameEn: string;
  trackAr: string | null;
  trackEn: string | null;
  universityAr: string | null;
  universityEn: string | null;
  statusAr: string | null;
  statusEn: string | null;
  majorAr: string | null;
  majorEn: string | null;
  bioAr: string | null;
  bioEn: string | null;
  photo: string | null;
  links: { portfolio?: string; github?: string; linkedin?: string; x?: string };
  legacyId: number | null;
};

export type LeadershipPerson = {
  id: string;
  roleKey: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  bioAr: string;
  bioEn: string;
  committeeAr: string | null;
  committeeEn: string | null;
  roleOrder: number;
  committeeOrder: number;
};

const https = (u: string | null) => (u && /^https:\/\//.test(u) ? u : undefined);

export async function listDirectory(): Promise<DirectoryMember[]> {
  const { data, error } = await createPublicClient().from('member_directory').select('*');
  if (error || !data) return [];
  return data.flatMap((m) => {
    if (!m.id) return [];
    const ar = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim();
    if (!ar) return [];
    const en = `${m.first_name_en ?? ''} ${m.last_name_en ?? ''}`.trim() || ar;
    return [
      {
        id: m.id,
        nameAr: ar,
        nameEn: en,
        trackAr: m.track,
        trackEn: m.track_en,
        universityAr: m.university,
        universityEn: m.university_en,
        statusAr: m.status,
        statusEn: m.status_en,
        majorAr: m.sub_major ?? m.major,
        majorEn: m.sub_major_en ?? m.major_en ?? m.sub_major ?? m.major,
        bioAr: m.bio,
        bioEn: m.bio_en,
        photo: m.photo_path ? coverSrc(m.photo_path) : null,
        links: {
          portfolio: https(m.portfolio_url),
          github: https(m.github_url),
          linkedin: https(m.linkedin_url),
          x: https(m.x_url),
        },
        legacyId: m.legacy_id,
      },
    ];
  });
}

/** A listed member by uuid, or by the old numeric id (only while listed). Null is a 404. */
export async function getDirectoryMember(raw: string): Promise<DirectoryMember | null> {
  const all = await listDirectory();
  if (/^\d+$/.test(raw)) return all.find((m) => m.legacyId === Number(raw)) ?? null;
  return all.find((m) => m.id === raw) ?? null;
}

export async function listLeadership(): Promise<LeadershipPerson[]> {
  const { data, error } = await createPublicClient().from('current_positions').select('*');
  if (error || !data) return [];
  return data
    .flatMap((r) => {
      if (!r.assignment_id) return [];
      const ar =
        r.display_title_ar || [r.role_name_ar, r.committee_name_ar].filter(Boolean).join(' ');
      const en =
        r.display_title_en || [r.role_name_en, r.committee_name_en].filter(Boolean).join(' ') || ar;
      return [
        {
          id: r.assignment_id,
          roleKey: r.role_key ?? '',
          nameAr: r.person_name_ar ?? '',
          nameEn: r.person_name_en ?? r.person_name_ar ?? '',
          roleAr: ar,
          roleEn: en,
          bioAr: r.public_bio_ar ?? '',
          bioEn: r.public_bio_en ?? r.public_bio_ar ?? '',
          committeeAr: r.committee_name_ar,
          committeeEn: r.committee_name_en,
          roleOrder: r.role_order ?? 0,
          committeeOrder: r.committee_order ?? 0,
        },
      ];
    })
    .filter((p) => p.nameAr)
    .sort((a, b) => a.roleOrder - b.roleOrder || a.committeeOrder - b.committeeOrder);
}

export type DirectoryQuery = { q: string; track: string; university: string; limit: number };

export const PAGE_SIZE = 24;

const norm = (s: string) => s.normalize('NFKD').toLowerCase().trim();

/** Search by name in both languages, filter by track and university, alphabetical by the page language. */
export function filterDirectory(
  all: DirectoryMember[],
  query: DirectoryQuery,
  lang: 'ar' | 'en',
): { total: number; items: DirectoryMember[] } {
  const q = norm(query.q);
  const name = (m: DirectoryMember) => (lang === 'en' ? m.nameEn : m.nameAr) || m.nameAr;
  const rows = all
    .filter((m) => {
      if (q && !norm(`${m.nameAr} ${m.nameEn}`).includes(q)) return false;
      if (query.track && m.trackAr !== query.track && m.trackEn !== query.track) return false;
      if (
        query.university &&
        m.universityAr !== query.university &&
        m.universityEn !== query.university
      )
        return false;
      return true;
    })
    .sort((a, b) => name(a).localeCompare(name(b), lang));
  return { total: rows.length, items: rows.slice(0, query.limit) };
}

/** Distinct values for the filter menus, in the page language. */
export function filterOptions(all: DirectoryMember[], lang: 'ar' | 'en') {
  const uniq = (xs: Array<string | null>) =>
    [...new Set(xs.filter((x): x is string => !!x))].sort((a, b) => a.localeCompare(b, lang));
  return {
    tracks: uniq(all.map((m) => (lang === 'en' ? (m.trackEn ?? m.trackAr) : m.trackAr))),
    universities: uniq(
      all.map((m) => (lang === 'en' ? (m.universityEn ?? m.universityAr) : m.universityAr)),
    ),
  };
}
