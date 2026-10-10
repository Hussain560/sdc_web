import { createClient } from '@/lib/supabase/server';
import { createPublicClient } from '@/lib/supabase/public';
import type { Localized } from '@/modules/access/types';

export type CommitteeCard = {
  id: string;
  slug: string;
  name: Localized;
  status: 'active' | 'inactive';
  displayOrder: number;
  head: Localized | null;
  deputy: Localized | null;
  members: number;
  events: number;
  articles: number;
};

const loc = (ar: string | null, en: string | null): Localized | null =>
  ar ? { ar, en: en ?? ar } : null;

/** Cards for /dashboard/committees: everything for leadership and viewers, only their own committees for a head. */
export async function listCommitteeCards(): Promise<CommitteeCard[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('committee_cards');
  return (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: { ar: c.name_ar, en: c.name_en ?? c.name_ar },
    status: c.status as 'active' | 'inactive',
    displayOrder: c.display_order,
    head: loc(c.head_name_ar, c.head_name_en),
    deputy: loc(c.deputy_name_ar, c.deputy_name_en),
    members: c.members_count,
    events: c.events_count,
    articles: c.articles_count,
  }));
}

export type CommitteeDetail = {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  contactEmail: string | null;
  displayOrder: number;
  status: 'active' | 'inactive';
};

export async function getCommittee(id: string): Promise<CommitteeDetail | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data: c } = await supabase.from('committees').select('*').eq('id', id).maybeSingle();
  if (!c) return null;
  return {
    id: c.id,
    slug: c.slug,
    nameAr: c.name_ar,
    nameEn: c.name_en,
    descriptionAr: c.description_ar,
    descriptionEn: c.description_en,
    contactEmail: c.contact_email,
    displayOrder: c.display_order,
    status: c.status as 'active' | 'inactive',
  };
}

export type Leader = {
  roleKey: string;
  role: Localized;
  name: Localized;
  title: Localized | null;
};

export type PublicCommittee = CommitteeDetail & {
  leaders: Leader[];
  events: Array<{
    slug: string;
    titleAr: string;
    titleEn: string | null;
    startDate: string | null;
    phase: string | null;
  }>;
  articles: Array<{ slug: string; titleAr: string; titleEn: string | null; publishedAt: string }>;
};

/** Public committee page data (CM-7): description, public leadership, published events and threads. */
export async function getPublicCommittee(slug: string): Promise<PublicCommittee | null> {
  const db = createPublicClient();
  const { data: c } = await db
    .from('committees')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (!c) return null;
  const [{ data: positions }, { data: events }, { data: articles }] = await Promise.all([
    db
      .from('current_positions')
      .select(
        'role_key, role_name_ar, role_name_en, role_order, display_title_ar, display_title_en, person_name_ar, person_name_en',
      )
      .eq('committee_id', c.id)
      .order('role_order'),
    db
      .from('public_events')
      .select('slug, title_ar, title_en, start_date, phase')
      .eq('committee_id', c.id)
      .order('start_date', { ascending: false, nullsFirst: true })
      .limit(6),
    db
      .from('public_articles')
      .select('slug, title_ar, title_en, published_at, display_rank')
      .eq('committee_id', c.id)
      .order('display_rank')
      .limit(6),
  ]);
  return {
    id: c.id,
    slug: c.slug,
    nameAr: c.name_ar,
    nameEn: c.name_en,
    descriptionAr: c.description_ar,
    descriptionEn: c.description_en,
    contactEmail: c.contact_email,
    displayOrder: c.display_order,
    status: 'active',
    leaders: (positions ?? []).map((p) => ({
      roleKey: p.role_key!,
      role: { ar: p.role_name_ar!, en: p.role_name_en ?? p.role_name_ar! },
      name: { ar: p.person_name_ar!, en: p.person_name_en ?? p.person_name_ar! },
      title:
        p.display_title_ar || p.display_title_en
          ? {
              ar: p.display_title_ar ?? p.display_title_en ?? '',
              en: p.display_title_en ?? p.display_title_ar ?? '',
            }
          : null,
    })),
    events: (events ?? []).map((e) => ({
      slug: e.slug!,
      titleAr: e.title_ar!,
      titleEn: e.title_en,
      startDate: e.start_date,
      phase: e.phase,
    })),
    articles: (articles ?? []).map((a) => ({
      slug: a.slug!,
      titleAr: a.title_ar!,
      titleEn: a.title_en,
      publishedAt: a.published_at!,
    })),
  };
}

/** Founders, leader and advisor: the global strip of the committees list (public positions). */
export async function listCommunityLeadership(): Promise<Leader[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('current_positions')
    .select(
      'role_key, role_name_ar, role_name_en, role_order, display_title_ar, display_title_en, person_name_ar, person_name_en',
    )
    .is('committee_id', null)
    .order('role_order');
  return (data ?? []).map((p) => ({
    roleKey: p.role_key!,
    role: { ar: p.role_name_ar!, en: p.role_name_en ?? p.role_name_ar! },
    name: { ar: p.person_name_ar!, en: p.person_name_en ?? p.person_name_ar! },
    title:
      p.display_title_ar || p.display_title_en
        ? {
            ar: p.display_title_ar ?? p.display_title_en ?? '',
            en: p.display_title_en ?? p.display_title_ar ?? '',
          }
        : null,
  }));
}

export type PublicCommitteeCard = {
  slug: string;
  nameAr: string;
  nameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  leadAr: string | null;
  leadEn: string | null;
  events: number;
};

/** Active committees for /committees: public columns, the head from public positions, and the event count. */
export async function listPublicCommittees(): Promise<PublicCommitteeCard[]> {
  const db = createPublicClient();
  const [{ data: committees }, { data: heads }, { data: events }] = await Promise.all([
    db
      .from('committees')
      .select('slug, name_ar, name_en, description_ar, description_en, display_order')
      .eq('status', 'active')
      .order('display_order'),
    db
      .from('current_positions')
      .select('person_name_ar, person_name_en, role_key, committee_name_ar')
      .eq('role_key', 'committee_head'),
    db.from('public_events').select('committee_slug'),
  ]);
  const counts = new Map<string, number>();
  for (const e of events ?? [])
    if (e.committee_slug) counts.set(e.committee_slug, (counts.get(e.committee_slug) ?? 0) + 1);
  const headByName = new Map<string, { ar: string | null; en: string | null }>();
  for (const h of heads ?? [])
    if (h.committee_name_ar)
      headByName.set(h.committee_name_ar, { ar: h.person_name_ar, en: h.person_name_en });
  return (committees ?? []).map((c) => {
    const head = headByName.get(c.name_ar);
    return {
      slug: c.slug,
      nameAr: c.name_ar,
      nameEn: c.name_en,
      descriptionAr: c.description_ar,
      descriptionEn: c.description_en,
      leadAr: head?.ar ?? null,
      leadEn: head?.en ?? head?.ar ?? null,
      events: counts.get(c.slug) ?? 0,
    };
  });
}
