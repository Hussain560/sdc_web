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

test.describe('locale routing (ADR-010)', () => {
  test('Arabic is served RTL from the server, unprefixed', async ({ request }) => {
    const html = await (await request.get('/events')).text();
    expect(html).toMatch(/<html[^>]*lang="ar"[^>]*dir="rtl"/);
  });

  test('English is served LTR from the server under /en', async ({ request }) => {
    const html = await (await request.get('/en/events')).text();
    expect(html).toMatch(/<html[^>]*lang="en"[^>]*dir="ltr"/);
  });

  test('language toggle keeps the page and switches the URL', async ({ page, setup }) => {
    await setup();
    await page.goto('/events');
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page).toHaveURL(/\/en\/events$/);
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  });

  test('legacy /members/all redirects to /members', async ({ page, setup }) => {
    await setup();
    await page.goto('/members/all');
    await expect(page).toHaveURL(/\/members$/);
  });
});
