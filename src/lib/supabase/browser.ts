import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

import { clientEnv } from '../env';

// Browser client (legacy pattern, unchanged behaviour). Server-side clients via
// @supabase/ssr arrive with the Identity & Access phase (docs/06-security/authentication.md).
export const supabase = createClient<Database>(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
