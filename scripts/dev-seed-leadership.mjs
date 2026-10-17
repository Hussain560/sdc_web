// Seeds the community leadership (founders, leader, advisor, committee heads) with their profile photos on the LOCAL
// Supabase stack, to see how the public pages render real people. Fictional @example.test accounts, local only.
//   node scripts/dev-seed-leadership.mjs [folder-with-photos]
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
const PASSWORD = 'Dev!Passw0rd1';

// handle, first, last, university, role, committee, title, photo file
const people = [
  ['lina', 'لينا', 'الإسماعيل', 'جامعة الملك فيصل', 'founder', null, 'مؤسسة المجتمع', 'لينا.jpg'],
  ['maryam', 'مريم', 'الفضلي', 'جامعة الملك فيصل', 'founder', null, 'مؤسسة المجتمع', 'مريم.jpg'],
  [
    'muhannad',
    'مهند',
    'الحربي',
    'الجامعة السعودية الإلكترونية',
    'community_leader',
    null,
    null,
    'مهند.jpg',
  ],
  [
    'alyn',
    'ألين',
    'الزهراني',
    'جامعة الإمام عبدالرحمن بن فيصل',
    'advisor',
    null,
    'مستشارة المجتمع',
    'إلين.jpg',
  ],
  [
    'fidaa',
    'فداء',
    'المفقود',
    'جامعة الإمام عبدالرحمن بن فيصل',
    'committee_head',
    'design-identity',
    null,
    'فداء.jpg',
  ],
  ['rana', 'رنا', 'الحربي', 'جامعة حفر الباطن', 'committee_head', 'projects', null, 'رنا.jpg'],
  [
    'reem',
    'ريم',
    'الشمري',
    'جامعة حفر الباطن',
    'committee_head',
    'tech-development',
    null,
    'ريم.jpg',
  ],
  [
    'alanoud',
    'العنود',
    'المحلبدي',
    'جامعة جدة',
    'committee_head',
    'cybersecurity',
    null,
    'العنود.jpg',
  ],
  [
    'joud',
    'جود',
    'الشهري',
    'جامعة الإمام عبدالرحمن بن فيصل',
    'committee_head',
    'ai',
    null,
    'جود.png',
  ],
];

const db = new pg.Client({ connectionString: env.DB_URL });
await db.connect();
const headers = { apikey: env.SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SERVICE_ROLE_KEY}` };
const q = (text, params) => db.query(text, params).then((r) => r.rows);

// Founders, leader and advisor named here replace the earlier demo holders (the dev.* accounts are left alone).
const mine = people.map((p) => `lead.${p[0]}@example.test`);
await q(
  `update public.role_assignments ra set ends_at = now(), end_reason = 'seed'
    where ends_at is null and role_key in ('founder','community_leader','advisor','committee_head')
      and user_id not in (select id from public.profiles where email like 'dev.%' or email = any($1))`,
  [mine],
);

for (const [handle, first, last, uni, role, committee, title, file] of people) {
  const email = `lead.${handle}@example.test`;
  let [row] = await q('select id from public.profiles where lower(email) = $1', [email]);
  if (!row) {
    const res = await fetch(`${env.API_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: `${first} ${last}`, locale: 'ar' },
      }),
    });
    if (!res.ok) throw new Error(`create ${email}: ${res.status} ${await res.text()}`);
    [row] = await q('select id from public.profiles where lower(email) = $1', [email]);
  }
  const id = row.id;
  let [u] = await q('select id from public.universities where name_ar = $1', [uni]);
  if (!u)
    [u] = await q(
      'insert into public.universities (name_ar, name_en) values ($1, $1) returning id',
      [uni],
    );

  await q(
    `insert into public.members (user_id, joined_via, first_name_ar, last_name_ar, university_id, is_directory_visible, show_university, show_photo)
     values ($1, 'manual', $2, $3, $4, true, true, true)
     on conflict (user_id) do update set first_name_ar = $2, last_name_ar = $3, university_id = $4,
       is_directory_visible = true, show_university = true, show_photo = true, status = 'active'`,
    [id, first, last, u.id],
  );
  await q(
    `insert into public.role_assignments (user_id, role_key, committee_id, display_title_ar)
     select $1, $2, (select id from public.committees where slug = $3), $4
     where not exists (select 1 from public.role_assignments where user_id = $1 and role_key = $2 and ends_at is null)`,
    [id, role, committee, title],
  );

  // Photo: a 512 px square and a 128 px thumbnail, WebP, in the member's own folder (the same shape the app writes).
  const source = readFileSync(join(dir, file));
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
    const res = await fetch(`${env.API_URL}/storage/v1/object/member-photos/${id}/${name}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'image/webp', 'x-upsert': 'true' },
      body,
    });
    if (!res.ok) throw new Error(`upload ${file}: ${res.status} ${await res.text()}`);
  }
  await q('update public.members set photo_path = $2 where user_id = $1', [
    id,
    `${id}/${token}.webp`,
  ]);
  console.log('seeded', first, last, role, committee ?? '');
}
await db.end();
