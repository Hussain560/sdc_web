import type { User } from '@supabase/supabase-js';
import { getLocale } from 'next-intl/server';
import { cache } from 'react';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Verified user for this request (asks Supabase Auth to validate the token — never trusts a bare cookie decode).
 * Cached per request so layouts and pages can both call it.
 */
export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/** Server-side guard: unauthenticated visitors go to /login and come back to `next` afterwards (AU-6). */
export async function requireUser(next: string): Promise<User> {
  const user = await getUser();
  if (user) return user;
  const locale = await getLocale();
  return redirect({ href: { pathname: '/login', query: { redirect: next } }, locale });
}
