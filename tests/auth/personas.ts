import { grant, removeAssignments } from './db';
import { createConfirmedUser, deleteUser, uniqueEmail } from './helpers';

export type Persona = { id: string; email: string };

/** A confirmed account, optionally holding one position (fixture setup bypasses the guards on purpose). */
export async function persona(
  role: string | null,
  opts: { committeeSlug?: string; fullName?: string } = {},
): Promise<Persona> {
  const email = uniqueEmail(role ?? 'plain');
  const id = await createConfirmedUser(email, {
    fullName: opts.fullName ?? `Persona ${role ?? 'plain'} Example`,
    locale: 'en',
  });
  if (role) await grant(id, role, { committeeSlug: opts.committeeSlug });
  return { id, email };
}

export async function remove(...people: Persona[]) {
  for (const p of people) {
    await removeAssignments(p.id);
    await deleteUser(p.id);
  }
}
