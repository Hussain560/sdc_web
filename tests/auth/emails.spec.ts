import { expect, test } from '@playwright/test';
import { sql } from './db';
import { gotoReady, signInAndWait, waitForMail } from './helpers';
import { persona, remove } from './personas';

// Sprint 09 — NOT-003: the admin e-mail log (state, quota, retry) and the retry path against the real local stack.
const tag = Math.random().toString(36).slice(2, 7);

test.describe('e-mail log', () => {
  test('an admin retries a failed mail; unrepeatable mails are explained; others have no access', async ({
    page,
    browser,
  }) => {
    const admin = await persona('system_admin', { fullName: 'Mail Admin Person' });
    const target = await persona('committee_head', {
      committeeSlug: 'cybersecurity',
      fullName: 'Mail Target Person',
    });
    const member = await persona('committee_member', {
      committeeSlug: 'ai',
      fullName: 'Mail Member Person',
      member: true,
    });
    try {
      const [assignment] = await sql<{ id: string }>(
        `select id from public.role_assignments where user_id = $1 and ends_at is null`,
        [target.id],
      );
      // A failed committee.assigned attempt, as the provider outage would have left it.
      await sql(
        `insert into public.email_logs (template_key, locale, recipient_email, recipient_user_id, entity_type, entity_id, idempotency_key, attempt, status, error_code, error_message)
         values ('committee.assigned', 'en', $1, $2, 'role_assignment', $3, $4, 1, 'failed', 'PROVIDER_ERROR', 'connection refused')`,
        [target.email, target.id, assignment!.id, `failed-${tag}`],
      );
      // A failed claim invite: its one-time secret is gone, so it can only be re-created at the source.
      await sql(
        `insert into public.email_logs (template_key, locale, recipient_email, entity_type, entity_id, idempotency_key, attempt, status, error_code)
         values ('member.claim_invite', 'ar', $1, 'member', $2, $3, 4, 'failed', 'PROVIDER_ERROR')`,
        [`claim-${tag}@example.test`, assignment!.id, `claim-${tag}`],
      );

      await signInAndWait(page, admin.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/admin/emails?group=failed');
      await expect(page.getByRole('progressbar', { name: 'Daily quota used' })).toBeVisible();

      // The failed attempt shows its error and the automatic retry notice.
      const row = page.getByRole('row').filter({ hasText: target.email });
      await expect(row.getByText('Will retry', { exact: true })).toBeVisible();
      await expect(row.getByText(/PROVIDER_ERROR/)).toBeVisible();

      await row.getByRole('button', { name: 'Retry' }).click();
      await expect(
        page.getByRole('status').filter({ hasText: 'The e-mail was sent' }),
      ).toBeVisible();
      const mail = await waitForMail(target.email, { subject: /new position/i });
      expect(mail.html).toContain('/en/dashboard');

      // The same key can never be delivered twice: a second retry has nothing to do.
      const sent = await sql<{ n: string }>(
        `select count(*)::text as n from public.email_logs where template_key = 'committee.assigned' and entity_id = $1 and status = 'sent'`,
        [assignment!.id],
      );
      expect(sent[0]!.n).toBe('1');

      // A claim invite cannot be re-sent: the log explains what to do instead.
      await gotoReady(page, `/en/dashboard/admin/emails?group=failed&q=claim-${tag}`);
      const invite = page.getByRole('row').filter({ hasText: `claim-${tag}@example.test` });
      await expect(invite.getByText('Failed', { exact: true })).toBeVisible();
      await expect(invite.getByText(/no more automatic attempts/)).toBeVisible();
      await invite.getByRole('button', { name: 'Retry' }).click();
      await expect(page.getByRole('alert').filter({ hasText: 'cannot be re-sent' })).toBeVisible();

      // Retry all: confirms the count first.
      await gotoReady(page, '/en/dashboard/admin/emails?group=failed');
      await page.getByRole('button', { name: 'Retry all failed' }).click();
      await expect(page.getByRole('dialog')).toContainText('failed e-mails will be retried');
      await page.getByRole('dialog').getByRole('button', { name: 'Back' }).click();

      // A committee member has no access to the global log.
      const mctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const mpage = await mctx.newPage();
      await signInAndWait(mpage, member.email, undefined, '/en/login');
      await gotoReady(mpage, '/en/dashboard/admin/emails');
      await expect(mpage.getByRole('heading', { name: /don.t have access/ })).toBeVisible();
      await mctx.close();
    } finally {
      await sql(
        `delete from public.email_logs where idempotency_key in ($1, $2) or recipient_email = $3`,
        [`failed-${tag}`, `claim-${tag}`, target.email],
      );
      await remove(admin, target, member);
    }
  });

  test('the retry route needs the shared secret', async ({ request }) => {
    expect((await request.get('/api/cron/email-retry')).status()).toBe(401);
    expect(
      (
        await request.get('/api/cron/email-retry', { headers: { authorization: 'Bearer nope' } })
      ).status(),
    ).toBe(401);
  });
});
