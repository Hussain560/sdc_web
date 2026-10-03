/**
 * Security headers (SEC-002, security model §10). One place builds them so `next.config.ts` and the tests agree.
 *
 * The policy is ENFORCED (not report-only). Known concessions, recorded in the sprint plan:
 *  - `script-src` keeps `'unsafe-inline'` because Next.js and the theme-init script emit inline scripts; a
 *    nonce-based policy needs per-request rendering and is the planned follow-up.
 *  - `img-src` allows any https host because administrators can set partner logos by link.
 */
export function buildSecurityHeaders(opts: {
  supabaseUrl?: string;
  production: boolean;
  upgradeInsecure?: boolean;
}) {
  const supabase = opts.supabaseUrl ? new URL(opts.supabaseUrl) : null;
  const supabaseOrigin = supabase?.origin ?? '';
  const supabaseWs = supabase
    ? `${supabase.protocol === 'https:' ? 'wss' : 'ws'}://${supabase.host}`
    : '';

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${opts.production ? '' : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com ${supabaseOrigin} ${supabaseWs}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(opts.upgradeInsecure ? ['upgrade-insecure-requests'] : []),
    'report-uri /api/csp-report',
  ].join('; ');

  const headers: Array<{ key: string; value: string }> = [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ];
  if (opts.production)
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  return headers;
}
