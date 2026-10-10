import { expect, test, type Page } from '@playwright/test';
import { sql } from './db';
import {
  PASSWORD,
  confirmLink,
  gotoReady,
  signInAndWait,
  signInViaUi,
  uniqueEmail,
  waitForMail,
} from './helpers';
import { persona, remove } from './personas';

// Intake cycle scheduling → /join states → apply WITHOUT an account → accept creates the account and e-mails the
// activation link → the new member sets a password and signs in, against the real local stack.
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

async function fillApplication(page: Page, email: string) {
  await page.locator('#field-fullNameAr').fill(`متقدم ${tag}`);
  await page.locator('#field-email').fill(email);
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
  test('anyone applies without an account; acceptance creates the account and sends the activation link', async ({
    page,
    browser,
    baseURL,
  }) => {
    test.setTimeout(120_000); // two five-second form waits, two accounts and a full activation
    const leader = await persona('community_leader', { fullName: 'Intake Leader Person' });
    const head = await persona('committee_head', {
      committeeSlug: 'ai',
      fullName: 'Intake Head Person',
    });
    const email = uniqueEmail('applicant');
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
      await lpage.locator('#field-opensAt').fill(local(-1));
      await lpage.locator('#field-closesAt').fill(local(10));
      await lpage.getByRole('button', { name: '+ Question' }).click();
      await lpage.getByLabel('Question (Arabic) *').fill('لماذا تريد الانضمام؟');
      await lpage.getByLabel('Question (English)').fill('Why do you want to join?');
      await lpage.getByLabel('Required').check();
      await lpage.getByRole('button', { name: 'Open now' }).click();
      await expect(lpage).toHaveURL(/\/en\/dashboard\/membership\/cycles$/, { timeout: 20_000 });

      // A visitor sees the form at once: no sign-in, no sign-up.
      await page.goto('/en/join');
      await expect(page.getByText(/You do not need an account to apply/)).toBeVisible();
      await expect(
        page.getByRole('link', { name: /sign in to apply|create account/i }),
      ).toHaveCount(0);
      await gotoReady(page, '/en/join');
      // Validation: step 1 needs a name and a valid e-mail.
      await page.locator('#field-fullNameAr').fill('');
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(page.getByRole('alert').first()).toBeVisible();
      await fillApplication(page, email);
      await page.locator('#field-consent').check();
      await page.waitForTimeout(5200); // the form refuses submissions faster than five seconds
      await page.getByRole('button', { name: 'Submit application' }).click();
      await expect(page.getByText('We received your application')).toBeVisible({ timeout: 20_000 });

      // No mail on submission: the applicant hears from us when the application is decided.
      const [app] = await sql<{ user_id: string | null; email: string }>(
        `select user_id, email from public.membership_applications where email = $1`,
        [email],
      );
      expect(app!.user_id).toBeNull();

      // The same e-mail cannot apply twice in the cycle.
      await page.goto('/en/join');
      await fillApplication(page, email);
      await page.locator('#field-consent').check();
      await page.waitForTimeout(5200);
      await page.getByRole('button', { name: 'Submit application' }).click();
      await expect(page.getByText(/already received an application/)).toBeVisible();

      // The leader accepts: the account is created and the e-mail carries the activation link.
      await gotoReady(lpage, '/en/dashboard/membership/applications');
      await lpage.getByRole('checkbox', { name: 'Select all' }).check();
      await lpage.getByRole('button', { name: 'Accept' }).first().click();
      await lpage.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
      await expect(lpage.getByText('Decision applied to 1.')).toBeVisible();
      const accepted = await waitForMail(email, {
        subject: /Welcome to the Saudi Developer Community/i,
      });
      expect(accepted.html).toContain('type=recovery');
      expect(accepted.html).toContain('Activate your account');
      const [member] = await sql<{ n: string }>(
        `select count(*)::text as n from public.members m join public.profiles p on p.id = m.user_id where lower(p.email) = $1`,
        [email],
      );
      expect(member!.n).toBe('1');

      // The new member opens the link, chooses a password and signs in.
      const mctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const mpage = await mctx.newPage();
      await mpage.goto(confirmLink(accepted, 'http://127.0.0.1:3300'));
      await expect(mpage).toHaveURL(/\/reset-password\?welcome=1/);
      await expect(
        mpage.getByRole('heading', { name: 'Choose a password for your account' }),
      ).toBeVisible();
      await mpage.locator('input[type="password"]').nth(0).fill(PASSWORD);
      await mpage.locator('input[type="password"]').nth(1).fill(PASSWORD);
      await mpage.locator('button[type="submit"]').click();
      await expect(mpage).toHaveURL(/\/en\/login/, { timeout: 15_000 });
      await signInViaUi(mpage, email, PASSWORD, '/en/login');
      await mpage.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 30_000 });
      await mctx.close();

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
      await sql(
        `delete from public.members where user_id in (select id from public.profiles where lower(email) = $1)`,
        [email],
      );
      await sql(`delete from auth.users where lower(email) = $1`, [email]);
      await remove(leader, head);
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
