import { expect, settle, test } from './fixtures';

// WCAG 1.4.10 Reflow: no horizontal scrolling at 320 CSS px on any public route (Sprint 14 test plan).
const routes = [
  '/',
  '/about',
  '/events',
  '/events/1',
  '/articles',
  '/articles/1',
  '/members',
  '/members/100',
  '/login',
  '/join',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/design-gallery',
];

for (const lang of ['ar', 'en'] as const) {
  for (const path of routes) {
    test(`no horizontal scroll at 320px ${path} [${lang}]`, async ({ page, setup }, testInfo) => {
      test.skip(testInfo.project.name.startsWith('mobile'), 'the 320 px viewport is set here');
      await setup({ lang });
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(lang === 'en' ? `/en${path === '/' ? '' : path}` : path);
      await settle(page);
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const wide = [...document.querySelectorAll<HTMLElement>('body *')]
          .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1)
          .slice(0, 3)
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`);
        return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, wide };
      });
      expect(overflow.scrollWidth, JSON.stringify(overflow.wide)).toBeLessThanOrEqual(
        overflow.clientWidth,
      );
    });
  }
}
