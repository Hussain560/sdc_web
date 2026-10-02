import { test as base, expect, type Page } from '@playwright/test';
import { members } from '../fixtures/members';
import { positions } from '../fixtures/positions';

type Lang = 'ar' | 'en';

/** Mocks every Supabase call the public pages make, so runs are deterministic. */
async function mockSupabase(page: Page) {
  await page.route('**/rest/v1/members*', async (route) => {
    const url = new URL(route.request().url());
    const idFilter = url.searchParams.get('id');
    const single = route.request().headers()['accept']?.includes('vnd.pgrst.object');
    let rows = members;
    if (idFilter?.startsWith('eq.')) rows = members.filter((m) => `eq.${m.id}` === idFilter);
    const body = single ? (rows[0] ?? null) : rows;
    await route.fulfill({
      status: single && !rows[0] ? 406 : 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  await page.route('**/rest/v1/current_positions*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(positions),
    }),
  );
  await page.route('**/rest/v1/event_registrations*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  );
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

export const test = base.extend<{ setup: (opts?: { lang?: Lang }) => Promise<void> }>({
  setup: async ({ page }, use, testInfo) => {
    const theme = (testInfo.project.metadata as { theme: 'dark' | 'light' }).theme;
    await use(async ({ lang = 'ar' } = {}) => {
      await mockSupabase(page);
      await page.addInitScript(
        (init: { l: string; t: string }) => {
          localStorage.setItem('sdc_theme', init.t);
        },
        { l: lang, t: theme },
      );
    });
  },
});

export { expect };

/** Waits for fonts + stabilises the page before a screenshot. */
export async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content:
      '*{animation:none!important;transition:none!important;caret-color:transparent!important}',
  });
  await page.evaluate(async () => {
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 150));
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r(null))));
}
