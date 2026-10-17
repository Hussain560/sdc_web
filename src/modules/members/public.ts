import { cache } from 'react';
import type { Database } from '@/lib/supabase/database.types';
import { createPublicClient } from '@/lib/supabase/public';
import { memberPhotoUrl, memberThumbUrl } from './photo-url';

/**
 * Public member data (Sprint 17). Everything here comes from views that already apply the member's consent: a field a
 * member did not turn on is simply null or empty. Never an e-mail or a phone number.
 */
type DirectoryRow = Database['public']['Views']['member_directory']['Row'];

export type MemberCommittee = {
  slug: string;
  nameAr: string;
  nameEn: string;
  roleKey: string;
  roleAr: string;
  roleEn: string;
  since: string;
};

export type DirectoryMember = {
  id: string;
  nameAr: string;
  nameEn: string;
  headlineAr: string | null;
  headlineEn: string | null;
  skillSlugs: string[];
  openTo: string[];
  committees: MemberCommittee[];
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
  /** 512 px photo, only when the member chose to show it. */
  photo: string | null;
  /** 128 px thumbnail of the same photo, for cards. */
  thumb: string | null;
  links: {
    portfolio?: string;
    github?: string;
    linkedin?: string;
    x?: string;
    website?: string;
    behance?: string;
    dribbble?: string;
    youtube?: string;
  };
  joinedAt: string | null;
  legacyId: number | null;
};

export type LeadershipPerson = {
  id: string;
  /** Present only for a person who is listed in the directory: the card links to the profile. */
  memberId: string | null;
  photo: string | null;
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

export type PublicSkill = { slug: string; nameAr: string; nameEn: string; category: string };

const https = (u: string | null) => (u && /^https:\/\//.test(u) ? u : undefined);
const join = (...parts: Array<string | null | undefined>) =>
  parts
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(' ');

type RawCommittee = {
  slug: string;
  name_ar: string;
  name_en: string;
  role_key: string;
  role_ar: string;
  role_en: string;
  since: string;
};

export function toMember(m: DirectoryRow): DirectoryMember | null {
  if (!m.id) return null;
  const nameAr = join(m.first_name, m.middle_name, m.last_name);
  if (!nameAr) return null;
  const nameEn = join(m.first_name_en, m.middle_name_en, m.last_name_en) || nameAr;
  return {
    id: m.id,
    nameAr,
    nameEn,
    headlineAr: m.headline,
    headlineEn: m.headline_en,
    skillSlugs: m.skill_slugs ?? [],
    openTo: m.open_to ?? [],
    committees: ((m.committees as RawCommittee[] | null) ?? []).map((c) => ({
      slug: c.slug,
      nameAr: c.name_ar,
      nameEn: c.name_en,
      roleKey: c.role_key,
      roleAr: c.role_ar,
      roleEn: c.role_en,
      since: c.since,
    })),
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
    photo: memberPhotoUrl(m.photo_path),
    thumb: memberThumbUrl(m.photo_path),
    links: {
      portfolio: https(m.portfolio_url),
      github: https(m.github_url),
      linkedin: https(m.linkedin_url),
      x: https(m.x_url),
      website: https(m.website_url),
      behance: https(m.behance_url),
      dribbble: https(m.dribbble_url),
      youtube: https(m.youtube_url),
    },
    joinedAt: m.joined_at,
    legacyId: m.legacy_id,
  };
}

// ------------------------------------------------------------------------------------------ skills and facets
/** The curated skill list (public reference data), once per request. */
export const getSkillCatalog = cache(async (): Promise<Map<string, PublicSkill>> => {
  const { data } = await createPublicClient()
    .from('skills')
    .select('slug, name_ar, name_en, category, display_order')
    .eq('is_active', true)
    .order('display_order');
  return new Map(
    (data ?? []).map((s) => [
      s.slug,
      { slug: s.slug, nameAr: s.name_ar, nameEn: s.name_en, category: s.category },
    ]),
  );
});

export type DirectoryFacets = {
  total: number;
  skills: Array<PublicSkill & { count: number }>;
  committees: Array<{ slug: string; nameAr: string; nameEn: string; count: number }>;
  tracks: Array<{ nameAr: string; nameEn: string; count: number }>;
};

/**
 * What the directory can be filtered by, with counts, from the listed members only (one light query: arrays and
 * labels, no personal text). Powers the skill chips, the filter menus and "128 members from 5 committees".
 */
export async function getDirectoryFacets(): Promise<DirectoryFacets> {
  const [{ data }, catalog] = await Promise.all([
    createPublicClient()
      .from('member_directory')
      .select('skill_slugs, committees, track, track_en'),
    getSkillCatalog(),
  ]);
  const rows = data ?? [];
  const skillCount = new Map<string, number>();
  const committeeCount = new Map<string, { nameAr: string; nameEn: string; count: number }>();
  const trackCount = new Map<string, { nameAr: string; nameEn: string; count: number }>();
  for (const r of rows) {
    for (const s of r.skill_slugs ?? []) skillCount.set(s, (skillCount.get(s) ?? 0) + 1);
    const seen = new Set<string>();
    for (const c of (r.committees as RawCommittee[] | null) ?? []) {
      if (seen.has(c.slug)) continue;
      seen.add(c.slug);
      const prev = committeeCount.get(c.slug);
      committeeCount.set(c.slug, {
        nameAr: c.name_ar,
        nameEn: c.name_en,
        count: (prev?.count ?? 0) + 1,
      });
    }
    if (r.track) {
      const prev = trackCount.get(r.track);
      trackCount.set(r.track, {
        nameAr: r.track,
        nameEn: r.track_en ?? r.track,
        count: (prev?.count ?? 0) + 1,
      });
    }
  }
  return {
    total: rows.length,
    skills: [...skillCount.entries()]
      .flatMap(([slug, count]) => {
        const s = catalog.get(slug);
        return s ? [{ ...s, count }] : [];
      })
      .sort((a, b) => b.count - a.count || a.nameEn.localeCompare(b.nameEn)),
    committees: [...committeeCount.entries()]
      .map(([slug, v]) => ({ slug, ...v }))
      .sort((a, b) => b.count - a.count),
    tracks: [...trackCount.values()].sort((a, b) => b.count - a.count),
  };
}

// ------------------------------------------------------------------------------------------ the directory
export type DirectoryQuery = {
  q: string;
  skill: string;
  committee: string;
  track: string;
  /** How many members to show (load more adds a page). */
  n: number;
};

export const PAGE_SIZE = 24;

/** Characters that mean something inside a PostgREST filter or a LIKE pattern are dropped from search words. */
const word = (s: string) =>
  s
    .normalize('NFKC')
    .replace(/[%,()*\\"'.:]/g, ' ')
    .trim();

/**
 * One page of the directory, filtered and counted by the database: any word of the name (first, middle, last, both
 * languages), the headline or a skill name, plus a skill, a committee and a track from the URL.
 */
export async function listDirectoryPage(
  query: DirectoryQuery,
  lang: 'ar' | 'en',
): Promise<{ total: number; items: DirectoryMember[] }> {
  const catalog = await getSkillCatalog();
  let rq = createPublicClient().from('member_directory').select('*', { count: 'exact' });

  const terms = word(query.q)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map((t) => t.toLowerCase());
  for (const t of terms) {
    const like = `%${t}%`;
    const bySkill = [...catalog.values()]
      .filter((s) => s.nameEn.toLowerCase().includes(t) || s.nameAr.includes(t))
      .slice(0, 6)
      .map((s) => `skill_slugs.cs.{${s.slug}}`);
    rq = rq.or(
      [
        `first_name.ilike.${like}`,
        `middle_name.ilike.${like}`,
        `last_name.ilike.${like}`,
        `first_name_en.ilike.${like}`,
        `middle_name_en.ilike.${like}`,
        `last_name_en.ilike.${like}`,
        `headline.ilike.${like}`,
        `headline_en.ilike.${like}`,
        ...bySkill,
      ].join(','),
    );
  }
  if (query.skill && /^[a-z0-9-]+$/.test(query.skill))
    rq = rq.contains('skill_slugs', [query.skill]);
  if (query.committee && /^[a-z0-9-]+$/.test(query.committee))
    rq = rq.contains('committee_slugs', [query.committee]);
  const track = word(query.track);
  if (track) rq = rq.or(`track.eq."${track}",track_en.eq."${track}"`);

  const nameColumn = lang === 'en' ? 'first_name_en' : 'first_name';
  const { data, count, error } = await rq
    .order(nameColumn, { ascending: true, nullsFirst: false })
    .order('id')
    .range(0, Math.max(query.n, PAGE_SIZE) - 1);
  if (error || !data) return { total: 0, items: [] };
  return {
    total: count ?? data.length,
    items: data.flatMap((m) => {
      const x = toMember(m);
      return x ? [x] : [];
    }),
  };
}

/** A listed member by uuid, or by the old numeric id (only while listed). Null is a 404. */
export async function getDirectoryMember(raw: string): Promise<DirectoryMember | null> {
  const client = createPublicClient();
  const isLegacy = /^\d+$/.test(raw);
  if (!isLegacy && !/^[0-9a-f-]{36}$/i.test(raw)) return null;
  const q = client.from('member_directory').select('*');
  const { data } = await (
    isLegacy ? q.eq('legacy_id', Number(raw)) : q.eq('id', raw)
  ).maybeSingle();
  return data ? toMember(data) : null;
}

// ------------------------------------------------------------------------------------------ a profile
export type ProfileProject = {
  id: string;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  url: string;
  cover: string | null;
};

export type ProfileEvent = {
  eventId: string;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  startDate: string | null;
  locationAr: string | null;
  locationEn: string | null;
  role: 'presenter' | 'attended';
};

export type ProfileExtras = {
  skills: PublicSkill[];
  projects: ProfileProject[];
  events: ProfileEvent[];
  articleIds: string[];
  similar: DirectoryMember[];
};

/**
 * What hangs off a profile: skills (in the member's order), projects, events (only with the opt-in, the view enforces
 * it), article ids, and up to four listed members with skills in common. Each block is empty when the member did not
 * choose to show it.
 */
export async function getProfileExtras(member: DirectoryMember): Promise<ProfileExtras> {
  const client = createPublicClient();
  const [skills, projects, events, articles, similar] = await Promise.all([
    client
      .from('member_public_skills')
      .select('slug, name_ar, name_en, category, position')
      .eq('member_id', member.id)
      .order('position'),
    client
      .from('member_public_projects')
      .select(
        'project_id, position, title_ar, title_en, description_ar, description_en, url, cover_path',
      )
      .eq('member_id', member.id)
      .order('position'),
    client
      .from('member_public_participation')
      .select('event_id, slug, title_ar, title_en, start_date, location_ar, location_en, role')
      .eq('member_id', member.id)
      .order('start_date', { ascending: false })
      .limit(12),
    client.from('member_public_articles').select('article_id').eq('member_id', member.id),
    member.skillSlugs.length > 0
      ? client
          .from('member_directory')
          .select('*')
          .overlaps('skill_slugs', member.skillSlugs)
          .neq('id', member.id)
          .limit(12)
      : Promise.resolve({ data: [] as DirectoryRow[] }),
  ]);

  // A person who presented and also attended is listed once, as a presenter.
  const seen = new Map<string, ProfileEvent>();
  for (const e of events.data ?? []) {
    if (!e.event_id || !e.slug) continue;
    const prev = seen.get(e.event_id);
    if (prev?.role === 'presenter') continue;
    seen.set(e.event_id, {
      eventId: e.event_id,
      slug: e.slug,
      titleAr: e.title_ar ?? '',
      titleEn: e.title_en,
      startDate: e.start_date,
      locationAr: e.location_ar,
      locationEn: e.location_en,
      role: e.role === 'presenter' ? 'presenter' : 'attended',
    });
  }

  const mine = new Set(member.skillSlugs);
  const similarRanked = (similar.data ?? [])
    .flatMap((m) => {
      const x = toMember(m);
      return x ? [x] : [];
    })
    .sort(
      (a, b) =>
        b.skillSlugs.filter((s) => mine.has(s)).length -
        a.skillSlugs.filter((s) => mine.has(s)).length,
    )
    .slice(0, 4);

  return {
    skills: (skills.data ?? []).map((s) => ({
      slug: s.slug ?? '',
      nameAr: s.name_ar ?? '',
      nameEn: s.name_en ?? '',
      category: s.category ?? 'other',
    })),
    projects: (projects.data ?? []).flatMap((p) =>
      p.project_id && p.url && p.title_ar
        ? [
            {
              id: p.project_id,
              titleAr: p.title_ar,
              titleEn: p.title_en,
              descriptionAr: p.description_ar,
              descriptionEn: p.description_en,
              url: p.url,
              cover: memberPhotoUrl(p.cover_path),
            },
          ]
        : [],
    ),
    events: [...seen.values()],
    articleIds: (articles.data ?? []).flatMap((a) => (a.article_id ? [a.article_id] : [])),
    similar: similarRanked,
  };
}

// ------------------------------------------------------------------------------------------ leadership
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
          memberId: r.member_id ?? null,
          photo: memberThumbUrl(r.member_photo_path),
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
