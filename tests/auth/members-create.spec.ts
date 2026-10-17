import { expect, test } from '@playwright/test';
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

// Sprint 17 (MEM-014): leadership adds a member from /dashboard/members in four steps, with the committee position
// in the same operation. The member gets the activation e-mail, sets a password and signs in. A committee head
// cannot even see the button.
test('a leader adds a member with a position who activates the account from the e-mail', async ({
  page,
  browser,
}) => {
  const leader = await persona('community_leader', { fullName: 'Add Member Leader' });
  const head = await persona('committee_head', {
    committeeSlug: 'ai',
    fullName: 'Add Member Head',
  });
  const email = uniqueEmail('addmember');
  const [committee] = await sql<{ name_en: string }>(
    `select name_en from public.committees where slug = 'ai'`,
  );
  try {
    await signInAndWait(page, leader.email, undefined, '/en/login');
    await gotoReady(page, '/en/dashboard/members');
    await page.getByRole('button', { name: 'Add member', exact: true }).click();
    const dlg = page.getByRole('dialog', { name: 'Add a member' });
    await expect(dlg.getByText('Step 1 of 4', { exact: true })).toBeVisible();

    // Step 1: validation first, then the identity in both languages.
    await dlg.getByRole('button', { name: 'Next' }).click();
    await expect(dlg.getByText('Enter the first name in Arabic.')).toBeVisible();
    await expect(dlg.getByText('Enter a valid e-mail address.')).toBeVisible();
    await dlg.getByLabel(/^First name \(Arabic\)/).fill('خالد');
    await dlg.getByLabel(/^Middle name \(Arabic\)/).fill('يوسف');
    await dlg.getByLabel(/^Last name \(Arabic\)/).fill('الهاجري');
    await dlg.getByLabel(/^First name \(English\)/).fill('Added');
    await dlg.getByLabel(/^Middle name \(English\)/).fill('By');
    await dlg.getByLabel(/^Last name \(English\)/).fill('Leader');
    await dlg.getByLabel(/^E-mail/).fill(email);
    await dlg.getByLabel(/^Phone/).fill('559876543');
    await dlg.getByRole('button', { name: 'Next' }).click();

    // Step 2: study.
    await expect(dlg.getByText('Step 2 of 4', { exact: true })).toBeVisible();
    await dlg.getByRole('button', { name: 'Next' }).click();
    await expect(dlg.getByText('Choose the status.')).toBeVisible();
    await dlg.getByText('Student', { exact: true }).click();
    await dlg.getByRole('button', { name: 'Next' }).click();

    // Step 3: the committee and the position, optional but here given.
    await expect(dlg.getByText('Step 3 of 4', { exact: true })).toBeVisible();
    await dlg.getByLabel('Committee', { exact: true }).selectOption({ label: committee!.name_en });
    await dlg.getByText('Committee member', { exact: true }).click();
    await dlg.getByRole('button', { name: 'Next' }).click();

    // Step 4: review, then one call creates everything.
    await expect(dlg.getByText('Step 4 of 4', { exact: true })).toBeVisible();
    await expect(dlg.getByText('Added By Leader', { exact: false }).first()).toBeVisible();
    await expect(dlg.getByText('+966559876543')).toBeVisible();
    await dlg.getByRole('button', { name: 'Add member', exact: true }).click();
    const done = page.getByRole('dialog', {
      name: /Added Leader was added|Added By Leader was added/,
    });
    await expect(done).toBeVisible({ timeout: 20_000 });
    await expect(done.getByText(/activation e-mail was sent to/)).toBeVisible();

    const [row] = await sql<{ n: string; phone: string; full: string; positions: string }>(
      `select count(*)::text as n, max(m.phone) as phone, max(p.full_name_ar) as full,
              (select count(*)::text from public.role_assignments ra
                where ra.user_id = p.id and ra.role_key = 'committee_member') as positions
         from public.members m join public.profiles p on p.id = m.user_id
        where lower(p.email) = $1 and m.joined_via = 'manual' and m.status = 'active'
        group by p.id`,
      [email],
    );
    expect(row!.n).toBe('1');
    expect(row!.phone).toBe('+966559876543');
    expect(row!.full).toBe('خالد يوسف الهاجري');
    expect(row!.positions).toBe('1');

    // Adding the same e-mail again is caught on the first step, before anything is created.
    await done.getByRole('button', { name: 'Add another member' }).click();
    const again = page.getByRole('dialog', { name: 'Add a member' });
    await again.getByLabel(/^First name \(Arabic\)/).fill('عضو');
    await again.getByLabel(/^Last name \(Arabic\)/).fill('مكرر');
    await again.getByLabel(/^First name \(English\)/).fill('Dup');
    await again.getByLabel(/^Last name \(English\)/).fill('Member');
    await again.getByLabel(/^E-mail/).fill(email);
    await again.getByLabel(/^Phone/).focus();
    await expect(again.getByText(/belongs to another member:/)).toBeVisible();
    await again.getByRole('button', { name: 'Next' }).click();
    await expect(again.getByText('Step 1 of 4', { exact: true })).toBeVisible();
    await again.getByRole('button', { name: 'Cancel' }).click();

    // The e-mail carries the activation link.
    const mail = await waitForMail(email, {
      subject: /added to the Saudi Developer Community|أُضيفت عضويتك/i,
    });
    expect(mail.html).toContain('type=recovery');
    const mctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
    const mpage = await mctx.newPage();
    await mpage.goto(confirmLink(mail, 'http://127.0.0.1:3300'));
    await expect(mpage).toHaveURL(/\/reset-password\?welcome=1/);
    await mpage.locator('input[type="password"]').nth(0).fill(PASSWORD);
    await mpage.locator('input[type="password"]').nth(1).fill(PASSWORD);
    await mpage.locator('button[type="submit"]').click();
    await expect(mpage).toHaveURL(/\/en\/login/, { timeout: 15_000 });
    await signInViaUi(mpage, email, PASSWORD, '/en/login');
    await mpage.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 30_000 });
    await mctx.close();

    // A committee head has no button (and no page).
    const hctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
    const hpage = await hctx.newPage();
    await signInAndWait(hpage, head.email, undefined, '/en/login');
    await gotoReady(hpage, '/en/dashboard/members');
    await expect(hpage.getByRole('button', { name: 'Add member', exact: true })).toHaveCount(0);
    await hctx.close();
  } finally {
    await sql(
      `delete from public.role_assignments where user_id in (select id from public.profiles where lower(email) = $1)`,
      [email],
    );
    await sql(
      `delete from public.members where user_id in (select id from public.profiles where lower(email) = $1)`,
      [email],
    );
    await sql(`delete from auth.users where lower(email) = $1`, [email]);
    await sql(`delete from public.email_logs where recipient_email = $1`, [email]);
    await remove(leader, head);
  }
});
