import { grant, removeAssignments, sql } from './db';
import { createConfirmedUser, deleteUser, uniqueEmail } from './helpers';

export type Persona = { id: string; email: string };

/** A confirmed account, optionally holding one position (fixture setup bypasses the guards on purpose). */
export async function persona(
  role: string | null,
  opts: { committeeSlug?: string; fullName?: string; member?: boolean } = {},
): Promise<Persona> {
  const email = uniqueEmail(role ?? 'plain');
  const id = await createConfirmedUser(email, {
    fullName: opts.fullName ?? `Persona ${role ?? 'plain'} Example`,
    locale: 'en',
  });
  if (role) await grant(id, role, { committeeSlug: opts.committeeSlug });
  // Committee roles need an active member (is_active_member is real since Sprint 08).
  if (opts.member) {
    await sql(
      `insert into public.members (user_id, joined_via, first_name_ar) values ($1, 'manual', $2) on conflict (user_id) do nothing`,
      [id, opts.fullName ?? 'عضو'],
    );
  }
  return { id, email };
}

export async function remove(...people: Persona[]) {
  for (const p of people) {
    await removeAssignments(p.id);
    await sql(`delete from public.members where user_id = $1`, [p.id]);
    await deleteUser(p.id);
  }
}
