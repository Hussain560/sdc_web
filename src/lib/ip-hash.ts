import 'server-only';
import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';

/** A keyed hash of the caller's address: enough to throttle abuse, never the address itself. */
export async function ipHash(): Promise<string | null> {
  const h = await headers();
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? '').trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'dev-only-key';
  return ip ? createHmac('sha256', key).update(ip).digest('hex') : null;
}
