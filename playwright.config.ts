import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const isCI = !!process.env.CI;

// Public pages read Supabase from the browser; the e2e suite mocks those calls
// (tests/e2e/fixtures.ts) so screenshots never depend on live data.
const testEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
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
