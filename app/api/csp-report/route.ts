import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const keep = [
  'violated-directive',
  'effective-directive',
  'blocked-uri',
  'disposition',
  'source-file',
] as const;
const origin = (v: unknown) => {
  try {
    const u = new URL(String(v));
    return `${u.origin}${u.pathname}`;
  } catch {
    return String(v ?? '').slice(0, 60);
  }
};

/**
 * CSP violation reports (SEC-002). The browser posts them without credentials; we log a trimmed line (no query
 * strings, no personal data) and answer 204. The body is capped so the endpoint cannot be used to fill the logs.
 */
export async function POST(request: Request) {
  const text = (await request.text()).slice(0, 4000);
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    const report = (parsed['csp-report'] ?? parsed) as Record<string, unknown>;
    const line: Record<string, string> = {
      page: origin(report['document-uri'] ?? report['documentURL']),
    };
    for (const k of keep) if (report[k] !== undefined) line[k] = origin(report[k]);
    console.warn('[csp] violation', JSON.stringify(line));
  } catch {
    /* not JSON: ignore */
  }
  return new NextResponse(null, { status: 204 });
}
