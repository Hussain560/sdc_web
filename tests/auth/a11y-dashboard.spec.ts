import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { gotoReady, signInAndWait } from './helpers';
import { persona, remove } from './personas';

// SEC-004: axe over the internal screens (WCAG 2.1 AA) as a system administrator who can reach all of them,
// in Arabic and English, dark and light. Serious and critical violations fail the build.
const routes = [
  '/dashboard',
  '/dashboard/events',
  '/dashboard/events/new',
  '/dashboard/registrations',
  '/dashboard/members',
  '/dashboard/committees',
  '/dashboard/articles',
  '/dashboard/reports',
  '/dashboard/membership/applications',
  '/dashboard/membership/cycles',
  '/dashboard/admin/users',
  '/dashboard/admin/roles',
  '/dashboard/admin/audit',
  '/dashboard/admin/emails',
  '/dashboard/admin/reference-data',
  '/dashboard/admin/settings',
  '/account',
  '/account/registrations',
];

test.describe.configure({ mode: 'serial' });

for (const theme of ['dark', 'light'] as const) {
  for (const lang of ['ar', 'en'] as const) {
    test(`dashboard axe [${lang}/${theme}]`, async ({ page }) => {
      test.setTimeout(240_000);
      const admin = await persona('system_admin', { fullName: 'Axe Admin Person' });
      try {
        await page.addInitScript((t) => localStorage.setItem('sdc_theme', t), theme);
        await signInAndWait(page, admin.email, undefined, lang === 'en' ? '/en/login' : '/login');
        const failures: string[] = [];
        for (const route of routes) {
          await gotoReady(page, lang === 'en' ? `/en${route}` : route);
          await page.waitForTimeout(500);
          const result = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();
          for (const v of result.violations.filter(
            (x) => x.impact === 'serious' || x.impact === 'critical',
          )) {
            failures.push(
              `${route}: ${v.id} (${v.impact}) ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
            );
          }
        }
        expect(failures).toEqual([]);
      } finally {
        await remove(admin);
      }
    });
  }
}
