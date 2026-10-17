// Gives every member without a photo one of the sample portraits (round-robin) on the LOCAL Supabase stack, so the
// directory, cards and marquee can be seen with pictures. Local only. Also ends the demo founder and advisor positions.
//   node scripts/dev-seed-member-photos.mjs [folder-with-photos]
import { execSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import sharp from 'sharp';

const status = execSync('npx supabase status -o env', {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'ignore'],
});
const env = Object.fromEntries(
  status
    .split(/\r?\n/)
    .map((l) => /^([A-Z_]+)="?(.*?)"?$/.exec(l.trim()))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
if (!/127\.0\.0\.1|localhost/.test(env.API_URL ?? '')) {
  console.error('Refusing to run: the Supabase API is not local.');
  process.exit(1);
}
const dir = process.argv[2] ?? join(homedir(), 'Downloads');
const files = [
  'مريم.jpg',
  'مهند.jpg',
  'إلين.jpg',
  'فداء.jpg',
  'رنا.jpg',
  'ريم.jpg',
  'العنود.jpg',
  'لينا.jpg',
  'جود.png',
];
const headers = { apikey: env.SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SERVICE_ROLE_KEY}` };

const db = new pg.Client({ connectionString: env.DB_URL });
await db.connect();

await db.query(
  `update public.role_assignments set ends_at = now(), end_reason = 'seed'
    where ends_at is null and role_key in ('founder','advisor')
      and user_id in (select id from public.profiles where email in ('dev.founder@example.test','dev.advisor@example.test'))`,
);

const { rows } = await db.query(
  `select id, coalesce(user_id, id) as folder from public.members where photo_path is null order by created_at, id`,
);
let i = 0;
for (const m of rows) {
  const source = readFileSync(join(dir, files[i++ % files.length]));
  const token = randomUUID();
  for (const [size, name] of [
    [512, `${token}.webp`],
    [128, `${token}-128.webp`],
  ]) {
    const body = await sharp(source)
      .rotate()
      .resize(size, size, { fit: 'cover' })
      .webp({ quality: 85 })
      .toBuffer();
    const res = await fetch(`${env.API_URL}/storage/v1/object/member-photos/${m.folder}/${name}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'image/webp', 'x-upsert': 'true' },
      body,
    });
    if (!res.ok) throw new Error(`upload: ${res.status} ${await res.text()}`);
  }
  await db.query('update public.members set photo_path = $2, show_photo = true where id = $1', [
    m.id,
    `${m.folder}/${token}.webp`,
  ]);
}
console.log(`photos added to ${rows.length} members`);
await db.end();
