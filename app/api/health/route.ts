import { NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

/**
 * Health check (SEC-005 / NFR-OPS-004): 200 only when the database answers. The keep-alive workflow calls it daily,
 * which also stops a free-tier project from pausing. No secrets, no personal data in the body.
 */
export async function GET() {
  const started = Date.now();
  try {
    const { error } = await createPublicClient().from('site_settings').select('key').limit(1);
    if (error) throw new Error(error.code ?? 'db');
    return NextResponse.json(
      { status: 'ok', db: 'up', ms: Date.now() - started },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { status: 'degraded', db: 'down' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
