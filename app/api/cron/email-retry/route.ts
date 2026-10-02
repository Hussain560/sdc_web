import { NextResponse } from 'next/server';
import { serverEnv } from '@/lib/env';
import { retryPendingRegistrationMail } from '@/modules/notifications/registrations';

export const dynamic = 'force-dynamic';

/** Scheduled retry of undelivered registration e-mails. Protected by a shared secret (Authorization: Bearer). */
export async function GET(request: Request) {
  const secret = serverEnv().CRON_SECRET;
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!secret || token !== secret) return new NextResponse('Unauthorized', { status: 401 });
  return NextResponse.json(await retryPendingRegistrationMail());
}
