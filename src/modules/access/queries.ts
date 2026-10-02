import { cache } from 'react';
import { getUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import type { AccessContext, PermissionKey, Position, RoleKey } from './types';

/**
 * The signed-in user's active positions and the permissions they grant, resolved once per request.
 * RLS lets a user read their own assignments, so this runs as the user — no service role.
 */
export const getAccess = cache(async (): Promise<AccessContext | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: rows }, { data: profile }] = await Promise.all([
    supabase
      .from('role_assignments')
      .select(
        'id, role_key, committee_id, display_title_ar, display_title_en, starts_at, ends_at, roles(name_ar, name_en, scope, display_order), committees(name_ar, name_en)',
      )
      .eq('user_id', user.id)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gt.${now}`),
    supabase.from('profiles').select('full_name_ar, full_name_en').eq('id', user.id).maybeSingle(),
  ]);

  const sorted = [...(rows ?? [])].sort(
    (a, b) => (a.roles?.display_order ?? 99) - (b.roles?.display_order ?? 99),
  );
  const positions: Position[] = sorted.map((r) => ({
    assignmentId: r.id,
    role: r.role_key as RoleKey,
    roleName: { ar: r.roles?.name_ar ?? r.role_key, en: r.roles?.name_en ?? r.role_key },
    scope: r.roles?.scope === 'committee' ? 'committee' : 'global',
    committeeId: r.committee_id,
    committeeName: r.committees
      ? { ar: r.committees.name_ar, en: r.committees.name_en ?? r.committees.name_ar }
      : null,
    title:
      r.display_title_ar || r.display_title_en
        ? {
            ar: r.display_title_ar ?? r.display_title_en ?? '',
            en: r.display_title_en ?? r.display_title_ar ?? '',
          }
        : null,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
  }));

  const grants: AccessContext['grants'] = {};
  const roleKeys = [...new Set(positions.map((p) => p.role))];
  if (roleKeys.length > 0) {
    const { data: perms } = await supabase
      .from('role_permissions')
      .select('role_key, permission_key')
      .in('role_key', roleKeys);

    for (const { role_key, permission_key } of perms ?? []) {
      const key = permission_key as PermissionKey;
      for (const position of positions.filter((p) => p.role === role_key)) {
        if (position.scope === 'global') {
          grants[key] = 'global';
        } else if (position.committeeId && grants[key] !== 'global') {
          const list = (grants[key] as string[] | undefined) ?? [];
          if (!list.includes(position.committeeId)) list.push(position.committeeId);
          grants[key] = list;
        }
      }
    }
  }

  return {
    userId: user.id,
    email: user.email ?? '',
    displayName: profile?.full_name_ar ?? user.email ?? '',
    positions,
    grants,
  };
});
