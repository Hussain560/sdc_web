import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { clientEnv } from '../env';

/**
 * Cookie-less anonymous client for public pages. Because it never touches cookies(), pages that use it can be
 * cached and revalidated. It only ever reads the anon-visible views (public_events, public members, …).
 */
export function createPublicClient() {
  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
