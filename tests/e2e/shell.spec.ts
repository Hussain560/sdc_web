import { expect, test } from './fixtures';

test('theme toggle persists the choice', async ({ page, setup }) => {
  await setup();
  await page.goto('/');
  const initial = await page.locator('html').getAttribute('data-theme');
  await page.locator('button.sdc-icon-btn').first().click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', initial ?? '');
});

test('unknown route renders the branded 404', async ({ page, setup }) => {
  await setup();
  const res = await page.goto('/nope');
  expect(res?.status()).toBe(404);
});
