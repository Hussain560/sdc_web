import { expect, test, type Page } from '@playwright/test';
import { sql } from './db';
import { PASSWORD, gotoReady, signInAndWait, uniqueEmail, waitForMail } from './helpers';
import { persona, remove } from './personas';

/**
 * The whole membership lifecycle, end to end, against the real local stack (database, auth, Mailpit):
 * apply (no account) → received mail → a reviewer accepts after the confirmation → acceptance mail with the 7-day
 * activation link → choose a password → "your account is ready" → the five-step set-up → the card → the term ends
 * (daily job) → leadership renews → suspends → the member sees the notice → reinstated → blocked → the blocked notice.
 */
const tag = Math.random().toString(36).slice(2, 7);
const CRON = 'e2e-cron-secret-0123456789';
const local = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 16);
const MEMBER_PASSWORD = 'Str0ng!Passw0rd';

async function runDailyJob(baseURL: string) {
  const res = await fetch(`${baseURL}/api/cron/membership-daily`, {
    headers: { authorization: `Bearer ${CRON}` },
  });
  expect(res.status).toBe(200);
}

async function fillApplication(page: Page, email: string) {
  await page.locator('#field-firstNameAr').fill('نورة');
  await page.locator('#field-lastNameAr').fill('القحطاني');
  await page.locator('#field-firstNameEn').fill('Noura');
  await page.locator('#field-lastNameEn').fill(`Life${tag}`);
  await page.locator('#field-email').fill(email);
  await page.locator('#field-phone').fill('501234567');
  await page.locator('#field-gender').getByText('Female', { exact: true }).click();
  await page.getByRole('button', { name: /^Next/ }).click();
  await page.locator('#field-academicStatus').getByText('Graduate', { exact: true }).click();
  await page.locator('#field-universityId').selectOption({ index: 1 });
  await page.locator('#field-majorId').selectOption({ index: 1 });
  await page.locator('#field-trackId').selectOption({ index: 1 });
  await page.getByRole('button', { name: /^Next/ }).click();
  await page.locator('#field-bioAr').fill('مطوّرة تحب المجتمع');
  await page.getByRole('button', { name: /^Next/ }).click();
}

test.describe.serial('membership lifecycle', () => {
  let leader: Awaited<ReturnType<typeof persona>>;
  const email = uniqueEmail('lifecycle');
  let applicationId = '';
  let memberId = '';

  test.beforeAll(async () => {
    leader = await persona('community_leader', { fullName: 'Lifecycle Leader Person' });
    // Published cycles may never overlap: clear leftovers of earlier runs.
    await sql(`delete from public.membership_applications`);
    await sql(`delete from public.membership_cycles`);
  });

  test.afterAll(async () => {
    await sql(`delete from public.membership_applications where lower(email) = lower($1)`, [email]);
    await sql(`delete from public.members where first_name_en = 'Noura' and last_name_en = $1`, [
      `Life${tag}`,
    ]);
    await sql(`delete from public.membership_cycles where name_ar like $1`, [`%${tag}%`]);
    await sql(`delete from auth.users where lower(email) = lower($1)`, [email]);
    await remove(leader);
  });

  test('apply, be accepted, activate, set up the profile and see the card', async ({
    page,
    browser,
    baseURL,
  }) => {
    test.setTimeout(240_000);

    // 0. The leader opens an intake cycle from the dashboard (this also refreshes the cached public pages).
    const lctx = await browser.newContext({ baseURL: baseURL! });
    const lpage = await lctx.newPage();
    await signInAndWait(lpage, leader.email, undefined, '/en/login');
    await gotoReady(lpage, '/en/dashboard/membership/cycles/new');
    await lpage.locator('#field-nameAr').fill(`دورة الحياة ${tag}`);
    await lpage.locator('#field-opensAt').fill(local(-1));
    await lpage.locator('#field-closesAt').fill(local(10));
    await lpage.getByRole('button', { name: 'Open now' }).click();
    await expect(lpage).toHaveURL(/\/en\/dashboard\/membership\/cycles$/, { timeout: 20_000 });

    // 1. Anyone applies: no account needed.
    await page.goto('/en/join/apply');
    await page.waitForTimeout(5500); // the anti-spam time trap
    await fillApplication(page, email);
    await page.locator('#field-consent input').check();
    await page.getByLabel('I confirm the details are correct and mine.').check();
    await page.getByRole('button', { name: 'Send my application' }).click();
    await expect(page.getByRole('heading', { name: /We received your application/ })).toBeVisible();
    await expect(page.getByText(/SDC-\d{2}-\d{4}/).first()).toBeVisible();

    const received = await waitForMail(email, { subject: /received your application/i });
    expect(received.html).toContain('/join/status/');

    const found = await sql<{ id: string }>(
      `select id from public.membership_applications where lower(email) = lower($1)`,
      [email],
    );
    applicationId = found[0]!.id;

    // 2. A reviewer opens it, claims it and accepts: the confirmation comes first.
    await gotoReady(lpage, `/en/dashboard/membership/applications/${applicationId}`);
    await lpage.getByRole('button', { name: 'Claim this application' }).click();
    await expect(lpage.getByText('You are reviewing this')).toBeVisible();
    await lpage
      .getByRole('button', { name: /^Accept/ })
      .first()
      .click();
    await expect(lpage.getByRole('dialog', { name: /Accept .* application\?/ })).toBeVisible();
    await lpage.getByRole('button', { name: 'Yes, accept' }).click();
    await expect(lpage.getByRole('dialog', { name: /was accepted/ })).toBeVisible();
    await lpage.getByRole('button', { name: 'Stay on this page' }).click();
    await lctx.close();

    // 3. The acceptance mail (held 6 seconds for the undo) carries the 7-day activation link.
    const accepted = await waitForMail(email, {
      subject: /Welcome to the Saudi Developer Community/i,
    });
    const link = /https?:\/\/[^"'\s<]+\/activate\/[0-9a-f]+/.exec(accepted.html)?.[0];
    expect(link, 'the acceptance mail has an activation link').toBeTruthy();
    expect(accepted.text + accepted.html).toMatch(/7 days/i);

    // 4. Opening the link goes to choosing a password: the strength bar and the rules are shown.
    const mctx = await browser.newContext({ baseURL: baseURL! });
    const mpage = await mctx.newPage();
    await mpage.goto(link!);
    await expect(mpage).toHaveURL(/reset-password\?welcome=1/, { timeout: 30_000 });
    await expect(mpage.getByText('Your membership is accepted')).toBeVisible();
    await mpage.locator('input[name=password]').fill(MEMBER_PASSWORD);
    await expect(mpage.getByText('(met)')).toHaveCount(4);
    await mpage.locator('input[name=confirmPassword]').fill(MEMBER_PASSWORD);
    await mpage.getByRole('button', { name: 'Activate my account' }).click();
    await expect(mpage.getByRole('heading', { name: 'Your account is ready' })).toBeVisible();

    // 5. The five-step set-up, then the finishing card.
    await mpage.getByRole('link', { name: /Let’s start/ }).click();
    await expect(mpage).toHaveURL(/\/welcome$/);
    await expect(mpage.getByRole('heading', { name: /Welcome, Noura/ })).toBeVisible();
    await mpage.getByRole('button', { name: /Let’s start/ }).click();
    await expect(mpage.getByRole('heading', { name: 'Is your name correct?' })).toBeVisible();
    await mpage.getByRole('button', { name: /Yes, it’s correct/ }).click();
    await expect(mpage.getByRole('heading', { name: 'Add your photo' })).toBeVisible();
    await mpage.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(mpage.getByRole('heading', { name: 'What are you into?' })).toBeVisible();
    await mpage.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(mpage.getByRole('heading', { name: 'What do visitors see?' })).toBeVisible();
    await mpage.getByRole('button', { name: 'Save and finish' }).click();
    await expect(mpage.getByRole('heading', { name: 'Your card is ready' })).toBeVisible();

    // 6. "My membership": the card with the member number; positions and "my data" are on the same page.
    await mpage.getByRole('link', { name: 'Go to my membership' }).click();
    await expect(mpage).toHaveURL(/\/account\/membership/);
    await expect(mpage.getByRole('group', { name: 'Membership card' }).first()).toBeVisible();
    await expect(
      mpage
        .getByText(/SDC-M-\d{6}/)
        .locator('visible=true')
        .first(),
    ).toBeVisible();
    await expect(mpage.getByRole('heading', { name: 'My data', exact: true })).toBeVisible();
    await mctx.close();

    const m = await sql<{ id: string; status: string; onboarded: boolean }>(
      `select id, status, onboarded_at is not null as onboarded from public.members
        where first_name_en = 'Noura' and last_name_en = $1`,
      [`Life${tag}`],
    );
    expect(m[0]?.status).toBe('active');
    expect(m[0]?.onboarded).toBe(true);
    memberId = m[0]!.id;
  });

  test('the term ends, leadership renews, suspends, reinstates and blocks; the member sees why', async ({
    page,
    browser,
    baseURL,
  }) => {
    test.setTimeout(240_000);

    // The term ended yesterday: the daily job moves the member to "expired".
    await sql(
      `update public.members set term_starts_at = current_date - 60, term_ends_at = current_date - 1 where id = $1`,
      [memberId],
    );
    await runDailyJob(baseURL!);
    const exp = await sql<{ status: string }>(`select status from public.members where id = $1`, [
      memberId,
    ]);
    expect(exp[0]?.status).toBe('expired');

    const lctx = await browser.newContext({ baseURL: baseURL! });
    const lpage = await lctx.newPage();
    await signInAndWait(lpage, leader.email, undefined, '/en/login');

    // Renew.
    await gotoReady(lpage, `/en/dashboard/members/${memberId}`);
    await lpage.getByRole('button', { name: 'Renew', exact: true }).click();
    await lpage
      .getByRole('dialog', { name: 'Renew membership' })
      .getByRole('button', { name: 'Renew', exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (
            await sql<{ status: string }>(`select status from public.members where id = $1`, [
              memberId,
            ])
          )[0]?.status,
      )
      .toBe('active');

    // Suspend with a category and an internal reason.
    await lpage.reload();
    await lpage.getByRole('button', { name: 'Suspend', exact: true }).click();
    const sd = lpage.getByRole('dialog', { name: 'Suspend a membership' });
    await sd.getByLabel('Detailed reason (internal, required)').fill('E2E check');
    await sd.getByRole('button', { name: 'Suspend', exact: true }).click();
    await expect
      .poll(
        async () =>
          (
            await sql<{ status: string }>(`select status from public.members where id = $1`, [
              memberId,
            ])
          )[0]?.status,
      )
      .toBe('suspended');

    // The member signs in and is told, in a notice, that the membership is paused.
    const mctx = await browser.newContext({ baseURL: baseURL! });
    const mpage = await mctx.newPage();
    const row = await sql<{ email: string }>(
      `select p.email from public.members m join public.profiles p on p.id = m.user_id where m.id = $1`,
      [memberId],
    );
    await signInAndWait(mpage, row[0]!.email, MEMBER_PASSWORD, '/en/login');
    await gotoReady(mpage, '/en/account/membership');
    await expect(mpage.getByText(/paused/i).first()).toBeVisible();

    // Reinstate.
    await lpage.reload();
    await lpage.getByRole('button', { name: 'Reinstate', exact: true }).click();
    await lpage
      .getByRole('dialog', { name: 'Reinstate membership' })
      .getByRole('button', { name: 'Reinstate', exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (
            await sql<{ status: string }>(`select status from public.members where id = $1`, [
              memberId,
            ])
          )[0]?.status,
      )
      .toBe('active');

    // Block the account: the person is signed out and the next sign-in ends on the blocked notice.
    await lpage.reload();
    await lpage.getByRole('button', { name: 'More actions' }).click();
    await lpage.getByRole('menuitem', { name: 'Block the account' }).click();
    const bd = lpage.getByRole('dialog', { name: 'Block the account' });
    await bd.getByLabel('Reason (internal, required)').fill('E2E check');
    await bd.getByRole('button', { name: 'Block the account' }).click();
    await expect
      .poll(
        async () =>
          (
            await sql<{ blocked: boolean }>(
              `select p.blocked_at is not null as blocked from public.members m join public.profiles p on p.id = m.user_id where m.id = $1`,
              [memberId],
            )
          )[0]?.blocked,
      )
      .toBe(true);
    await lctx.close();
    await mctx.close();

    const bctx = await browser.newContext({ baseURL: baseURL! });
    const bpage = await bctx.newPage();
    await bpage.goto('/en/login');
    await bpage.locator('input[type=email]').fill(row[0]!.email);
    await bpage.locator('input[type=password]').fill(MEMBER_PASSWORD);
    await bpage.locator('form button[type=submit]').click();
    await expect(bpage).toHaveURL(/notice\/blocked/, { timeout: 30_000 });
    await bctx.close();
    void PASSWORD;
    void page;
  });
});
