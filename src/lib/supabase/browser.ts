import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';
import { clientEnv } from '../env';

// Browser client. Shares the cookie session written by the server clients (docs/06-security/authentication.md).
// Prefer Server Components / Server Actions; use this only where a direct client call is justified.
export const supabase = createBrowserClient<Database>(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
