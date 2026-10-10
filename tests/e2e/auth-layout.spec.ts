import { expect, settle, test } from './fixtures';

// RDS-008: the (auth) route group has its own split layout and no public chrome (ADR-014, 05-auth.md).
const pages = ['/login', '/forgot-password', '/reset-password'];

for (const lang of ['ar', 'en'] as const) {
  for (const path of pages) {
    test(`auth layout ${path} [${lang}]`, async ({ page, setup }) => {
      await setup({ lang });
      await page.goto(lang === 'en' ? `/en${path}` : path);
      await settle(page);

      // No site header or footer: no banner landmark, no nav, no contentinfo.
      await expect(page.getByRole('banner')).toHaveCount(0);
      await expect(page.getByRole('navigation')).toHaveCount(0);
      await expect(page.getByRole('contentinfo')).toHaveCount(0);

      // One main landmark with exactly one h1.
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

      // The brand panel is decorative.
      const decorative = page.locator(
        'aside[aria-hidden="true"], div[aria-hidden="true"].motif-dots',
      );
      expect(await decorative.count()).toBeGreaterThan(0);

      // The language and theme switches are reachable.
      await expect(
        page.getByRole('button', { name: lang === 'ar' ? 'English' : 'العربية' }),
      ).toBeVisible();
    });
  }
}

test('auth pages collapse the brand panel to a strip below 1024 px and the form stays usable', async ({
  page,
  setup,
}) => {
  await setup({ lang: 'en' });
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/en/login');
  await settle(page);
  await expect(page.locator('aside')).toBeHidden();
  const strip = page.locator('div[aria-hidden="true"].motif-dots').first();
  const box = await strip.boundingBox();
  expect(Math.round(box?.height ?? 0)).toBe(96);
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('login offers the membership application, never a sign-up', async ({ page, setup }) => {
  await setup({ lang: 'en' });
  await page.goto('/en/login');
  await expect(page.getByRole('link', { name: /Apply for membership/ })).toHaveAttribute(
    'href',
    /\/en\/join$/,
  );
  await expect(page.getByRole('link', { name: /create.*account/i })).toHaveCount(0);
});

test('reset-password without a session explains the expired link and offers a new one', async ({
  page,
  setup,
}) => {
  await setup({ lang: 'en' });
  await page.goto('/en/reset-password');
  await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
    'href',
    /forgot-password$/,
  );
});
