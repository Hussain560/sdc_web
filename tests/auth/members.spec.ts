import { expect, test } from '@playwright/test';
import { sql } from './db';
import { gotoReady, signInAndWait, waitForMail } from './helpers';
import { persona, remove } from './personas';

// Sprint 08 — TEST: review → decision e-mails → members → profile/directory → claim flow, on the real local stack.
const tag = Math.random().toString(36).slice(2, 7);

async function wipe() {
  await sql(
    `delete from public.members where application_id in (select id from public.membership_applications where cycle_id in (select id from public.membership_cycles where name_ar like $1))`,
    [`%${tag}%`],
  );
  await sql(
    `delete from public.membership_applications where cycle_id in (select id from public.membership_cycles where name_ar like $1)`,
    [`%${tag}%`],
  );
  await sql(`delete from public.membership_cycles where name_ar like $1`, [`%${tag}%`]);
}

test.beforeAll(async () => {
  await sql(`delete from public.membership_applications`);
  await sql(`delete from public.membership_cycles`);
});
test.afterAll(wipe);

test.describe('review and decisions', () => {
  test('bulk accept creates members, e-mails them, and a member manages their profile and visibility', async ({
    page,
    browser,
  }) => {
    const leader = await persona('community_leader', { fullName: 'Review Leader Person' });
    const head = await persona('committee_head', {
      committeeSlug: 'ai',
      fullName: 'Review Head Person',
    });
    const a = await persona(null, { fullName: 'Review Applicant One' });
    const b = await persona(null, { fullName: 'Review Applicant Two' });
    try {
      const cycle = await sql<{ id: string }>(
        `insert into public.membership_cycles (name_ar, opens_at, closes_at, status)
         values ($1, now() - interval '3 days', now() - interval '1 day', 'published') returning id`,
        [`دورة المراجعة ${tag}`],
      );
      for (const [who, name, visible] of [
        [a, 'متقدم أول', true],
        [b, 'متقدم ثان', false],
      ] as const) {
        await sql(
          `insert into public.membership_applications (cycle_id, user_id, full_name_ar, academic_status, consent_version, wants_directory_listing, bio_ar)
           values ($1, $2, $3, 'student', 'v1', $4, 'نبذة المتقدم')`,
          [cycle[0]!.id, who.id, `${name} ${tag}`, visible],
        );
      }

      // A committee head cannot review.
      await signInAndWait(page, head.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/membership/applications');
      await expect(page.getByRole('heading', { name: 'Membership applications' })).toHaveCount(0);
      await page.context().clearCookies();

      // The leader accepts both in one go.
      await signInAndWait(page, leader.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/membership/applications');
      await page.getByRole('checkbox', { name: 'Select all' }).check();
      await page.getByRole('button', { name: 'Accept' }).first().click();
      await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
      await expect(page.getByText('Decision applied to 2.')).toBeVisible();

      const welcome = await waitForMail(a.email, {
        subject: /Welcome to the Saudi Developer Community/i,
      });
      expect(welcome.html).toContain('/account/member-profile');
      const rows = await sql<{ n: string }>(
        `select count(*)::text as n from public.members where application_id is not null and user_id in ($1, $2)`,
        [a.id, b.id],
      );
      expect(rows[0]!.n).toBe('2');

      // Only the applicant who opted in is listed publicly.
      const listed = await sql<{ n: string }>(
        `select count(*)::text as n from public.member_directory where last_name like '%' || $1`,
        [tag],
      );
      expect(listed[0]!.n).toBe('1');

      // The member edits the profile: hide, then show again.
      const mctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const mpage = await mctx.newPage();
      await signInAndWait(mpage, a.email, undefined, '/en/login');
      await gotoReady(mpage, '/en/account/member-profile');
      await mpage.getByText('Show my profile in the public member directory').click();
      await mpage.getByLabel('Bio (Arabic)').fill('نبذة معدلة');
      await mpage.getByRole('button', { name: 'Save' }).click();
      await expect(mpage.getByText('Your profile was saved.')).toBeVisible();
      const hidden = await sql<{ n: string }>(
        `select count(*)::text as n from public.member_directory where last_name like '%' || $1`,
        [tag],
      );
      expect(hidden[0]!.n).toBe('0');
      await mctx.close();

      // Leadership suspends a member with a reason.
      await gotoReady(page, '/en/dashboard/members');
      const row = page
        .getByRole('row', { name: new RegExp(`متقدم أول ${tag}|Review Applicant`) })
        .first();
      await expect(row).toBeVisible();
    } finally {
      await wipe();
      await remove(leader, head, a, b);
    }
  });

  test('a reviewer cannot decide their own application', async ({ page }) => {
    const leader = await persona('community_leader', { fullName: 'Self Leader Person' });
    try {
      const cycle = await sql<{ id: string }>(
        `insert into public.membership_cycles (name_ar, opens_at, closes_at, status)
         values ($1, now() - interval '3 days', now() - interval '1 day', 'published') returning id`,
        [`دورة ذاتية ${tag}`],
      );
      await sql(
        `insert into public.membership_applications (cycle_id, user_id, full_name_ar, academic_status, consent_version)
         values ($1, $2, $3, 'student', 'v1')`,
        [cycle[0]!.id, leader.id, `القائد ${tag}`],
      );
      await signInAndWait(page, leader.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/membership/applications');
      await page
        .getByRole('row', { name: new RegExp(tag) })
        .getByRole('button', { name: 'Accept' })
        .click();
      await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
      await expect(page.getByText(/can't decide your own application/)).toBeVisible();
    } finally {
      await wipe();
      await remove(leader);
    }
  });
});

test.describe('legacy claim flow', () => {
  test('leadership invites, the legacy member claims once with the right e-mail', async ({
    page,
    browser,
  }) => {
    const leader = await persona('community_leader', { fullName: 'Claim Leader Person' });
    const legacy = await persona(null, { fullName: 'Claim Legacy Person' });
    const wrong = await persona(null, { fullName: 'Claim Wrong Person' });
    let memberId = '';
    try {
      await signInAndWait(page, leader.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/members?unclaimed=1');
      await page.getByRole('button', { name: 'Claim invite' }).first().click();
      const dialog = page.getByRole('dialog');
      await dialog.getByLabel('E-mail').fill(legacy.email);
      await dialog.getByRole('button', { name: 'Confirm' }).click();
      await expect(dialog).toBeHidden();

      const invited = await sql<{ member_id: string }>(
        `select member_id from public.member_claim_tokens where email = $1`,
        [legacy.email.toLowerCase()],
      );
      memberId = invited[0]!.member_id;
      const mail = await waitForMail(legacy.email, {
        subject: /استعد ملفك|Claim your SDC member profile/i,
      });
      const link = /href="([^"]*\/claim\/[0-9a-f]{64})"/.exec(mail.html)?.[1];
      expect(link).toBeTruthy();
      const path = new URL(link!).pathname;

      // Signed out → login with return; the wrong account is told to use the invited e-mail.
      const wctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const wpage = await wctx.newPage();
      await signInAndWait(wpage, wrong.email, undefined, '/en/login');
      await gotoReady(wpage, `/en${path}`);
      await expect(
        wpage.getByText('Sign in with the e-mail that received the invite.'),
      ).toBeVisible();
      await wctx.close();

      const lctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const lpage = await lctx.newPage();
      await lpage.goto(`/en${path}`);
      await expect(lpage).toHaveURL(/\/en\/login/);
      await signInAndWait(lpage, legacy.email, undefined, '/en/login');
      await gotoReady(lpage, `/en${path}`);
      await expect(lpage.getByRole('heading', { name: 'Is this your profile?' })).toBeVisible();
      await lpage.getByRole('button', { name: 'Yes, this is my profile' }).click();
      await expect(lpage.getByText('Your profile is linked to your account')).toBeVisible();

      const linked = await sql<{ user_id: string }>(
        `select user_id from public.members where id = $1`,
        [memberId],
      );
      expect(linked[0]!.user_id).toBe(legacy.id);

      // The link works once.
      await gotoReady(lpage, `/en${path}`);
      await expect(lpage.getByText(/invalid or was already used|already linked/)).toBeVisible();
      await lctx.close();
    } finally {
      await sql(
        `update public.members set user_id = null, legacy_claim_email = null where id = $1`,
        [memberId],
      );
      await sql(`delete from public.member_claim_tokens where member_id = $1`, [memberId]);
      await remove(leader, legacy, wrong);
    }
  });
});
