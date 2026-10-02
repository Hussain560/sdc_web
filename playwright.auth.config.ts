import { execSync } from 'node:child_process';
import { defineConfig, devices } from '@playwright/test';

/**
 * Auth + RBAC end-to-end suite. Unlike the visual suite it talks to the REAL local Supabase stack
 * (Auth, Postgres, Mailpit) — start it first with `npx supabase start`.  Run: npm run e2e:auth
 */
const PORT = 3300;

function localSupabase() {
  const out = execSync('npx supabase status -o env', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const env: Record<string, string> = {};
  for (const line of out.split(/\r?\n/)) {
    const m = /^([A-Z_]+)="?(.*?)"?$/.exec(line.trim());
    if (m?.[1]) env[m[1]] = m[2] ?? '';
  }
  return env;
}

const sb = localSupabase();
Object.assign(process.env, {
  SB_API_URL: sb.API_URL,
  SB_SERVICE_ROLE_KEY: sb.SERVICE_ROLE_KEY,
  SB_MAILPIT_URL: sb.MAILPIT_URL ?? sb.INBUCKET_URL,
});

export default defineConfig({
  testDir: './tests/auth',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  // The dev server compiles pages on first visit, so allow more than the 5s default.
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    // Production build: no on-demand compilation, so timing matches CI.
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      NEXT_DIST_DIR: '.next-auth',
      NEXT_PUBLIC_SUPABASE_URL: sb.API_URL ?? '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: sb.ANON_KEY ?? '',
      SUPABASE_SERVICE_ROLE_KEY: sb.SERVICE_ROLE_KEY ?? '',
    },
  },
});
