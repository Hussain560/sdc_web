import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';
import type { Database } from './database.types';
import { clientEnv } from '../env';

const hasAuthCookie = (request: NextRequest) =>
  request.cookies.getAll().some((c) => c.name.startsWith('sb-'));

/**
 * Refreshes the Supabase session on every app request and writes any new cookies onto `response`.
 * Makes no network call when the visitor has no auth cookie, so anonymous traffic stays cheap.
 */
export async function refreshSession(request: NextRequest, response: NextResponse) {
  if (!hasAuthCookie(request)) return;

  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          toSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Validates the token and rotates it when close to expiry. Do not run code between creating the client and this call.
  await supabase.auth.getClaims();
}
