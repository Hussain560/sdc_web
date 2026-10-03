import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { committeeId, sql } from './db';
import { gotoReady, signInAndWait, waitForMail } from './helpers';
import { persona, remove } from './personas';

// Sprint 10 — REG-006, PUB-003, REG-008: a two-day event from the first session to the certificate PDF,
// against the real local stack (QR token computed from the session secret, like a phone scanning the screen).
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
      `select private.qr_token(qr_secret, floor(extract(epoch from now()))::bigint / 30) as t from public.attendance_sessions where id = $1`,
      [sessionId],
    )
  )[0]!.t;

test.describe('attendance: sessions, check-in, sign-off, certificates', () => {
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
    const other = await persona('committee_head', {
      committeeSlug: 'cybersecurity',
      fullName: 'Attend Other Head',
    });
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
      await gotoReady(page, `/en/dashboard/events/${eventId}/attendance`);
      await expect(page.getByRole('heading', { name: 'Sessions' })).toBeVisible();
      await expect(page.getByText('Scheduled', { exact: true })).toHaveCount(2);
      await page.getByRole('button', { name: 'Open session' }).first().click();
      const dlg = page.getByRole('dialog');
      await expect(dlg).toContainText(/session.s day/);
      await dlg.getByRole('button', { name: 'Open the session' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Session opened' })).toBeVisible();
      await expect(page.getByText('opened late')).toBeVisible();

      const day1 = (
        await sql<{ id: string }>(
          `select s.id from public.attendance_sessions s join public.event_dates d on d.id = s.event_date_id
            where s.event_id = $1 order by d.event_date limit 1`,
          [eventId],
        )
      )[0]!.id;

      // The organizer QR screen draws a code.
      await gotoReady(page, `/en/dashboard/events/${eventId}/attendance/${day1}/qr`);
      await expect(page.getByRole('img', { name: 'QR code for check-in' })).toBeVisible();

      // ------------------------------------------------------------------ participants check in
      const token = await qrToken(day1);
      const pctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const ppage = await pctx.newPage();
      await signInAndWait(ppage, p1.email, undefined, '/en/login');
      await ppage.goto(`/en/events/${slug}/check-in?s=${day1}&t=nope`);
      await expect(ppage.getByRole('heading', { name: /code expired/i })).toBeVisible();
      await ppage.goto(`/en/events/${slug}/check-in?s=${day1}&t=${token}`);
      await expect(ppage.getByRole('heading', { name: 'You are checked in' })).toBeVisible();
      await ppage.goto(`/en/events/${slug}/check-in?s=${day1}&t=${token}`);
      await expect(ppage.getByRole('heading', { name: /already recorded/i })).toBeVisible();
      await ppage.goto(`/en/events/${slug}/check-in`);
      await expect(ppage.getByRole('heading', { name: /already recorded/i })).toBeVisible();

      // Someone who never registered cannot check in.
      const octx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const opage = await octx.newPage();
      await signInAndWait(opage, other.email, undefined, '/en/login');
      await opage.goto(`/en/events/${slug}/check-in?s=${day1}&t=${token}`);
      await expect(
        opage.getByRole('heading', { name: /accepted participants only/i }),
      ).toBeVisible();
      await octx.close();

      // ------------------------------------------------------------------ manual marking, close, finalize day 1
      await gotoReady(page, `/en/dashboard/events/${eventId}/attendance/${day1}`);
      const row2 = page.getByRole('row').filter({ hasText: 'Attendee Two Person' });
      await row2.getByRole('button', { name: 'Mark present' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'marked present' })).toBeVisible();
      await expect(page.getByText(/2 present/)).toBeVisible();
      await page.getByRole('button', { name: 'Close session' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Session closed' })).toBeVisible();
      await page.getByRole('button', { name: 'Finalize session' }).click();
      await expect(page.getByRole('dialog')).toContainText('1 people will be recorded absent');
      await page.getByRole('dialog').getByRole('button', { name: 'Finalize', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Session finalized' })).toBeVisible();
      await expect(page.getByRole('note')).toContainText('finalized');

      // A member cannot correct a finalized session; checking in again is refused.
      await expect(page.getByRole('button', { name: /Correct/ })).toHaveCount(0);
      await ppage.goto(`/en/events/${slug}/check-in?s=${day1}&t=${token}`);
      await expect(
        ppage.getByRole('heading', { name: /already recorded|not open/i }),
      ).toBeVisible();

      // ------------------------------------------------------------------ day 2
      await gotoReady(page, `/en/dashboard/events/${eventId}/attendance`);
      await page.getByRole('button', { name: 'Open session' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Open the session' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Session opened' })).toBeVisible();
      const day2 = (
        await sql<{ id: string }>(
          `select s.id from public.attendance_sessions s join public.event_dates d on d.id = s.event_date_id
            where s.event_id = $1 order by d.event_date desc limit 1`,
          [eventId],
        )
      )[0]!.id;
      await gotoReady(page, `/en/dashboard/events/${eventId}/attendance/${day2}`);
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
      await gotoReady(page, `/en/dashboard/events/${eventId}/attendance`);
      await expect(page.getByRole('button', { name: 'Finalize event attendance' })).toHaveCount(0);
      const hctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const hpage = await hctx.newPage();
      await signInAndWait(hpage, head.email, undefined, '/en/login');

      // Completion stays disabled until attendance is signed off (KFUCS F-36).
      await gotoReady(hpage, `/en/dashboard/events/${eventId}`);
      await expect(hpage.getByRole('button', { name: 'Complete' })).toBeDisabled();

      await gotoReady(hpage, `/en/dashboard/events/${eventId}/attendance`);
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

      // ------------------------------------------------------------------ certificates
      await hpage.getByRole('button', { name: 'Issue certificates' }).click();
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

      // The owner downloads a real PDF; anyone verifies by id; strangers cannot download.
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
      await expect(spage.getByRole('link', { name: 'Download the PDF' })).toHaveCount(0);
      expect((await spage.request.get(`/api/certificates/${certId}/pdf`)).status()).toBe(401);
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
      await remove(head, member, p1, p2, p3, other);
    }
  });

  test('the check-in page sends signed-out visitors to sign in and keeps the code', async ({
    page,
  }) => {
    await page.goto('/en/events/anything/check-in?s=abc&t=xyz');
    await expect(page).toHaveURL(
      /\/en\/login\?redirect=%2Fevents%2Fanything%2Fcheck-in%3Fs%3Dabc%26t%3Dxyz/,
    );
  });
});
