import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';
import { retryDueEmails } from '@/modules/notifications/retry';

export const dynamic = 'force-dynamic';

/**
 * Scheduled retry of failed e-mails: backoff 5 min · 30 min · 2 h, at most 4 attempts, non-retryable codes skipped
 * (the rules live in due_email_retries()). Protected by a shared secret (Authorization: Bearer) — Vercel Cron sends
 * it automatically when CRON_SECRET is set.
 */
export async function GET(request: Request) {
  const secret = serverEnv().CRON_SECRET;
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || token !== secret) return new NextResponse('Unauthorized', { status: 401 });
  return NextResponse.json(await retryDueEmails());
}
