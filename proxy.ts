import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

// Next.js 16 `proxy` (formerly middleware). Auth/session refresh joins this file in Sprint 03.
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals and anything with a file extension.
  matcher: ['/((?!api|_next|_vercel|.*[.].*).*)'],
};
