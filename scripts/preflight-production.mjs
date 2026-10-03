// Pre-flight for a production (or staging) deployment: node scripts/preflight-production.mjs [--env <file>] [--online]
// Reads variables from the file (KEY=VALUE lines) or the current environment, prints a readable list of problems and
// exits 1 if any are blocking. --online also asks the hosted Auth server whether sign-ups are disabled.
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const at = (flag) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined);
const file = at('--env');
const env = { ...process.env };
if (file) {
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const problems = [];
const warnings = [];
const need = (k) => {
  if (!env[k]) problems.push(`${k} is missing`);
  return env[k];
};
const isLocal = (u) => /(^|\/\/)(localhost|127\.0\.0\.1|\[::1\])/.test(u ?? '');

const site = need('SITE_URL');
if (site && (!site.startsWith('https://') || isLocal(site)))
  problems.push('SITE_URL must be the public https origin (not localhost)');
const sbUrl = need('NEXT_PUBLIC_SUPABASE_URL');
if (sbUrl && (!sbUrl.startsWith('https://') || isLocal(sbUrl)))
  problems.push('NEXT_PUBLIC_SUPABASE_URL must be the hosted project URL (https)');
const anon = need('NEXT_PUBLIC_SUPABASE_ANON_KEY');
const service = need('SUPABASE_SERVICE_ROLE_KEY');
if (anon && service && anon === service)
  problems.push(
    'SUPABASE_SERVICE_ROLE_KEY equals the anon key: the service key must be the secret one',
  );
const cron = need('CRON_SECRET');
if (cron && cron.length < 16) problems.push('CRON_SECRET must be at least 16 characters');
if (env.EMAIL_TRANSPORT !== 'smtp') problems.push('EMAIL_TRANSPORT must be "smtp" in production');
else need('SMTP_URL');
const from = need('EMAIL_FROM');
if (from && /example\.|localhost/.test(from))
  problems.push('EMAIL_FROM still uses a placeholder domain');
if (env.MAILPIT_URL) warnings.push('MAILPIT_URL is set; it is ignored with the smtp transport');
for (const k of Object.keys(env))
  if (k.startsWith('NEXT_PUBLIC_') && /SERVICE|SECRET|PASSWORD/.test(k))
    problems.push(`${k} would expose a secret to the browser`);

if (args.includes('--online') && sbUrl && anon) {
  try {
    const res = await fetch(`${sbUrl}/auth/v1/settings`, { headers: { apikey: anon } });
    const s = await res.json();
    if (!s.disable_signup)
      problems.push(
        'Auth: sign-ups are enabled; disable them (accounts are created by the platform)',
      );
    if (!s.external?.email) problems.push('Auth: the e-mail provider is disabled');
  } catch (e) {
    warnings.push(`could not read the Auth settings online: ${e.message}`);
  }
}
warnings.push(
  'Check by hand in the Auth dashboard: Site URL, redirect URLs, OTP/link expiry (>= 86400 s), custom SMTP, e-mail templates',
);

for (const w of warnings) console.log(`note   ${w}`);
for (const p of problems) console.log(`BLOCK  ${p}`);
console.log(problems.length ? `\n${problems.length} blocking problem(s)` : '\nPre-flight passed');
process.exit(problems.length ? 1 : 0);
