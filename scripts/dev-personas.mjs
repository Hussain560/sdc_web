// Creates the six demo personas on the LOCAL Supabase stack (Sprint 04 · ACC-004 / TEST-002 support).
// Fictional @example.test accounts, a fixed local-only password, idempotent. Never run against a hosted project.
//   npm run db:personas
import { execSync } from 'node:child_process';
import pg from 'pg';

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

const PASSWORD = 'Dev!Passw0rd1';
const personas = [
  { email: 'dev.admin@example.test', name: 'مدير النظام التجريبي', role: 'system_admin' },
  { email: 'dev.leader@example.test', name: 'قائد المجتمع التجريبي', role: 'community_leader' },
  { email: 'dev.founder@example.test', name: 'مؤسس تجريبي', role: 'founder' },
  {
    email: 'dev.head@example.test',
    name: 'قائد لجنة تجريبي',
    role: 'committee_head',
    committee: 'ai',
  },
  {
    email: 'dev.member@example.test',
    name: 'عضو لجنة تجريبي',
    role: 'committee_member',
    committee: 'ai',
  },
  { email: 'dev.plain@example.test', name: 'مستخدم عادي تجريبي', role: null },
];

const db = new pg.Client({ connectionString: env.DB_URL });
await db.connect();

for (const p of personas) {
  let { rows } = await db.query('select id from public.profiles where lower(email) = $1', [
    p.email,
  ]);
  if (rows.length === 0) {
    const res = await fetch(`${env.API_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: env.SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: p.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: p.name, locale: 'ar' },
      }),
    });
    if (!res.ok) throw new Error(`create ${p.email}: ${res.status} ${await res.text()}`);
    ({ rows } = await db.query('select id from public.profiles where lower(email) = $1', [
      p.email,
    ]));
  }
  const id = rows[0].id;
  if (p.role) {
    await db.query(
      `insert into public.role_assignments (user_id, role_key, committee_id)
       select $1, $2, (select id from public.committees where slug = $3)
       where not exists (
         select 1 from public.role_assignments
          where user_id = $1 and role_key = $2 and (ends_at is null or ends_at > now()))`,
      [id, p.role, p.committee ?? null],
    );
  }
  if (p.role) {
    // Committee roles require an active member (is_active_member is real since Sprint 08).
    await db.query(
      `insert into public.members (user_id, joined_via, first_name_ar, is_directory_visible)
       values ($1, 'manual', $2, false) on conflict (user_id) do nothing`,
      [id, p.name],
    );
  }
  console.log(`${p.role ?? 'plain user'}`.padEnd(18), p.email);
}

await db.end();
console.log(`\nPassword for all: ${PASSWORD}   (local only)`);
