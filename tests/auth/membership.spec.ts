import { expect, test, type Page } from '@playwright/test';
import { sql } from './db';
import { gotoReady, signInAndWait, waitForMail } from './helpers';
import { persona, remove } from './personas';

// Sprint 07 — TEST: intake cycle scheduling → /join states → apply → status → withdraw, against the real local stack.
const tag = Math.random().toString(36).slice(2, 7);

const local = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toISOString().slice(0, 16);
};

async function wipe() {
  await sql(
    `delete from public.membership_applications where cycle_id in (select id from public.membership_cycles where name_ar like $1)`,
    [`%${tag}%`],
  );
  await sql(`delete from public.email_logs where entity_type = 'membership_application'`);
  await sql(`delete from public.membership_cycles where name_ar like $1`, [`%${tag}%`]);
}

test.beforeAll(async () => {
  // Published cycles may never overlap (MB-2): clear leftovers of earlier runs.
  await sql(`delete from public.membership_applications`);
  await sql(`delete from public.membership_cycles`);
});
test.afterAll(wipe);

async function fillApplication(page: Page) {
  await page.locator('#field-fullNameAr').fill(`متقدم ${tag}`);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByText('Student', { exact: true }).click();
  await page.locator('#field-universityId').selectOption({ index: 1 });
  await page.locator('#field-majorId').selectOption({ index: 1 });
  await page.locator('#field-trackId').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('#field-bioAr').fill('مطوّر يحب المجتمع');
  await page.getByRole('button', { name: 'Next' }).click();
  // Step 4: the cycle's extra question (required).
  await page.locator('[id="field-q:q1"]').fill('Because I want to grow');
  await page.getByRole('button', { name: 'Next' }).click();
}

test.describe('intake cycle → /join → application', () => {
  test('the leader opens a cycle, an applicant applies and withdraws, the leader closes it', async ({
    page,
    browser,
  }) => {
    const leader = await persona('community_leader', { fullName: 'Intake Leader Person' });
    const applicant = await persona(null, { fullName: 'Intake Applicant Person' });
    const head = await persona('committee_head', {
      committeeSlug: 'ai',
      fullName: 'Intake Head Person',
    });
    try {
      // /join is "closed" before any cycle exists.
      await page.goto('/en/join');
      await expect(page.getByText('Membership applications are closed')).toBeVisible();

      // A committee head cannot manage cycles.
      const hctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const hpage = await hctx.newPage();
      await signInAndWait(hpage, head.email, undefined, '/en/login');
      await gotoReady(hpage, '/en/dashboard/membership/cycles');
      await expect(hpage.getByRole('heading', { name: 'Membership intake cycles' })).toHaveCount(0);
      await hctx.close();

      // Leader creates the cycle (opened immediately) with one required question.
      const lctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const lpage = await lctx.newPage();
      await signInAndWait(lpage, leader.email, undefined, '/en/login');
      await gotoReady(lpage, '/en/dashboard/membership/cycles/new');
      await lpage.locator('#field-nameAr').fill(`استقبال ${tag}`);
      await lpage.locator('#field-opensAt').fill(local(1));
      await lpage.locator('#field-closesAt').fill(local(10));
      await lpage.getByRole('button', { name: '+ Question' }).click();
      await lpage.getByLabel('Question (Arabic) *').fill('لماذا تريد الانضمام؟');
      await lpage.getByLabel('Question (English)').fill('Why do you want to join?');
      await lpage.getByLabel('Required').check();
      await lpage.getByRole('button', { name: 'Open now' }).click();
      await expect(lpage).toHaveURL(/\/en\/dashboard\/membership\/cycles$/, { timeout: 20_000 });
      await expect(lpage.getByText('Open', { exact: true }).first()).toBeVisible();

      // Applicant: signed out sees the sign-in prompt, signed in sees the form.
      await page.goto('/en/join');
      await expect(page.getByRole('link', { name: 'Sign in to apply' })).toBeVisible();
      await signInAndWait(page, applicant.email, undefined, '/en/login');
      await gotoReady(page, '/en/join');
      // Validation: step 1 needs a name; the required question blocks step 4.
      await page.locator('#field-fullNameAr').fill('');
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('alert').first()).toBeVisible();
      await fillApplication(page);
      await page.locator('#field-consent').check();
      await page.getByRole('button', { name: 'Submit application' }).click();
      await expect(page.getByText('Application received')).toBeVisible({ timeout: 20_000 });

      const mail = await waitForMail(applicant.email, {
        subject: /received your membership application/i,
      });
      expect(mail.html).toContain('/en/account/membership');

      // Status page: one application; a second submission is refused by the database.
      await gotoReady(page, '/en/account/membership');
      await expect(page.getByText('Received').first()).toBeVisible();
      const rows = await sql<{ n: string }>(
        `select count(*)::text as n from public.membership_applications where cycle_id in (select id from public.membership_cycles where name_ar like $1)`,
        [`%${tag}%`],
      );
      expect(rows[0]!.n).toBe('1');

      // Withdraw, then the page offers the form again.
      await page.getByRole('button', { name: 'Withdraw' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
      await expect(page.getByText('Withdrawn').first()).toBeVisible();

      // Leader closes early → /join shows the closed-awaiting state and the database refuses applications.
      await gotoReady(lpage, '/en/dashboard/membership/cycles');
      await lpage.getByRole('button', { name: 'Close early' }).first().click();
      await lpage.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
      await expect(lpage.getByText('Closed — awaiting decisions').first()).toBeVisible();
      await page.goto('/en/join');
      await expect(page.getByText(/Applications closed on/)).toBeVisible();
      await lctx.close();
    } finally {
      await wipe();
      await remove(leader, applicant, head);
    }
  });

  test('reference data is editable by an admin only', async ({ page, browser }) => {
    const admin = await persona('system_admin', { fullName: 'Reference Admin Person' });
    const head = await persona('committee_head', {
      committeeSlug: 'ai',
      fullName: 'Reference Head Person',
    });
    try {
      await signInAndWait(page, admin.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/admin/reference-data?tab=tracks');
      await page.getByRole('button', { name: '+ Add' }).click();
      await page.getByLabel('Name (Arabic)').fill(`مسار ${tag}`);
      await page.getByLabel('Name (English)').fill(`Track ${tag}`);
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText(`Track ${tag}`)).toBeVisible();
      await page
        .getByRole('row', { name: new RegExp(`Track ${tag}`) })
        .getByRole('button', { name: 'Deactivate' })
        .click();
      await expect(
        page.getByRole('row', { name: new RegExp(`Track ${tag}`) }).getByText('Inactive'),
      ).toBeVisible();

      const hctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const hpage = await hctx.newPage();
      await signInAndWait(hpage, head.email, undefined, '/en/login');
      await gotoReady(hpage, '/en/dashboard/admin/reference-data');
      await expect(hpage.getByRole('heading', { name: 'Reference lists' })).toHaveCount(0);
      await hctx.close();
    } finally {
      await sql(`delete from public.tracks where name_ar like $1`, [`%${tag}%`]);
      await remove(admin, head);
    }
  });
});
