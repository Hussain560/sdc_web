import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { committeeId, sql } from './db';
import { gotoReady, signInAndWait, waitForMail } from './helpers';
import { persona, remove } from './personas';

// Sprints 10 + KFUCS parity: a two-day event from the first session to the certificate PDF through the event tabs
// (Registrations, Attendance, Certificates), a public check-in with the registered e-mail (no sign-in), the QR screen
// with live numbers, against the real local stack (the QR token is computed from the session secret, like a phone).
const tag = Math.random().toString(36).slice(2, 7);
const slug = `att-e2e-${tag}`;

async function wipe() {
  await sql(
    `delete from public.certificates where event_id in (select id from public.events where slug = $1)`,
    [slug],
  );
  await sql(
    `delete from public.event_registrations where event_id in (select id from public.events where slug = $1)`,
    [slug],
  );
  await sql(`delete from public.events where slug = $1`, [slug]);
  await sql(`delete from public.email_logs where entity_type = 'certificate'`);
  await sql(
    `update public.site_settings set value = 'false'::jsonb where key = 'certificates_enabled'`,
  );
}
test.afterAll(wipe);

const qrToken = async (sessionId: string) =>
  (
    await sql<{ t: string }>(
      `select private.qr_token(qr_secret, floor(extract(epoch from now()))::bigint / 120) as t from public.attendance_sessions where id = $1`,
      [sessionId],
    )
  )[0]!.t;

test.describe('attendance: tabs, public check-in, sign-off, certificates', () => {
  test('two days from the first session to the certificate PDF', async ({ page, browser }) => {
    const head = await persona('committee_head', {
      committeeSlug: 'ai',
      fullName: 'Attend Head Person',
    });
    const member = await persona('committee_member', {
      committeeSlug: 'ai',
      fullName: 'Attend Member Person',
      member: true,
    });
    const p1 = await persona(null, { fullName: 'Attendee One Person' });
    const p2 = await persona(null, { fullName: 'Attendee Two Person' });
    const p3 = await persona(null, { fullName: 'Attendee Three Person' });
    try {
      await sql(
        `update public.site_settings set value = 'true'::jsonb where key = 'certificates_enabled'`,
      );
      const [ev] = await sql<{ id: string }>(
        `insert into public.events (slug, committee_id, type, status, title_ar, title_en, schedule_type, start_date, end_date, location_mode, published_at)
         values ($1, $2, 'bootcamp', 'published', $3, $4, 'consecutive_range', private.today_riyadh() - 2, private.today_riyadh() - 1, 'in_person', now())
         returning id`,
        [slug, await committeeId('ai'), `معسكر الحضور ${tag}`, `Attendance Camp ${tag}`],
      );
      const eventId = ev!.id;
      for (const p of [p1, p2, p3]) {
        await sql(
          `insert into public.event_registrations (event_id, user_id, status, full_name_snapshot, email_snapshot)
           values ($1, $2, 'accepted', (select full_name_ar from public.profiles where id = $2), $3)`,
          [eventId, p.id, p.email],
        );
      }

      // ------------------------------------------------------------------ the member opens day 1 (late: confirmation)
      await signInAndWait(page, member.email, undefined, '/en/login');
      await gotoReady(page, `/en/dashboard/events/${eventId}?tab=attendance`);
      // the breadcrumb names the event
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
        `Attendance Camp ${tag}`,
      );
      await expect(page.getByRole('link', { name: /Day 1/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /Day 2/ })).toBeVisible();
      await page.getByRole('button', { name: 'Open session' }).click();
      const dlg = page.getByRole('dialog');
      await expect(dlg).toContainText(/session.s day/);
      await dlg.getByRole('button', { name: 'Open the session' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Session opened' })).toBeVisible();
      await expect(page.getByText('Opened late')).toBeVisible();

      const day1 = (
        await sql<{ id: string }>(
          `select s.id from public.attendance_sessions s join public.event_dates d on d.id = s.event_date_id
            where s.event_id = $1 order by d.event_date limit 1`,
          [eventId],
        )
      )[0]!.id;

      // The QR display draws a code with its countdown, and the live numbers.
      await page.getByRole('tab', { name: 'QR display' }).click();
      await expect(page.getByRole('img', { name: 'QR code for check-in' })).toBeVisible();
      await expect(page.getByText(/refreshes in/)).toBeVisible();
      await expect(page.getByLabel('Live numbers')).toContainText('Checked in');

      // ------------------------------------------------------------------ public check-in (no sign-in)
      const token = await qrToken(day1);
      const actx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const anon = await actx.newPage();
      await anon.goto(`/en/events/${slug}/check-in?s=${day1}&t=nope`);
      await anon.getByLabel('E-mail address').fill(p1.email);
      await anon.getByRole('button', { name: 'Verify and check in' }).click();
      await expect(anon.getByText(/Scanner timeout/)).toBeVisible();

      await anon.goto(`/en/events/${slug}/check-in?s=${day1}&t=${token}`);
      await expect(anon.getByRole('heading', { name: `Attendance Camp ${tag}` })).toBeVisible();
      await anon.getByLabel('E-mail address').fill('nobody@example.test');
      await anon.getByRole('button', { name: 'Verify and check in' }).click();
      await expect(anon.getByText(/No registration found/)).toBeVisible();
      await anon.getByRole('button', { name: 'Try again' }).click();
      await anon.getByLabel('E-mail address').fill(p1.email.toUpperCase());
      await anon.getByRole('button', { name: 'Verify and check in' }).click();
      await expect(anon.getByRole('heading', { name: 'Check-in successful' })).toBeVisible();
      await anon.goto(`/en/events/${slug}/check-in?s=${day1}&t=${token}`);
      await anon.getByLabel('E-mail address').fill(p1.email);
      await anon.getByRole('button', { name: 'Verify and check in' }).click();
      await expect(anon.getByRole('heading', { name: /already recorded/i })).toBeVisible();
      expect((await anon.goto('/en/events/anything/check-in?s=abc&t=xyz'))?.status()).toBe(404);
      await actx.close();

      // The organizer screen follows the check-in live (polled every few seconds).
      await expect(page.getByLabel('Live numbers').getByText('Attendee One Person')).toBeVisible({
        timeout: 20_000,
      });

      // ------------------------------------------------------------------ manual marking, close, finalize day 1
      await page.getByRole('tab', { name: 'Attendance list' }).click();
      const row2 = page.getByRole('row').filter({ hasText: 'Attendee Two Person' });
      await expect(row2).toContainText(p2.email);
      await row2.getByRole('button', { name: 'Mark present' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'marked present' })).toBeVisible();
      await page.getByRole('button', { name: 'Close session' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Session closed' })).toBeVisible();
      await page.getByRole('button', { name: 'Finalize session' }).click();
      await expect(page.getByRole('dialog')).toContainText('1 people will be recorded absent');
      await page.getByRole('dialog').getByRole('button', { name: 'Finalize', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Session finalized' })).toBeVisible();
      await expect(page.getByRole('note')).toContainText('finalized');
      await expect(page.getByRole('button', { name: /Correct/ })).toHaveCount(0);

      // ------------------------------------------------------------------ day 2
      await gotoReady(page, `/en/dashboard/events/${eventId}?tab=attendance`);
      await page.getByRole('button', { name: 'Open session' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Open the session' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Session opened' })).toBeVisible();
      for (const name of ['Attendee One Person', 'Attendee Two Person']) {
        await page
          .getByRole('row')
          .filter({ hasText: name })
          .getByRole('button', { name: 'Mark present' })
          .click();
        await expect(
          page.getByRole('row').filter({ hasText: name }).getByText('Present', { exact: true }),
        ).toBeVisible();
      }
      await page.getByRole('button', { name: 'Close session' }).click();
      await expect(page.getByRole('button', { name: 'Finalize session' })).toBeVisible();
      await page.getByRole('button', { name: 'Finalize session' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Finalize', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Session finalized' })).toBeVisible();

      // ------------------------------------------------------------------ the event sign-off needs the head
      await gotoReady(page, `/en/dashboard/events/${eventId}?tab=attendance`);
      await expect(page.getByRole('button', { name: 'Finalize event attendance' })).toHaveCount(0);
      // a member has no Certificates tab
      await expect(page.getByRole('link', { name: 'Certificates' })).toHaveCount(0);

      const hctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const hpage = await hctx.newPage();
      await signInAndWait(hpage, head.email, undefined, '/en/login');

      // Completion stays disabled until attendance is signed off (KFUCS F-36).
      await gotoReady(hpage, `/en/dashboard/events/${eventId}`);
      await expect(hpage.getByRole('button', { name: 'Complete' })).toBeDisabled();

      await gotoReady(hpage, `/en/dashboard/events/${eventId}?tab=attendance`);
      await hpage.getByRole('button', { name: 'Finalize event attendance' }).click();
      await hpage
        .getByRole('dialog')
        .getByRole('button', { name: 'Finalize', exact: true })
        .click();
      await expect(
        hpage.getByRole('status').filter({ hasText: 'Attendance signed off' }),
      ).toBeVisible();
      const pct = await sql<{
        email_snapshot: string;
        attendance_percent: number;
        attendance_result: string;
      }>(
        `select email_snapshot, attendance_percent, attendance_result from public.event_registrations where event_id = $1`,
        [eventId],
      );
      const by = Object.fromEntries(pct.map((r) => [r.email_snapshot, r]));
      expect(by[p1.email]!.attendance_percent).toBe(100);
      expect(by[p2.email]!.attendance_percent).toBe(100);
      expect(by[p3.email]!.attendance_percent).toBe(0);
      expect(by[p3.email]!.attendance_result).toBe('absent');

      // ------------------------------------------------------------------ registrations tab: table, modal, percentage
      await gotoReady(hpage, `/en/dashboard/events/${eventId}?tab=registrations`);
      await expect(hpage.getByRole('row').filter({ hasText: 'Attendee One Person' })).toContainText(
        '100%',
      );
      await hpage.getByRole('button', { name: 'Attendee One Person' }).click();
      const info = hpage.getByRole('dialog').filter({ hasText: 'Registered at' });
      await expect(info).toContainText(p1.email);
      await expect(info).toContainText('100%');
      await expect(info.getByRole('button', { name: 'Cancel registration' })).toBeVisible();
      await info.getByRole('button', { name: 'Close' }).click();

      // ------------------------------------------------------------------ certificates tab
      await hpage.getByRole('link', { name: 'Certificates' }).click();
      await expect(hpage.getByRole('row').filter({ hasText: 'Attendee One Person' })).toContainText(
        'Eligible',
      );
      await expect(
        hpage.getByRole('row').filter({ hasText: 'Attendee Three Person' }),
      ).toContainText('Absent');
      await hpage.getByRole('button', { name: /Issue and send certificates \(2\)/ }).click();
      await hpage.getByRole('dialog').getByRole('button', { name: 'Issue and send' }).click();
      await expect(
        hpage.getByRole('status').filter({ hasText: '2 certificates issued' }),
      ).toBeVisible();
      const mail = await waitForMail(p1.email, { subject: /certificate/i });
      expect(mail.html).toContain('/certificates/');
      await expect
        .poll(
          async () =>
            (
              await sql<{ n: string }>(
                `select count(*)::text as n from public.certificates where event_id = $1 and delivery_status = 'sent' and pdf_path is not null`,
                [eventId],
              )
            )[0]!.n,
          { timeout: 30_000 },
        )
        .toBe('2');

      const certId = (
        await sql<{ id: string }>(
          `select c.id from public.certificates c join public.event_registrations r on r.id = c.registration_id where r.user_id = $1`,
          [p1.id],
        )
      )[0]!.id;

      // The owner downloads a real PDF; anyone holding the link verifies and downloads.
      const pctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const ppage = await pctx.newPage();
      await signInAndWait(ppage, p1.email, undefined, '/en/login');
      const pdf = await ppage.request.get(`/api/certificates/${certId}/pdf`);
      expect(pdf.status()).toBe(200);
      expect(pdf.headers()['content-type']).toContain('application/pdf');
      const bytes = await pdf.body();
      expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
      mkdirSync('test-results', { recursive: true });
      writeFileSync('test-results/certificate-sample.pdf', bytes);

      await ppage.goto(`/en/certificates/${certId}`);
      await expect(ppage.getByText('Valid certificate of attendance')).toBeVisible();
      await expect(ppage.getByRole('main').getByText('Attendee One Person')).toBeVisible();
      await expect(ppage.getByRole('link', { name: 'Download the PDF' })).toBeVisible();
      const stranger = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const spage = await stranger.newPage();
      await spage.goto(`/en/certificates/${certId}`);
      await expect(spage.getByRole('main').getByText('Attendee One Person')).toBeVisible();
      // participants need no account: anyone holding the e-mailed link downloads the PDF
      await expect(spage.getByRole('link', { name: 'Download the PDF' })).toBeVisible();
      expect((await spage.request.get(`/api/certificates/${certId}/pdf`)).status()).toBe(200);
      expect(
        (await spage.goto('/en/certificates/00000000-0000-0000-0000-000000000099'))?.status(),
      ).toBe(404);
      await stranger.close();

      // My registrations show the percentage and the certificate.
      await gotoReady(ppage, '/en/account/registrations');
      await expect(ppage.getByText('Your attendance: 100%')).toBeVisible();
      await expect(ppage.getByRole('link', { name: 'Download PDF' })).toBeVisible();

      // Completion is now allowed.
      await gotoReady(hpage, `/en/dashboard/events/${eventId}`);
      await expect(hpage.getByRole('button', { name: 'Complete' })).toBeEnabled();
      await hctx.close();
      await pctx.close();
    } finally {
      await wipe();
      await remove(head, member, p1, p2, p3);
    }
  });
});
