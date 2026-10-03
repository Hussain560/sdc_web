import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { clientEnv, serverEnv } from '../env';

/**
 * Service-role client. It bypasses RLS, so it is for trusted server code only (the notification outbox,
 * cron routes) and never receives user-controlled filters without validation. Never import it from a client component.
 */
export function createAdminClient() {
  const key = serverEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient<Database>(clientEnv.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
