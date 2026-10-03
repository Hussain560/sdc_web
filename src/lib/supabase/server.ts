import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';
import { clientEnv } from '../env';

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Runs as the signed-in user, so RLS applies (docs/04-architecture/server-logic-and-data-access.md §2).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component: cookies are read-only there. proxy.ts refreshes the session.
          }
        },
      },
    },
  );
}
