import { expect, test } from '@playwright/test';
import { committeeId, sql } from './db';
import { gotoReady, signInAndWait, uniqueEmail, waitForMail } from './helpers';
import { persona, remove } from './personas';

// Registration without an account (KFUCS parity): the modal on the event page, the confirmation, the organizer's
// view, the duplicate refusal and the throttle, against the real local stack.
const tag = Math.random().toString(36).slice(2, 7);
const slug = `e2e-guest-${tag}`;

test.afterAll(async () => {
  await sql(`delete from public.email_logs where idempotency_key like $1`, [`%${tag}%`]);
  await sql(
    `delete from public.event_registrations where event_id in (select id from public.events where slug = $1)`,
    [slug],
  );
  await sql(`delete from public.events where slug = $1`, [slug]);
});

test('a visitor registers from the modal without an account', async ({ page, browser }) => {
  const head = await persona('committee_head', {
    committeeSlug: 'ai',
    fullName: 'Guest Head Person',
  });
  try {
    const committee = await committeeId('ai');
    const [ev] = await sql<{ id: string }>(
      `insert into public.events (slug, committee_id, type, status, title_ar, title_en, schedule_type, start_date,
         start_time, end_time, location_mode, seats, requires_approval, published_at)
       values ($1, $2, 'workshop', 'published', $3, $4, 'single_day',
         ((now() at time zone 'Asia/Riyadh')::date + 30), '18:00', '20:00', 'online', 5, false, now())
       returning id`,
      [slug, committee, `ورشة الزوار ${tag}`, `Guest Workshop ${tag}`],
    );
    const eventId = ev!.id;
    const email = uniqueEmail('guest');

    // The visitor is signed out: the button opens the form, not the login page.
    await page.goto(`/en/events/${slug}`);
    await page
      .getByRole('button', { name: /register/i })
      .first()
      .click();
    const dlg = page.getByRole('dialog', { name: /Register for Guest Workshop/ });
    await expect(dlg).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/en/events/${slug}$`));

    // Empty submission: inline errors, nothing is sent.
    await dlg.getByRole('button', { name: 'Register' }).click();
    await expect(dlg.locator('#g-name-error')).toBeVisible();
    await expect(dlg.locator('#g-email-error')).toBeVisible();
    await expect(dlg.locator('#g-phone-error')).toBeVisible();

    // A form sent in under 1.5 seconds is refused (scripted submissions), the person may retry.
    await dlg.getByLabel('Full name').fill('Guest Visitor Person');
    await dlg.getByLabel('E-mail').fill(email);
    await dlg.getByLabel(/Mobile/).fill('+966 50 123 4567');
    await dlg.getByLabel(/University/).fill('King Saud University');
    await page.waitForTimeout(1800);
    // consent is required: without it the form refuses
    await dlg.getByRole('button', { name: 'Register' }).click();
    await expect(dlg.locator('#g-consent-error')).toBeVisible();
    await dlg.getByRole('checkbox').check({ force: true });
    await dlg.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByRole('heading', { name: /You.re registered/ })).toBeVisible();
    await page.getByRole('button', { name: 'Done' }).click();

    // The button now reads "Registered" and the e-mail arrives.
    await expect(page.getByText("You're registered").first()).toBeVisible();
    const mail = await waitForMail(email, { subject: /registration|registered|in/i });
    expect(mail.html).toContain(`Guest Workshop ${tag}`);

    // The row exists without an account and carries the answers.
    const [row] = await sql<{
      user_id: string | null;
      status: string;
      answers: Record<string, string>;
    }>(
      `select user_id, status, answers from public.event_registrations where event_id = $1 and email_snapshot = $2`,
      [eventId, email],
    );
    expect(row!.user_id).toBeNull();
    expect(row!.status).toBe('accepted');
    expect(row!.answers.phone).toBe('+966 50 123 4567');
    const [consent] = await sql<{ consent_version: string | null; consent_at: string | null }>(
      `select consent_version, consent_at from public.event_registrations where event_id = $1 and email_snapshot = $2`,
      [eventId, email],
    );
    expect(consent!.consent_version).toMatch(/draft/);
    expect(consent!.consent_at).not.toBeNull();

    // Same e-mail again (device memory cleared): refused, not duplicated.
    await page.evaluate(() => localStorage.clear());
    await page.goto(`/en/events/${slug}`);
    await page
      .getByRole('button', { name: /register/i })
      .first()
      .click();
    const dlg2 = page.getByRole('dialog', { name: /Register for Guest Workshop/ });
    await dlg2.getByLabel('Full name').fill('Guest Visitor Person');
    await dlg2.getByLabel('E-mail').fill(email.toUpperCase());
    await dlg2.getByLabel(/Mobile/).fill('0501234567');
    await dlg2.getByRole('checkbox').check({ force: true });
    await page.waitForTimeout(1800);
    await dlg2.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByRole('heading', { name: /already registered/ })).toBeVisible();
    const [count] = await sql<{ n: string }>(
      `select count(*)::text as n from public.event_registrations where event_id = $1`,
      [eventId],
    );
    expect(count!.n).toBe('1');

    // The organizer sees the guest in the Registrations tab with the details.
    const hctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
    const hpage = await hctx.newPage();
    await signInAndWait(hpage, head.email, undefined, '/en/login');
    await gotoReady(hpage, `/en/dashboard/events/${eventId}?tab=registrations`);
    await hpage.getByRole('button', { name: 'Guest Visitor Person' }).click();
    const info = hpage.getByRole('dialog').filter({ hasText: 'Registered at' });
    await expect(info).toContainText('Guest');
    await expect(info).toContainText('+966 50 123 4567');
    await expect(info).toContainText('King Saud University');
    await hctx.close();
  } finally {
    await remove(head);
  }
});
