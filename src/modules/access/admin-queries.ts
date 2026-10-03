import { createClient } from '@/lib/supabase/server';
import type { PageRequest } from '@/lib/pagination';
import type { Localized, PermissionKey, RoleKey } from './types';

export type AssignmentRow = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  roleKey: RoleKey;
  roleName: Localized;
  roleScope: 'global' | 'committee';
  committeeId: string | null;
  committeeName: Localized | null;
  title: Localized | null;
  startsAt: string;
  endsAt: string | null;
  endReason: string | null;
  state: 'scheduled' | 'active' | 'ended';
};

export type CommitteeOption = { id: string; slug: string; name: Localized; status: string };
export type RoleOption = {
  key: RoleKey;
  name: Localized;
  scope: 'global' | 'committee';
  permissions: PermissionKey[];
};

const stateOf = (
  startsAt: string,
  endsAt: string | null,
  now = Date.now(),
): AssignmentRow['state'] => {
  if (new Date(startsAt).getTime() > now) return 'scheduled';
  if (endsAt && new Date(endsAt).getTime() <= now) return 'ended';
  return 'active';
};

export async function listCommittees(): Promise<CommitteeOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('committees')
    .select('id, slug, name_ar, name_en, status')
    .order('display_order');
  return (data ?? []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: { ar: c.name_ar, en: c.name_en ?? c.name_ar },
    status: c.status,
  }));
}

export async function listRoles(): Promise<RoleOption[]> {
  const supabase = await createClient();
  const [{ data: roles }, { data: perms }] = await Promise.all([
    supabase.from('roles').select('key, name_ar, name_en, scope').order('display_order'),
    supabase.from('role_permissions').select('role_key, permission_key'),
  ]);
  return (roles ?? []).map((r) => ({
    key: r.key as RoleKey,
    name: { ar: r.name_ar, en: r.name_en },
    scope: r.scope === 'committee' ? 'committee' : 'global',
    permissions: (perms ?? [])
      .filter((p) => p.role_key === r.key)
      .map((p) => p.permission_key as PermissionKey),
  }));
}

export async function listPermissionLabels(): Promise<
  Record<string, Localized & { module: string }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('permissions')
    .select('key, module, description_ar, description_en');
  return Object.fromEntries(
    (data ?? []).map((p) => [
      p.key,
      { ar: p.description_ar, en: p.description_en, module: p.module },
    ]),
  );
}

export async function listAssignments(
  filters: {
    tab: 'current' | 'history';
    roleKey?: string;
    committeeId?: string;
    q?: string;
  },
  page: Pick<PageRequest, 'from' | 'to'>,
): Promise<{ rows: AssignmentRow[]; total: number }> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const term = filters.q?.trim().replace(/[%,()]/g, ' ');

  let query = supabase
    .from('role_assignments')
    .select(
      `id, user_id, role_key, committee_id, display_title_ar, display_title_en, starts_at, ends_at, end_reason, roles(name_ar, name_en, scope, display_order), committees(name_ar, name_en), profiles!role_assignments_user_id_fkey${term ? '!inner' : ''}(full_name_ar, full_name_en, email)`,
      { count: 'exact' },
    )
    .order('starts_at', { ascending: false })
    .order('id');

  // "Current" = active or scheduled (not yet ended); "History" = ended terms (append-only record).
  query =
    filters.tab === 'current'
      ? query.or(`ends_at.is.null,ends_at.gt.${nowIso}`)
      : query.not('ends_at', 'is', null).lte('ends_at', nowIso);
  if (filters.roleKey) query = query.eq('role_key', filters.roleKey);
  if (filters.committeeId) query = query.eq('committee_id', filters.committeeId);
  if (term) {
    query = query.or(
      `full_name_ar.ilike.%${term}%,full_name_en.ilike.%${term}%,email.ilike.%${term}%`,
      {
        referencedTable: 'profiles',
      },
    );
  }

  const { data, count } = await query.range(page.from, page.to);

  const rows = (data ?? []).map((r): AssignmentRow => ({
    id: r.id,
    userId: r.user_id,
    userName: r.profiles?.full_name_ar ?? '—',
    userEmail: r.profiles?.email ?? '',
    roleKey: r.role_key as RoleKey,
    roleName: { ar: r.roles?.name_ar ?? r.role_key, en: r.roles?.name_en ?? r.role_key },
    roleScope: r.roles?.scope === 'committee' ? 'committee' : 'global',
    committeeId: r.committee_id,
    committeeName: r.committees
      ? { ar: r.committees.name_ar, en: r.committees.name_en ?? r.committees.name_ar }
      : null,
    title:
      r.display_title_ar || r.display_title_en
        ? { ar: r.display_title_ar ?? '', en: r.display_title_en ?? r.display_title_ar ?? '' }
        : null,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    endReason: r.end_reason,
    state: stateOf(r.starts_at, r.ends_at),
  }));
  return { rows, total: count ?? rows.length };
}

/** Users page: profiles matching the search, with their active positions. */
export async function listUsers(q: string, page: Pick<PageRequest, 'from' | 'to'>) {
  const supabase = await createClient();
  let query = supabase
    .from('profiles')
    .select('id, full_name_ar, full_name_en, email, preferred_locale, created_at', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .order('id');
  const term = q.trim().replace(/[%,()]/g, ' ');
  if (term) {
    query = query.or(
      `full_name_ar.ilike.%${term}%,full_name_en.ilike.%${term}%,email.ilike.%${term}%`,
    );
  }
  const { data: users, count } = await query.range(page.from, page.to);
  const ids = (users ?? []).map((u) => u.id);
  const nowIso = new Date().toISOString();

  const { data: positions } = ids.length
    ? await supabase
        .from('role_assignments')
        .select('user_id, role_key, committees(name_ar, name_en), roles(name_ar, name_en)')
        .in('user_id', ids)
        .lte('starts_at', nowIso)
        .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    : { data: [] };

  const rows = (users ?? []).map((u) => ({
    id: u.id,
    name: u.full_name_ar,
    nameEn: u.full_name_en,
    email: u.email,
    locale: u.preferred_locale,
    createdAt: u.created_at,
    positions: (positions ?? [])
      .filter((p) => p.user_id === u.id)
      .map((p) => ({
        role: p.role_key as RoleKey,
        label: {
          ar: `${p.roles?.name_ar ?? p.role_key}${p.committees ? ` · ${p.committees.name_ar}` : ''}`,
          en: `${p.roles?.name_en ?? p.role_key}${p.committees ? ` · ${p.committees.name_en ?? p.committees.name_ar}` : ''}`,
        } as Localized,
      })),
  }));
  return { rows, total: count ?? rows.length };
}
