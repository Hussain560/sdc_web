import { describe, expect, it } from 'vitest';
import { parseClientEnv } from '@/lib/env';

describe('parseClientEnv', () => {
  it('accepts a valid environment', () => {
    const env = parseClientEnv({
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'k',
    });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54321');
  });

  it('names the missing variables', () => {
    expect(() => parseClientEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('rejects a malformed URL', () => {
    expect(() =>
      parseClientEnv({ NEXT_PUBLIC_SUPABASE_URL: 'nope', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'k' }),
    ).toThrow();
  });
});
