import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeRedirect } from '@/modules/auth/redirect';

// Token-hash flow for e-mailed links (sign-up confirmation, password recovery, e-mail change).
// Works even when the link is opened in another browser than the one that requested it.
const TYPES: readonly EmailOtpType[] = ['signup', 'email', 'recovery', 'email_change', 'invite'];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const prefix = searchParams.get('locale') === 'en' ? '/en' : '';
  const next = sanitizeRedirect(searchParams.get('next'));

  // Redirect on the host the visitor actually used (cookies are host-bound); never trust a URL from the query.
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? request.nextUrl.host;
  const proto =
    request.headers.get('x-forwarded-proto') ?? request.nextUrl.protocol.replace(':', '');
  const origin = `${proto}://${host}`;

  const go = (path: string, query?: Record<string, string>) => {
    const url = new URL(`${prefix}${path === '/' && prefix ? '' : path}` || '/', origin);
    for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
    return NextResponse.redirect(url);
  };

  if (!tokenHash || !type || !TYPES.includes(type)) {
    return go('/login', { error: 'LINK_EXPIRED' });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error) {
    return go(type === 'recovery' ? '/forgot-password' : '/login', { error: 'LINK_EXPIRED' });
  }

  return go(next);
}
