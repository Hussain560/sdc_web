import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * Retention job (SEC-003): anonymizes rejected/withdrawn applications after 2 years and registrations 3 years after
 * the event, and deletes e-mail log rows after 1 year (the periods live in run_retention()). `?dry=1` only counts.
 * Protected by the same shared secret as the other cron routes (Authorization: Bearer).
 */
export async function GET(request: Request) {
  const secret = serverEnv().CRON_SECRET;
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || token !== secret) return new NextResponse('Unauthorized', { status: 401 });
  const dry = new URL(request.url).searchParams.get('dry') === '1';
  const { data, error } = await createAdminClient().rpc('run_retention', { p_dry: dry });
  if (error) {
    console.error('[retention] failed', error.code);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...(data as object) });
}
