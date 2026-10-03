import { expect, test } from '@playwright/test';

// SEC-002: the headers are present on every class of route, and a policy violation is reported, not silent.
const paths = ['/', '/en/events', '/login', '/privacy', '/this-page-does-not-exist', '/api/health'];

for (const path of paths) {
  test(`security headers on ${path}`, async ({ request }) => {
    const res = await request.get(path);
    const h = res.headers();
    const csp = h['content-security-policy'] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain('report-uri /api/csp-report');
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['x-frame-options']).toBe('DENY');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['permissions-policy']).toContain('camera=()');
    expect(h['strict-transport-security']).toContain('max-age=');
  });
}

test('the page runs under the policy without violations', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy|violates the following/i.test(m.text())) violations.push(m.text());
  });
  for (const path of ['/', '/en', '/events', '/join', '/privacy']) await page.goto(path);
  expect(violations).toEqual([]);
});

test('the report endpoint accepts a report and answers 204', async ({ request }) => {
  const res = await request.post('/api/csp-report', {
    headers: { 'content-type': 'application/csp-report' },
    data: JSON.stringify({
      'csp-report': {
        'violated-directive': 'script-src',
        'blocked-uri': 'https://evil.example/x.js',
        'document-uri': 'http://127.0.0.1/?token=secret',
      },
    }),
  });
  expect(res.status()).toBe(204);
});
