import { z } from 'zod';

/**
 * Validated environment (ENG-006). Fails fast with a readable message instead of a
 * mysterious runtime error. NEXT_PUBLIC_* must be referenced literally so Next.js inlines them.
 * Server-only secrets are read through `serverEnv()` and never reach the browser bundle.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  EMAIL_PROVIDER_API_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(16).optional(),
});

export function parseClientEnv(source: Record<string, string | undefined>) {
  const result = clientSchema.safeParse(source);
  if (!result.success) {
    const fields = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid or missing environment variables: ${fields} (see .env.example)`);
  }
  return result.data;
}

export const clientEnv = parseClientEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export function serverEnv() {
  if (typeof window !== 'undefined') throw new Error('serverEnv() is server-only');
  return serverSchema.parse(process.env);
}
