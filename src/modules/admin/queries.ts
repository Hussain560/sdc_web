import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/database.types';

const obj = (v: Json | undefined | null): Record<string, Json> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, Json>) : {};
const str = (v: Json | undefined) => (typeof v === 'string' ? v : null);

export type AuditRow = {
  id: number;
  at: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: Record<string, Json>;
  actor: { id: string; nameAr: string | null; nameEn: string | null } | null;
};

export type AuditFilter = {
  actor?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Clean filter values from the URL: unknown shapes are dropped rather than sent to the database. */
export function cleanAuditFilter(sp: Record<string, string | undefined>): AuditFilter {
  const text = (v: string | undefined, max: number) =>
    v && v.length <= max ? v.trim() : undefined;
  return {
    actor: text(sp.actor, 80) || undefined,
    action: sp.action && /^[a-z_]{1,40}(\.[a-z_]{1,40})?$/.test(sp.action) ? sp.action : undefined,
    entity: sp.entity && /^[a-z_]{1,40}$/.test(sp.entity) ? sp.entity : undefined,
    from: sp.from && DATE.test(sp.from) ? sp.from : undefined,
    to: sp.to && DATE.test(sp.to) ? sp.to : undefined,
  };
}

export async function listAuditLogs(
  filter: AuditFilter,
  page: number,
  pageSize = 25,
): Promise<{ total: number; rows: AuditRow[] } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_audit_logs', {
    p_actor: filter.actor,
    p_action: filter.action,
    p_entity: filter.entity,
    p_from: filter.from,
    p_to: filter.to,
    p_limit: pageSize,
    p_offset: Math.max(0, (page - 1) * pageSize),
  });
  if (error || !data) return null;
  const o = obj(data);
  const rows = Array.isArray(o.rows) ? o.rows : [];
  return {
    total: typeof o.total === 'number' ? o.total : 0,
    rows: rows.map((r): AuditRow => {
      const x = obj(r);
      const a = x.actor ? obj(x.actor) : null;
      return {
        id: typeof x.id === 'number' ? x.id : 0,
        at: str(x.at) ?? '',
        action: str(x.action) ?? '',
        entityType: str(x.entity_type) ?? '',
        entityId: str(x.entity_id) ?? '',
        summary: obj(x.summary),
        actor: a ? { id: str(a.id) ?? '', nameAr: str(a.name_ar), nameEn: str(a.name_en) } : null,
      };
    }),
  };
}

export async function getAuditFacets(): Promise<{ actions: string[]; entities: string[] }> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('audit_facets');
  const o = obj(data);
  const list = (v: Json | undefined) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  return { actions: list(o.actions), entities: list(o.entities) };
}

export type AdminSettings = {
  socialInstagram: string;
  socialLinkedin: string;
  socialX: string;
  contactEmail: string;
  footerRightsAr: string;
  footerRightsEn: string;
  certificatesEnabled: boolean;
  certificateThreshold: number;
};

/** Every setting (the admin RLS policy exposes the private keys too). */
export async function getAdminSettings(): Promise<AdminSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from('site_settings').select('key, value');
  const m = new Map((data ?? []).map((r) => [r.key, r.value]));
  const s = (k: string) => (typeof m.get(k) === 'string' ? (m.get(k) as string) : '');
  const th = m.get('certificate_threshold');
  return {
    socialInstagram: s('social_instagram'),
    socialLinkedin: s('social_linkedin'),
    socialX: s('social_x'),
    contactEmail: s('contact_email'),
    footerRightsAr: s('footer_rights_ar'),
    footerRightsEn: s('footer_rights_en'),
    certificatesEnabled: m.get('certificates_enabled') === true,
    certificateThreshold: typeof th === 'number' ? th : 70,
  };
}

export type PartnerRow = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  displayOrder: number;
  isActive: boolean;
};

export async function listPartners(): Promise<PartnerRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('partners')
    .select('id, name_ar, name_en, logo_url, website_url, display_order, is_active')
    .order('display_order')
    .order('name_ar');
  return (data ?? []).map((p) => ({
    id: p.id,
    nameAr: p.name_ar,
    nameEn: p.name_en,
    logoUrl: p.logo_url,
    websiteUrl: p.website_url,
    displayOrder: p.display_order,
    isActive: p.is_active,
  }));
}

export type TagRow = {
  id: string;
  slug: string;
  labelAr: string;
  labelEn: string | null;
  uses: number;
};

export async function listTags(): Promise<TagRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc('tag_usage');
  return (data ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    labelAr: t.label_ar,
    labelEn: t.label_en,
    uses: t.uses,
  }));
}
