// LOCAL ONLY: sets a member's profile photo on the local Supabase stack (512 px and 128 px WebP, square crop) and
// marks it visible. Never run against a hosted project.
//   node scripts/dev-member-photo.mjs <email> <path-to-image>
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

const [email, file] = process.argv.slice(2);
if (!email || !file) {
  console.error('usage: node scripts/dev-member-photo.mjs <email> <image>');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .map((l) => /^([A-Z_]+)=(.*)$/.exec(l.trim()))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
);
const api = env.NEXT_PUBLIC_SUPABASE_URL;
if (!/127\.0\.0\.1|localhost/.test(api)) {
  console.error('Refusing to run: the Supabase API is not local.');
  process.exit(1);
}
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const psql = (sql) =>
  execSync('docker exec -i supabase_db_sdc_web psql -U postgres -d postgres -At', {
    input: sql,
    encoding: 'utf8',
  }).trim();

const userId = psql(`select id from auth.users where email = '${email.replace(/'/g, "''")}'`);
const memberId = psql(`select m.id from public.members m where m.user_id = '${userId}'`);
if (!userId || !memberId) {
  console.error('No member with that e-mail.');
  process.exit(1);
}

const src = sharp(readFileSync(file)).rotate();
const token = `dev-${Date.now().toString(36)}`;
const full = await src.clone().resize(512, 512, { fit: 'cover' }).webp({ quality: 86 }).toBuffer();
const thumb = await src.clone().resize(128, 128, { fit: 'cover' }).webp({ quality: 84 }).toBuffer();
const paths = { full: `${userId}/${token}.webp`, thumb: `${userId}/${token}-128.webp` };

for (const [k, buf] of [
  ['full', full],
  ['thumb', thumb],
]) {
  const res = await fetch(`${api}/storage/v1/object/member-photos/${paths[k]}`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'image/webp',
      'x-upsert': 'true',
    },
    body: buf,
  });
  if (!res.ok) throw new Error(`upload ${k}: ${res.status} ${await res.text()}`);
}

psql(
  `update public.members set photo_path = '${paths.full}', show_photo = true where id = '${memberId}';`,
);
console.log('photo set for', email, '->', paths.full);
