import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './src/i18n/routing';
import { refreshSession } from './src/lib/supabase/proxy';

const handleLocale = createMiddleware(routing);

// Next.js 16 `proxy` (formerly middleware): locale negotiation, then Supabase session refresh.
export default async function proxy(request: NextRequest) {
  const response = handleLocale(request);
  await refreshSession(request, response);
  return response;
}

export const config = {
  // Skip API routes, auth link handlers, Next internals and anything with a file extension.
  matcher: ['/((?!api|auth|_next|_vercel|.*[.].*).*)'],
};
