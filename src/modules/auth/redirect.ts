// Pages a visitor would only bounce back to after signing in. /reset-password is deliberately absent:
// the recovery link legitimately lands there.
const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password']);
const BASE = 'http://sdc.invalid';

/**
 * AU-4: accept only same-site, locale-less app paths ("/events/3?x=1"); everything else becomes `fallback`.
 * Rejects protocol-relative URLs, backslashes, control characters, absolute URLs and auth-page loops.
 * A leading locale segment (/en, /ar) is stripped because the locale-aware router adds it back.
 */
export function sanitizeRedirect(raw: unknown, fallback = '/'): string {
  if (typeof raw !== 'string') return fallback;
  const value = raw.trim();
  if (value.length === 0 || value.length > 500) return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('\\') || /[\u0000-\u001f\u007f]/.test(value)) return fallback;

  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;

  let pathname = url.pathname;
  const localeMatch = /^\/(ar|en)(\/|$)/.exec(pathname);
  if (localeMatch) pathname = pathname.slice(3) || '/';
  if (AUTH_PATHS.has(pathname)) return fallback;

  return `${pathname}${url.search}${url.hash}`;
}
