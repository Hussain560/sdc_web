import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { sql } from './db';
import { gotoReady, signInAndWait, uniqueEmail } from './helpers';
import { persona, remove } from './personas';

// Sprint 18: axe (WCAG 2.1 AA) over the membership screens: the public journey pages, the member's own pages and the
// leadership screens that were redesigned, in Arabic and English, dark and light. Serious and critical violations fail.
const tag = Math.random().toString(36).slice(2, 7);
const publicRoutes = [
  '/join',
  '/join/status/00000000000000000000000000000000000000000000',
  '/activate/00000000000000000000000000000000000000000000',
  '/verify/member/not-a-real-code',
  '/notice/blocked',
];

async function scan(page: import('@playwright/test').Page, route: string, lang: 'ar' | 'en') {
  // Entrance animations (staggered fades) would be measured half-way: scan the settled page.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoReady(page, lang === 'en' ? `/en${route}` : route);
  await page.waitForTimeout(600);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  return result.violations
    .filter((x) => x.impact === 'serious' || x.impact === 'critical')
    .map(
      (v) =>
        `${route}: ${v.id} (${v.impact}) ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(' ')}`,
    );
}

test.describe.configure({ mode: 'default' });

test.beforeAll(async () => {
  await sql(`delete from public.membership_applications`);
  await sql(`delete from public.membership_cycles`);
  await sql(
    `insert into public.membership_cycles (id, name_ar, opens_at, closes_at, status, capacity, questions, rubric, term_ends_at)
     values ('00000000-0000-0000-0000-0000000a11a1', $1, now() - interval '1 day', now() + interval '10 days', 'published', 10, '[]', '[]', current_date + 300)`,
    [`دورة الوصول ${tag}`],
  );
  await sql(
    `insert into public.membership_applications (id, cycle_id, email, first_name_ar, last_name_ar, first_name_en, last_name_en, full_name_ar, phone, academic_status, consent_version, wants_directory_listing)
     values ('00000000-0000-0000-0000-0000000a11a2', '00000000-0000-0000-0000-0000000a11a1', $1, 'متقدم', 'وصول', 'Axe', 'Applicant', 'x x', '+966504200001', 'graduate', 'v1', false)`,
    [uniqueEmail('axe-app')],
  );
});
test.afterAll(async () => {
  await sql(
    `delete from public.membership_applications where id = '00000000-0000-0000-0000-0000000a11a2'`,
  );
  await sql(
    `delete from public.membership_cycles where id = '00000000-0000-0000-0000-0000000a11a1'`,
  );
});

for (const theme of ['dark', 'light'] as const) {
  for (const lang of ['ar', 'en'] as const) {
    test(`membership public pages axe [${lang}/${theme}]`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.addInitScript((t) => localStorage.setItem('sdc_theme', t), theme);
      const failures: string[] = [];
      for (const route of publicRoutes) failures.push(...(await scan(page, route, lang)));
      expect(failures).toEqual([]);
    });

    test(`membership signed-in pages axe [${lang}/${theme}]`, async ({ page }) => {
      test.setTimeout(300_000);
      const admin = await persona('system_admin', { fullName: 'Axe Member Admin', member: true });
      try {
        const member = await sql<{ id: string }>(
          `select id from public.members where user_id = $1`,
          [admin.id],
        );
        await page.addInitScript((t) => localStorage.setItem('sdc_theme', t), theme);
        await signInAndWait(page, admin.email, undefined, lang === 'en' ? '/en/login' : '/login');
        const routes = [
          '/account/membership',
          '/welcome',
          '/card',
          '/dashboard/membership/waitlist',
          '/dashboard/membership/leave-requests',
          `/dashboard/members/${member[0]!.id}`,
          '/dashboard/membership/applications/00000000-0000-0000-0000-0000000a11a2',
        ];
        const failures: string[] = [];
        for (const route of routes) failures.push(...(await scan(page, route, lang)));
        expect(failures).toEqual([]);
      } finally {
        await remove(admin);
      }
    });
  }
}
