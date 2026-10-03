import { expect, test } from '@playwright/test';
import { sql } from './db';
import { gotoReady, signInAndWait } from './helpers';
import { persona, remove } from './personas';

// Sprint 11 — RPT-001/002/003, ACC-005/006, PUB-001: the overview, the reports, the audit log, site settings,
// partners and tags, against the real local stack.
const tag = Math.random().toString(36).slice(2, 7);

test.afterAll(async () => {
  await sql(
    `update public.site_settings set value = '"https://instagram.com"'::jsonb where key = 'social_instagram'`,
  );
  await sql(`update public.site_settings set value = '""'::jsonb where key = 'contact_email'`);
  await sql(`delete from public.partners where name_en = $1`, [`E2E Partner ${tag}`]);
  await sql(`delete from public.tags where slug = $1`, [`e2e-tag-${tag}`]);
});

test.describe('overview and reports', () => {
  test('the leader sees the overview, the community report and a committee report', async ({
    page,
  }) => {
    const leader = await persona('community_leader', { fullName: 'Report Leader Person' });
    try {
      await signInAndWait(page, leader.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard');
      await expect(
        page.getByRole('heading', { name: /Welcome, Report Leader Person/, level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByRole('main').getByText('Active members', { exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Awaiting your action' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'My activity' })).toBeVisible();

      await page.goto('/en/dashboard/reports');
      await expect(
        page.getByRole('heading', { name: 'Community reports', level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByRole('main').getByText('Acceptance rate', { exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'By committee' })).toBeVisible();
      await page.getByRole('link', { name: 'This year' }).click();
      await expect(page).toHaveURL(/period=year/);
      await expect(page.getByRole('link', { name: 'This year' })).toHaveAttribute(
        'aria-current',
        'true',
      );

      await page.getByRole('link', { name: 'Artificial Intelligence' }).first().click();
      await expect(page).toHaveURL(/\/en\/dashboard\/reports\/committees\/[0-9a-f-]{36}/);
      await expect(
        page.getByRole('heading', { name: /Artificial Intelligence report/, level: 1 }),
      ).toBeVisible();

      // the audit log needs audit.view, which a leader does not hold
      await page.goto('/en/dashboard/admin/audit');
      await expect(
        page.getByRole('alert').filter({ hasText: "You don't have access to this page" }),
      ).toBeVisible();
    } finally {
      await remove(leader);
    }
  });

  test('a committee head is sent to their own committee report', async ({ page }) => {
    const head = await persona('committee_head', {
      committeeSlug: 'ai',
      fullName: 'Report Head Person',
      member: true,
    });
    try {
      await signInAndWait(page, head.email, undefined, '/en/login');
      await page.goto('/en/dashboard/reports');
      await expect(page).toHaveURL(/\/en\/dashboard\/reports\/committees\/[0-9a-f-]{36}/);
      await expect(page.getByRole('heading', { name: /report$/, level: 1 })).toBeVisible();
    } finally {
      await remove(head);
    }
  });
});

test.describe('administration', () => {
  test('settings validate, save, reach the footer and appear in the audit log', async ({
    page,
  }) => {
    const admin = await persona('system_admin', { fullName: 'Settings Admin Person' });
    try {
      await signInAndWait(page, admin.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/admin/settings');
      await expect(page.getByRole('heading', { name: 'Site settings', level: 1 })).toBeVisible();

      await page.getByLabel('Instagram link').fill('http://insecure.example.test');
      await page.getByRole('button', { name: 'Save settings' }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: /Instagram link/ })
          .first(),
      ).toBeVisible();

      const url = `https://instagram.com/e2e_${tag}`;
      await page.getByLabel('Instagram link').fill(url);
      await page.getByLabel('Contact e-mail').fill(`hello-${tag}@sdc.example.test`);
      await page.getByRole('button', { name: 'Save settings' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Settings saved' })).toBeVisible();

      await page.goto('/en');
      await expect(page.getByRole('link', { name: 'Instagram' })).toHaveAttribute('href', url);

      await page.goto(`/en/dashboard/admin/audit?action=settings`);
      await expect(page.getByRole('heading', { name: 'Audit log', level: 1 })).toBeVisible();
      await expect(page.getByRole('cell', { name: 'settings.update' }).first()).toBeVisible();
      await expect(page.getByText('Settings Admin Person').first()).toBeVisible();
    } finally {
      await remove(admin);
    }
  });

  test('partners are added and deleted, and tags are renamed', async ({ page }) => {
    const admin = await persona('system_admin', { fullName: 'Partner Admin Person' });
    await sql(
      `insert into public.tags (slug, label_ar, label_en) values ($1, 'وسم تجريبي', 'E2E tag')`,
      [`e2e-tag-${tag}`],
    );
    try {
      await signInAndWait(page, admin.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/admin/settings?tab=partners');
      await page.getByRole('button', { name: '+ Add partner' }).click();
      await page.getByLabel('Name (Arabic)').fill('شريك تجريبي');
      await page.getByLabel('Name (English)').fill(`E2E Partner ${tag}`);
      await page.getByLabel('Logo link').fill('http://bad.example.test/a.png');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: /logo link/ })
          .first(),
      ).toBeVisible();
      await page.getByLabel('Logo link').fill('');
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Partner saved' })).toBeVisible();
      const row = page.getByRole('row').filter({ hasText: `E2E Partner ${tag}` });
      await expect(row).toBeVisible();
      await row.getByRole('button', { name: 'Delete' }).click();
      await row.getByRole('button', { name: 'Confirm delete' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Partner deleted' })).toBeVisible();
      await expect(page.getByRole('row').filter({ hasText: `E2E Partner ${tag}` })).toHaveCount(0);

      await gotoReady(page, '/en/dashboard/admin/reference-data?tab=tags');
      const tagRow = page.getByRole('row').filter({ hasText: `e2e-tag-${tag}` });
      await tagRow.getByRole('button', { name: 'Edit' }).click();
      await page.getByLabel('Name (English)').fill(`E2E tag renamed ${tag}`);
      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
      await expect(page.getByText(`E2E tag renamed ${tag}`)).toBeVisible();
    } finally {
      await remove(admin);
    }
  });
});
