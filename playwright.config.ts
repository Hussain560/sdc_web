import { execSync } from 'node:child_process';
import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const isCI = !!process.env.CI;

// Public pages (events, home block) read the database on the server, so the browser-level mocks in
// tests/e2e/fixtures.ts are not enough any more: the suite runs against the local Supabase stack, whose
// migrations seed the six legacy events. Start it first with `npx supabase start` (CI does the same).
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
const testEnv = {
  NEXT_PUBLIC_SUPABASE_URL: sb.API_URL ?? 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: sb.ANON_KEY ?? '',
  // Lets the developer-only /design-gallery render in the production build the suite runs against.
  DESIGN_GALLERY: '1',
};

const themes = ['dark', 'light'] as const;
const viewports = [
  { name: 'desktop', use: devices['Desktop Chrome'] },
  { name: 'mobile', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } } },
];

export default defineConfig({
  testDir: './tests/e2e',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 1,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.001, animations: 'disabled' } },
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  projects: viewports.flatMap((v) =>
    themes.map((theme) => ({
      name: `${v.name}-${theme}`,
      use: { ...v.use, colorScheme: theme, storageState: undefined },
      metadata: { theme },
    })),
  ),
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 300_000,
    env: testEnv,
  },
});
