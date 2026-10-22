// Loads ALL the Sprint 18 demo data on the LOCAL Supabase stack: personas, demo content, cycles, applications, waiting
// list, members in every state, leave request, blocked account. Idempotent. Never run against a hosted project.
//   npm run db:lifecycle
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const psql = (file) =>
  execSync('docker exec -i supabase_db_sdc_web psql -U postgres -v ON_ERROR_STOP=1', {
    input: readFileSync(file),
    stdio: ['pipe', 'ignore', 'inherit'],
  });

execSync('node scripts/dev-personas.mjs', { stdio: 'inherit' });
for (const f of [
  'supabase/demo-seed.sql',
  'supabase/dev-fill-fake-members.sql',
  'supabase/dev-lifecycle-seed.sql',
  'supabase/dev-lifecycle-more.sql',
  'supabase/dev-lifecycle-people.sql',
]) {
  console.log('loading', f);
  psql(f);
}
console.log(
  '\nDone. See docs/99-project-management/sprints/sprint-18-membership-lifecycle/TESTING-GUIDE.md',
);
