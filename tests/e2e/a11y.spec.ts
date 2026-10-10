import AxeBuilder from '@axe-core/playwright';
import { expect, settle, test } from './fixtures';

// SEC-004 / NFR-A11Y-005: axe on every public page × language × theme (desktop projects; the layout is the same).
// Serious and critical violations fail the build (WCAG 2.2 AA ruleset).
const routes = [
  '/',
  '/about',
  '/events',
  '/events/1',
  '/articles',
  '/articles/1',
  '/members',
  '/login',
  '/join',
  '/forgot-password',
  '/reset-password',
  '/design-gallery',
  '/privacy',
  '/this-page-does-not-exist',
];

for (const lang of ['ar', 'en'] as const) {
  for (const path of routes) {
    test(`axe ${path} [${lang}]`, async ({ page, setup }, testInfo) => {
      test.skip(testInfo.project.name.startsWith('mobile'), 'desktop projects are enough');
      await setup({ lang });
      await page.goto(lang === 'en' ? `/en${path === '/' ? '' : path}` : path);
      await settle(page);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      const blocking = result.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(
        blocking.map(
          (v) =>
            `${v.id} (${v.impact}): ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
        ),
      ).toEqual([]);
    });
  }
}
