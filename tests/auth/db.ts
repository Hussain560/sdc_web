import { Client } from 'pg';

/** Privileged SQL against the LOCAL database (test setup only — never used by the app). */
export async function sql<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const client = new Client({ connectionString: process.env.SB_DB_URL });
  await client.connect();
  try {
    const res = await client.query(text, params);
    return res.rows as T[];
  } finally {
    await client.end();
  }
}

export const committeeId = async (slug: string) =>
  (await sql<{ id: string }>('select id from public.committees where slug = $1', [slug]))[0]!.id;

/** Grants a position directly (bypasses the guards on purpose: this is fixture setup). */
export async function grant(
  userId: string,
  roleKey: string,
  opts: {
    committeeSlug?: string;
    startsAt?: string;
    endsAt?: string | null;
    titleAr?: string;
    titleEn?: string;
    bioAr?: string;
    tagsAr?: string[];
  } = {},
) {
  const cid = opts.committeeSlug ? await committeeId(opts.committeeSlug) : null;
  // Singleton roles (one leader, one head per committee): free the seat so fixtures never collide with
  // data left by `npm run db:personas` or earlier runs.
  if (roleKey === 'community_leader' || roleKey === 'committee_head') {
    await sql(
      `update public.role_assignments set ends_at = starts_at, end_reason = 'test setup'
        where role_key = $1 and committee_id is not distinct from $2::uuid and (ends_at is null or ends_at > now())`,
      [roleKey, cid],
    );
  }
  const rows = await sql<{ id: string }>(
    `insert into public.role_assignments
       (user_id, role_key, committee_id, starts_at, ends_at, display_title_ar, display_title_en, public_bio_ar, public_tags_ar)
     values ($1, $2, $3, coalesce($4::timestamptz, now() - interval '1 minute'), $5::timestamptz, $6, $7, $8, $9)
     returning id`,
    [
      userId,
      roleKey,
      cid,
      opts.startsAt ?? null,
      opts.endsAt ?? null,
      opts.titleAr ?? null,
      opts.titleEn ?? null,
      opts.bioAr ?? null,
      opts.tagsAr ?? null,
    ],
  );
  return rows[0]!.id;
}

/** role_assignments are never deleted through the API; tests clean up as the table owner. */
export async function removeAssignments(userId: string) {
  await sql('delete from public.role_assignments where user_id = $1', [userId]);
}

/** Leaves exactly the given users as active system admins (so "last admin" tests are deterministic). */
export async function onlyAdmins(keep: string[]) {
  await sql(
    `update public.role_assignments set ends_at = now() - interval '1 second', end_reason = 'test setup'
      where role_key = 'system_admin' and (ends_at is null or ends_at > now()) and not (user_id = any($1::uuid[]))`,
    [keep],
  );
}
