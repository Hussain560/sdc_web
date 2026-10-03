// Restore drill (SEC-005, operations §1): dump the database, restore it into a scratch database, compare the data
// and the security setup, and report how long each step took. Runs against the LOCAL Supabase container only.
//   node scripts/restore-drill.mjs            (npx supabase start first)
// For a hosted project the same steps apply with `supabase db dump` and a scratch project (see operations.md).
import { execSync } from 'node:child_process';

const container = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' })
  .split(/\r?\n/)
  .find((n) => n.startsWith('supabase_db_'));
if (!container) {
  console.error('No local Supabase database container is running (npx supabase start).');
  process.exit(1);
}

const sh = (cmd) =>
  execSync(`docker exec ${container} sh -c ${JSON.stringify(cmd)}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const psql = (db, sql) =>
  sh(`psql -U postgres -d ${db} -At -c "${sql.replace(/"/g, '\\"')}"`).trim();
const scratch = `drill_${Date.now()}`;
const timings = {};
const time = (label, fn) => {
  const t = Date.now();
  const out = fn();
  timings[label] = Date.now() - t;
  return out;
};

const tables = [
  'events',
  'event_registrations',
  'members',
  'membership_applications',
  'articles',
  'certificates',
  'audit_logs',
  'site_settings',
];
const counts = (db) => ({
  ...Object.fromEntries(
    tables.map((t) => [t, Number(psql(db, `select count(*) from public.${t}`))]),
  ),
  'auth.users': Number(psql(db, 'select count(*) from auth.users')),
});
const policies = (db) =>
  Number(psql(db, "select count(*) from pg_policies where schemaname = 'public'"));
const rls = (db) =>
  Number(
    psql(
      db,
      "select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity",
    ),
  );

let ok = false;
try {
  const before = counts('postgres');
  time('dump', () =>
    sh(
      'pg_dump -U postgres -Fc --no-owner --no-privileges -n public -n private -n auth -d postgres -f /tmp/drill.dump',
    ),
  );
  const size = sh('ls -l /tmp/drill.dump').split(/\s+/)[4];
  time('create scratch database', () => sh(`createdb -U postgres ${scratch}`));
  // A real Supabase project already has these extensions in the `extensions` schema; a scratch database needs them first.
  time('prepare scratch (extensions)', () => {
    psql(
      scratch,
      'create schema if not exists extensions; create extension if not exists pgcrypto with schema extensions; create extension if not exists btree_gist with schema extensions',
    );
  });
  time('restore', () => {
    try {
      sh(
        `pg_restore -U postgres -d ${scratch} --no-owner --no-privileges /tmp/drill.dump 2>/tmp/drill.err || true`,
      );
    } catch {
      /* non-fatal errors are inspected below */
    }
  });
  const errors = Number(sh('grep -c "error" /tmp/drill.err || true').trim() || 0);
  const after = time('verify', () => counts(scratch));
  const same = Object.keys(before).every((t) => before[t] === after[t]);
  const pol = [policies('postgres'), policies(scratch)];
  const rl = [rls('postgres'), rls(scratch)];
  console.log(
    JSON.stringify(
      {
        container,
        dumpBytes: Number(size),
        restoreWarnings: errors,
        timingsMs: timings,
        rowCounts: { before, after },
        policies: pol,
        rlsTables: rl,
      },
      null,
      2,
    ),
  );
  ok = same && pol[0] === pol[1] && rl[0] === rl[1];
  console.log(
    ok
      ? '\nRESTORE DRILL PASSED: row counts, policies and RLS flags match the source.'
      : '\nRESTORE DRILL FAILED: the restored database differs from the source.',
  );
} finally {
  try {
    sh(`dropdb -U postgres --if-exists ${scratch}; rm -f /tmp/drill.dump /tmp/drill.err`);
  } catch {
    /* best effort cleanup */
  }
}
process.exit(ok ? 0 : 1);
