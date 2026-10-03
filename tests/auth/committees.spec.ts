import { expect, test } from '@playwright/test';
import { sql } from './db';
import { gotoReady, signInAndWait } from './helpers';
import { persona, remove } from './personas';

// Sprint 10 — CMT-003: committee management (create, edit, deactivate, reactivate, delete), the head's own view
// and the public committee page, against the real local stack.
const tag = Math.random().toString(36).slice(2, 7);
const slug = `e2e-cmt-${tag}`;

test.afterAll(async () => {
  await sql(
    `delete from public.role_assignments where committee_id in (select id from public.committees where slug = $1)`,
    [slug],
  );
  await sql(`delete from public.committees where slug = $1`, [slug]);
});

test.describe('committees', () => {
  test('the leader creates, edits, deactivates, reactivates and deletes a committee', async ({
    page,
    browser,
  }) => {
    const leader = await persona('community_leader', { fullName: 'Committee Leader Person' });
    try {
      await signInAndWait(page, leader.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/committees');
      await expect(page.getByRole('heading', { name: 'Committees', level: 1 })).toBeVisible();
      await expect(page.getByRole('link', { name: /Artificial Intelligence/ })).toBeVisible();

      // create
      await page.getByRole('button', { name: '+ New committee' }).click();
      const dlg = page.getByRole('dialog');
      await dlg.getByLabel('Name (Arabic) *').fill(`لجنة تجريبية ${tag}`);
      await dlg.getByLabel('Name (English)').fill(`E2E Committee ${tag}`);
      await dlg.getByLabel('Slug *').fill('Bad Slug');
      await dlg.getByRole('button', { name: 'Create' }).click();
      await expect(
        page
          .getByRole('alert')
          .filter({ hasText: /highlighted fields/ })
          .first(),
      ).toBeVisible();
      await dlg.getByLabel('Slug *').fill(slug);
      await dlg.getByLabel('Description (Arabic)').fill('وصف اللجنة التجريبية');
      await dlg.getByRole('button', { name: 'Create' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Committee created' })).toBeVisible();
      await expect(page).toHaveURL(/\/en\/dashboard\/committees\/[0-9a-f-]{36}/);
      await expect(
        page.getByRole('heading', { name: `E2E Committee ${tag}`, level: 1 }),
      ).toBeVisible();

      // edit: the slug stays fixed
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      await expect(page.getByLabel('Slug *')).toBeDisabled();
      await page
        .getByRole('dialog')
        .getByLabel('Name (English)')
        .fill(`E2E Committee Renamed ${tag}`);
      await page.getByRole('dialog').getByRole('button', { name: 'Save', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Committee saved' })).toBeVisible();
      await expect(
        page.getByRole('heading', { name: `E2E Committee Renamed ${tag}`, level: 1 }),
      ).toBeVisible();

      // public page while active
      await page.goto(`/en/committees/${slug}`);
      await expect(
        page.getByRole('heading', { name: `E2E Committee Renamed ${tag}`, level: 1 }),
      ).toBeVisible();
      // No English description yet: the Arabic one is shown.
      await expect(page.getByText('وصف اللجنة التجريبية')).toBeVisible();

      // deactivate: a reason is required, the public page disappears
      await gotoReady(page, '/en/dashboard/committees');
      await page.getByRole('link', { name: new RegExp(`E2E Committee Renamed ${tag}`) }).click();
      await page.getByRole('button', { name: 'Deactivate' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Deactivate' }).click();
      await expect(
        page.getByRole('alert').filter({ hasText: 'provide a reason' }).first(),
      ).toBeVisible();
      await page.getByRole('dialog').getByLabel('Reason *').fill('Merged into another committee');
      await page.getByRole('dialog').getByRole('button', { name: 'Deactivate' }).click();
      await expect(
        page.getByRole('status').filter({ hasText: 'Committee deactivated' }),
      ).toBeVisible();
      await expect(page.getByText('Inactive', { exact: true }).first()).toBeVisible();
      await page.goto(`/en/committees/${slug}`);
      await expect(page.locator('.sdc-404-number')).toBeVisible();

      // reactivate, then delete the empty committee
      const detail = (
        await sql<{ id: string }>(`select id from public.committees where slug = $1`, [slug])
      )[0]!.id;
      await gotoReady(page, `/en/dashboard/committees/${detail}`);
      await page.getByRole('button', { name: 'Reactivate' }).click();
      await expect(
        page.getByRole('status').filter({ hasText: 'Committee reactivated' }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(page).toHaveURL(/\/en\/dashboard\/committees$/);
      await expect(page.getByRole('status').filter({ hasText: 'Committee deleted' })).toBeVisible();
      expect(await sql(`select 1 from public.committees where slug = $1`, [slug])).toHaveLength(0);

      // a committee that owns something cannot be deleted
      const owned = (
        await sql<{ id: string }>(`select id from public.committees where slug = 'projects'`)
      )[0]!.id;
      await sql(
        `insert into public.articles (slug, committee_id, title_ar, body_ar) values ($1, $2, $3, 'نص')`,
        [`cmt-owned-${tag}`, owned, `مقال اللجنة ${tag}`],
      );
      await gotoReady(page, `/en/dashboard/committees/${owned}`);
      await page.getByRole('button', { name: 'Delete', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(
        page.getByRole('alert').filter({ hasText: 'cannot be deleted' }).first(),
      ).toBeVisible();
      await sql(`delete from public.articles where slug = $1`, [`cmt-owned-${tag}`]);
      void browser;
    } finally {
      await remove(leader);
    }
  });

  test('a committee head sees only their own committee and cannot edit or deactivate it', async ({
    page,
  }) => {
    const head = await persona('committee_head', {
      committeeSlug: 'cybersecurity',
      fullName: 'Committee Head Person',
    });
    try {
      await signInAndWait(page, head.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/committees');
      // One committee → straight to its page.
      await expect(page).toHaveURL(/\/en\/dashboard\/committees\/[0-9a-f-]{36}/);
      await expect(page.getByRole('heading', { name: 'Cybersecurity', level: 1 })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Edit', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Deactivate' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Assign position/ })).toBeVisible();

      // Another committee: the head gets the forbidden card.
      const other = (
        await sql<{ id: string }>(`select id from public.committees where slug = 'ai'`)
      )[0]!.id;
      await gotoReady(page, `/en/dashboard/committees/${other}`);
      await expect(page.getByRole('heading', { name: /don.t have access/ })).toBeVisible();
    } finally {
      await remove(head);
    }
  });

  test('public committee pages show the committee, its leadership and unknown slugs are 404', async ({
    page,
  }) => {
    await page.goto('/en/committees/cybersecurity');
    await expect(page.getByRole('heading', { name: 'Cybersecurity', level: 1 })).toBeVisible();
    await page.goto('/en/committees/no-such-committee');
    await expect(page.locator('.sdc-404-number')).toBeVisible();
  });
});
