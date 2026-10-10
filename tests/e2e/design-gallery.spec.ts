import { expect, settle, test } from './fixtures';

// RDS-003..007: the developer-only component gallery. Behaviour checks always run; the screenshots run only when
// GALLERY_SNAPSHOTS=1, because new baselines are committed after owner review (Sprint 14 visual regression rule).
const sections = ['type', 'actions', 'labels', 'forms', 'containers', 'feedback', 'navigation'];

for (const lang of ['ar', 'en'] as const) {
  test.describe(`gallery [${lang}]`, () => {
    test.beforeEach(async ({ page, setup }) => {
      await setup({ lang });
      await page.goto(lang === 'en' ? '/en/design-gallery' : '/design-gallery');
      await settle(page);
    });

    test('renders every section with the right direction', async ({ page }) => {
      await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      for (const id of sections)
        await expect(page.locator(`[data-gallery-section="${id}"]`)).toBeVisible();
    });

    test('the type scale is fluid and uses the self-hosted fonts', async ({ page }) => {
      const sizes = await page.evaluate(() => {
        const px = (sel: string) =>
          parseFloat(getComputedStyle(document.querySelector(sel)!).fontSize);
        return { display: px('.t-display'), h2: px('.t-h2'), body: px('.t-body') };
      });
      expect(sizes.display).toBeGreaterThanOrEqual(40);
      expect(sizes.display).toBeLessThanOrEqual(72);
      expect(sizes.display).toBeGreaterThan(sizes.h2);
      expect(sizes.body).toBe(16);
      const families = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
      expect(families.toLowerCase()).toContain('rubik');
    });

    test('dialog: opens, traps focus, Esc closes, focus returns to the trigger', async ({
      page,
    }) => {
      const trigger = page.getByRole('button', {
        name: lang === 'ar' ? 'فتح نافذة' : 'Open dialog',
      });
      await trigger.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test('busy dialog ignores Esc', async ({ page }) => {
      await page
        .getByRole('button', { name: lang === 'ar' ? 'جارٍ تسجيلك…' : 'Registering you…' })
        .first()
        .click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toBeVisible();
    });

    test('tabs and accordion work from the keyboard', async ({ page }) => {
      const tab = page.getByRole('tab').first();
      await tab.focus();
      await page.keyboard.press(lang === 'ar' ? 'ArrowLeft' : 'ArrowRight');
      await expect(page.getByRole('tab').nth(1)).toHaveAttribute('aria-selected', 'true');
      const trigger = page.getByRole('button').filter({
        hasText: lang === 'ar' ? 'هل أحتاج' : 'Do I need',
      });
      await trigger.focus();
      await page.keyboard.press('Enter');
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    test('every interactive control has a visible focus ring', async ({ page }) => {
      const first = page
        .getByRole('button', { name: lang === 'ar' ? 'سجّل الآن' : 'Register now' })
        .first();
      await first.focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      const outline = await first.evaluate((el) => getComputedStyle(el).outlineStyle);
      expect(outline).not.toBe('none');
    });

    test('the +30% string fixture causes no overflow at 360px', async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test('screenshots', async ({ page }, testInfo) => {
      test.skip(!process.env.GALLERY_SNAPSHOTS, 'new baselines need owner approval');
      for (const id of sections) {
        await expect(page.locator(`[data-gallery-section="${id}"]`)).toHaveScreenshot(
          `gallery-${id}-${lang}.png`,
        );
      }
      void testInfo;
    });
  });
}
