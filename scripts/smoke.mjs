// Remote smoke test for a deployed site (Dev, Staging or Production): node scripts/smoke.mjs <baseUrl>
// Checks the health route and that the public pages answer 200 in both languages, and that the security headers are present.
// It only reads; it never signs in or writes. Use docs/07-engineering/event-lifecycle-test-guide.md for the full manual flow.
const base = (process.argv[2] ?? '').replace(/\/$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('Usage: node scripts/smoke.mjs https://your-site.example');
  process.exit(2);
}
const paths = ['/', '/events', '/articles', '/members', '/about', '/join', '/login', '/privacy'];
const failures = [];
const check = async (label, fn) => {
  try {
    const note = await fn();
    console.log(`ok    ${label}${note ? ` (${note})` : ''}`);
  } catch (e) {
    failures.push(label);
    console.log(`FAIL  ${label}: ${e.message}`);
  }
};

await check('/api/health', async () => {
  const r = await fetch(`${base}/api/health`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.status !== 'ok') throw new Error(`HTTP ${r.status} ${JSON.stringify(j)}`);
  return `database ${j.db ?? 'n/a'}`;
});
for (const lang of ['', '/en']) {
  for (const p of paths) {
    const path = `${lang}${p === '/' && lang ? '' : p}` || '/';
    await check(path, async () => {
      const r = await fetch(`${base}${path}`, { redirect: 'follow' });
      if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
    });
  }
}
await check('security headers', async () => {
  const r = await fetch(base);
  for (const h of ['content-security-policy', 'x-content-type-options', 'x-frame-options']) {
    if (!r.headers.get(h)) throw new Error(`missing ${h}`);
  }
});
console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nSmoke test passed');
process.exit(failures.length ? 1 : 0);
