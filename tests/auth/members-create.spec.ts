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

// Leadership adds a member from /dashboard/members; the member gets the activation e-mail, sets a password and
// signs in. Founders can add too; a committee head cannot even see the button.
test('a leader adds a member who activates the account from the e-mail', async ({
  page,
  browser,
}) => {
  const leader = await persona('community_leader', { fullName: 'Add Member Leader' });
  const head = await persona('committee_head', {
    committeeSlug: 'ai',
    fullName: 'Add Member Head',
  });
  const email = uniqueEmail('addmember');
  try {
    await signInAndWait(page, leader.email, undefined, '/en/login');
    await gotoReady(page, '/en/dashboard/members');
    await page.getByRole('button', { name: 'Add member', exact: true }).click();
    const dlg = page.getByRole('dialog', { name: 'Add a member' });

    // validation first
    await dlg.getByRole('button', { name: 'Add member', exact: true }).click();
    await expect(dlg.getByText('Enter the full name.')).toBeVisible();
    await expect(dlg.getByText('Enter a valid e-mail address.')).toBeVisible();

    await dlg.getByLabel('Name in Arabic *').fill('عضو أضافته القيادة');
    await dlg.getByLabel('Name in English').fill('Added By Leader');
    await dlg.getByLabel('E-mail *').fill(email);
    await dlg.getByText('Student', { exact: true }).click();
    await dlg.getByRole('button', { name: 'Add member', exact: true }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'activation link was e-mailed' }),
    ).toBeVisible();

    const [row] = await sql<{ n: string }>(
      `select count(*)::text as n from public.members m join public.profiles p on p.id = m.user_id
        where lower(p.email) = $1 and m.joined_via = 'manual' and m.status = 'active'`,
      [email],
    );
    expect(row!.n).toBe('1');

    // adding the same e-mail again is refused
    await page.getByRole('button', { name: 'Add member', exact: true }).click();
    const again = page.getByRole('dialog', { name: 'Add a member' });
    await again.getByLabel('Name in Arabic *').fill('عضو أضافته القيادة');
    await again.getByLabel('E-mail *').fill(email);
    await again.getByText('Student', { exact: true }).click();
    await again.getByRole('button', { name: 'Add member', exact: true }).click();
    await expect(page.getByText('already belongs to a member').first()).toBeVisible();
    await again.getByRole('button', { name: 'Cancel' }).click();

    // the e-mail carries the activation link
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

    // a committee head has no button (and no page)
    const hctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
    const hpage = await hctx.newPage();
    await signInAndWait(hpage, head.email, undefined, '/en/login');
    await gotoReady(hpage, '/en/dashboard/members');
    await expect(hpage.getByRole('button', { name: 'Add member', exact: true })).toHaveCount(0);
    await hctx.close();
  } finally {
    await sql(
      `delete from public.members where user_id in (select id from public.profiles where lower(email) = $1)`,
      [email],
    );
    await sql(`delete from auth.users where lower(email) = $1`, [email]);
    await sql(`delete from public.email_logs where recipient_email = $1`, [email]);
    await remove(leader, head);
  }
});
