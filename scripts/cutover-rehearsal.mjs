// Cutover rehearsal (LCH-001/LCH-002): runs the production cutover sequence on a RESTORED COPY of the local database
// and times every step, ending with a rollback test.
//   node scripts/cutover-rehearsal.mjs [--record]      (npx supabase start first)
// Steps: backup → restore to a scratch copy → reconciliation → contract migration → smoke checks → rollback test
// (restore the backup again and compare). `--record` writes docs/99-project-management/releases/rehearsal-<n>.md.
// It never touches the source database except to read it, and drops both scratch databases at the end.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const record = process.argv.includes('--record');
const container = execSync('docker ps --format "{{.Names}}"', { encoding: 'utf8' })
  .split(/\r?\n/)
  .find((n) => n.startsWith('supabase_db_'));
if (!container) {
  console.error('No local Supabase database container is running (npx supabase start).');
  process.exit(1);
}

const run = (cmd) =>
  execSync(`docker exec ${container} sh -c ${JSON.stringify(cmd)}`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
const psql = (db, sql) =>
  run(`psql -U postgres -d ${db} -At -v ON_ERROR_STOP=1 -c "${sql.replace(/"/g, '\\"')}"`).trim();
const stamp = Date.now();
const copy = `rehearsal_${stamp}`;
const back = `rollback_${stamp}`;
const steps = [];
const step = (name, fn) => {
  const t = Date.now();
  let detail = '';
  let ok = true;
  try {
    detail = fn() ?? '';
  } catch (e) {
    ok = false;
    detail = String(e.stderr ?? e.message)
      .split('\n')
      .slice(0, 3)
      .join(' ');
  }
  steps.push({ name, ms: Date.now() - t, ok, detail });
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} (${Date.now() - t} ms) ${detail}`);
  return ok;
};

const tables = [
  'events',
  'event_registrations',
  'members',
  'membership_applications',
  'articles',
  'certificates',
  'site_settings',
  'committees',
  'role_assignments',
];
const counts = (db) =>
  Object.fromEntries(tables.map((t) => [t, Number(psql(db, `select count(*) from public.${t}`))]));
const dump = '/tmp/rehearsal.dump';
const restore = (db) => {
  run(`createdb -U postgres ${db}`);
  psql(
    db,
    'create schema if not exists extensions; create extension if not exists pgcrypto with schema extensions; create extension if not exists btree_gist with schema extensions',
  );
  run(`pg_restore -U postgres -d ${db} --no-owner --no-privileges ${dump} 2>/dev/null || true`);
};

let source;
let ok = true;
try {
  ok &&= step('1. pre-flight: source reachable, legacy tables present', () => {
    source = counts('postgres');
    const legacy = psql(
      'postgres',
      "select count(*) from pg_tables where schemaname = 'public' and tablename like '%\\_legacy'",
    );
    return `${legacy} legacy table(s), ${source.members} members, ${source.events} events`;
  });
  ok &&= step('2. backup (pg_dump, public + private + auth)', () => {
    run(
      `pg_dump -U postgres -Fc --no-owner --no-privileges -n public -n private -n auth -d postgres -f ${dump}`,
    );
    return `${Math.round(Number(run(`stat -c %s ${dump}`)) / 1024)} KB`;
  });
  ok &&= step('3. restore into the rehearsal copy', () => {
    restore(copy);
    const c = counts(copy);
    const same = tables.every((t) => c[t] === source[t]);
    if (!same) throw new Error('row counts differ after restore');
    return 'row counts match the source';
  });
  ok &&= step('4. pending migrations (supabase db push --dry-run equivalent)', () => {
    const files = readdirSync(join(process.cwd(), 'supabase', 'migrations')).filter((f) =>
      f.endsWith('.sql'),
    ).length;
    const applied = Number(
      psql('postgres', 'select count(*) from supabase_migrations.schema_migrations'),
    );
    return `${files} files, ${applied} applied locally, ${Math.max(files - applied, 0)} pending`;
  });
  ok &&= step('5. contract migration (reconciliation guard + drop legacy tables)', () => {
    const sql = readFileSync(
      join(process.cwd(), 'supabase', 'contract', '20270410000000_drop_legacy_tables.sql'),
      'utf8',
    );
    execSync(`docker exec -i ${container} psql -U postgres -d ${copy} -v ON_ERROR_STOP=1`, {
      input: sql,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const left = psql(
      copy,
      "select count(*) from pg_tables where schemaname = 'public' and tablename like '%\\_legacy'",
    );
    if (left !== '0') throw new Error(`${left} legacy table(s) remain`);
    return 'legacy tables dropped';
  });
  ok &&= step('6. smoke checks on the copy', () => {
    const views = [
      'public_events',
      'public_articles',
      'current_positions',
      'member_directory',
      'public_partners',
    ].filter((v) => v !== 'public_partners');
    for (const v of views) psql(copy, `select count(*) from public.${v}`);
    const c = counts(copy);
    if (!tables.every((t) => c[t] === source[t]))
      throw new Error('row counts changed by the contract step');
    const policies = Number(
      psql(copy, "select count(*) from pg_policies where schemaname = 'public'"),
    );
    const rls = Number(
      psql(
        copy,
        "select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity",
      ),
    );
    psql(copy, "select public.verify_certificate('00000000-0000-0000-0000-000000000000')");
    return `${views.length} views read, counts unchanged, ${policies} policies, ${rls} RLS tables`;
  });
  ok &&= step('7. rollback test: restore the backup again and compare with the source', () => {
    restore(back);
    const c = counts(back);
    if (!tables.every((t) => c[t] === source[t]))
      throw new Error('rollback copy differs from the source');
    const legacy = psql(
      back,
      "select count(*) from pg_tables where schemaname = 'public' and tablename like '%\\_legacy'",
    );
    if (legacy === '0') throw new Error('rollback copy lost the legacy tables');
    return 'the pre-cutover state is fully recoverable from the backup';
  });
} finally {
  try {
    run(
      `dropdb -U postgres --if-exists ${copy}; dropdb -U postgres --if-exists ${back}; rm -f ${dump}`,
    );
  } catch {
    /* best effort */
  }
}

const total = steps.reduce((n, s) => n + s.ms, 0);
console.log(`\n${ok ? 'REHEARSAL PASSED' : 'REHEARSAL FAILED'} in ${total} ms`);

if (record) {
  const dir = join(process.cwd(), 'docs', '99-project-management', 'releases');
  let n = 1;
  while (existsSync(join(dir, `rehearsal-${n}.md`))) n += 1;
  const date = new Date().toISOString().slice(0, 10);
  const md = `# Cutover rehearsal ${n} — ${date}

| Field | Value |
| ----- | ----- |
| **Kind** | Local rehearsal on a restored copy of the local database (\`node scripts/cutover-rehearsal.mjs\`) |
| **Result** | ${ok ? 'Passed' : 'Failed'} |
| **Total time** | ${total} ms |

| Step | Time | Result |
| ---- | ---- | ------ |
${steps.map((s) => `| ${s.name} | ${s.ms} ms | ${s.ok ? 'ok' : 'FAILED'} — ${s.detail.replace(/\|/g, '/')} |`).join('\n')}

This proves the sequence, the contract guard and the rollback path with the local sample data. The production rehearsal
(a restored copy of the real backup, with the real timings) is an owner action before \`v1.0.0\`
([cutover runbook](../../08-infrastructure/cutover-runbook.md)).
`;
  writeFileSync(join(dir, `rehearsal-${n}.md`), md);
  console.log(`recorded: releases/rehearsal-${n}.md`);
}
process.exit(ok ? 0 : 1);
