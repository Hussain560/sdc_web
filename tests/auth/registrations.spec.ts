import { expect, test } from '@playwright/test';
import { committeeId, sql } from './db';
import { gotoReady, signInAndWait, waitForMail } from './helpers';
import { persona, remove } from './personas';

// Sprint 06 — TEST-004: public events from the database, registration, review, e-mail, scope and legacy URLs.
const tag = Math.random().toString(36).slice(2, 7);
const slug = `e2e-reg-${tag}`;
const GROUP = `https://chat.example.test/${tag}`;

async function makeEvent(opts: {
  slug: string;
  seats: number | null;
  approval: boolean;
  committee: string;
  autoClose?: boolean;
}) {
  const committee = await committeeId(opts.committee);
  const rows = await sql<{ id: string }>(
    `insert into public.events (slug, committee_id, type, status, title_ar, title_en, schedule_type, start_date,
       start_time, end_time, location_mode, seats, requires_approval, published_at)
     values ($1, $2, 'workshop', 'published', $3, $4, 'single_day',
       ((now() at time zone 'Asia/Riyadh')::date + 30), '18:00', '20:00', 'online', $5, $6, now())
     returning id`,
    [opts.slug, committee, `ورشة ${opts.slug}`, `Workshop ${opts.slug}`, opts.seats, opts.approval],
  );
  const id = rows[0]!.id;
  await sql(`update public.events set display_config = display_config || $2::jsonb where id = $1`, [
    id,
    JSON.stringify({ auto_close_registration: opts.autoClose ?? true }),
  ]);
  await sql(`insert into public.event_private_details (event_id, group_link) values ($1, $2)`, [
    id,
    GROUP,
  ]);
  return id;
}

test.afterAll(async () => {
  await sql(
    `delete from public.email_logs where entity_type = 'registration' or idempotency_key like $1`,
    [`%${tag}%`],
  );
  await sql(
    `delete from public.event_registrations where event_id in (select id from public.events where slug like $1)`,
    [`%${tag}%`],
  );
  await sql(`delete from public.events where slug like $1`, [`%${tag}%`]);
});

test.describe('public pages read the database', () => {
  test('the list shows the migrated events and old numeric URLs redirect to slugs', async ({
    page,
  }) => {
    await page.goto('/en/events');
    await expect(page.getByRole('heading', { name: 'Google AI Studio Workshop' })).toBeVisible();
    await expect(page.getByText('Coming Soon').first()).toBeVisible();

    const res = await page.goto('/en/events/2');
    expect(page.url()).toContain('/en/events/google-ai-studio-workshop');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Google AI Studio Workshop',
    );
    // The e-mail address is shown, the (never captured) phone block is not.
    await expect(page.getByText('Phone')).toHaveCount(0);
  });

  test('an unknown slug answers 404 and /committee moved', async ({ page, request }) => {
    const res = await page.goto('/en/events/does-not-exist');
    expect(res?.status()).toBe(404);
    const moved = await request.get('/committee', { maxRedirects: 0 });
    expect(moved.status()).toBe(308);
    expect(moved.headers().location).toContain('/dashboard/registrations');
  });
});

test.describe('registration', () => {
  test('register → head accepts → the confirmation e-mail carries the group link', async ({
    page,
    browser,
  }) => {
    await makeEvent({ slug, seats: 5, approval: true, committee: 'ai' });
    const head = await persona('committee_head', {
      committeeSlug: 'ai',
      fullName: 'Reg Head Person',
    });
    const user = await persona(null, { fullName: 'Reg Attendee Person' });
    try {
      await signInAndWait(page, user.email, undefined, '/en/login');
      await gotoReady(page, `/en/events/${slug}`);
      await page
        .getByRole('button', { name: /register/i })
        .first()
        .click();
      await page.locator('.sdc-btn-confirm').click();
      await expect(page.locator('.sdc-hero-btn-register')).toBeDisabled();

      // No mail on submission; the first mail is the acceptance below.
      await gotoReady(page, '/en/account/registrations');
      await expect(page.getByText('Pending').first()).toBeVisible();
      await expect(page.getByText('Event group')).toHaveCount(0);

      // Head accepts from the dashboard queue.
      const hctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const hpage = await hctx.newPage();
      await signInAndWait(hpage, head.email, undefined, '/en/login');
      await gotoReady(hpage, '/en/dashboard/registrations?status=pending');
      const row = hpage.getByRole('row', { name: /Reg Attendee Person/ });
      await row.getByRole('button', { name: 'Accept' }).click();
      const confirm = hpage.getByRole('dialog').filter({ hasText: 'Confirm acceptance' });
      await expect(confirm).toContainText('Reg Attendee Person');
      await confirm.getByRole('button', { name: 'Yes, accept' }).click();
      await expect(hpage.getByText('1 registration accepted.')).toBeVisible();

      const confirmed = await waitForMail(user.email, { subject: /You're in/i });
      expect(confirmed.html).toContain(GROUP);

      await gotoReady(page, '/en/account/registrations');
      await expect(page.getByText('Accepted').first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Event group' })).toHaveAttribute('href', GROUP);
      await hctx.close();
    } finally {
      await remove(head, user);
    }
  });

  test("a head cannot see other committees' registrations; a full event refuses the extra seat", async ({
    page,
  }) => {
    const slugFull = `e2e-full-${tag}`;
    const eventId = await makeEvent({
      slug: slugFull,
      seats: 1,
      approval: false,
      committee: 'cybersecurity',
      autoClose: false,
    });
    const a = await persona(null, { fullName: 'First Seat Person' });
    const b = await persona(null, { fullName: 'Second Seat Person' });
    const headAi = await persona('committee_head', {
      committeeSlug: 'ai',
      fullName: 'Head Ai Person',
    });
    try {
      await signInAndWait(page, a.email, undefined, '/en/login');
      await gotoReady(page, `/en/events/${slugFull}`);
      await page
        .getByRole('button', { name: /register/i })
        .first()
        .click();
      await page.locator('.sdc-btn-confirm').click();
      await expect(page.locator('.sdc-hero-btn-register')).toBeDisabled();
      const rows = await sql<{ status: string }>(
        `select status from public.event_registrations where event_id = $1`,
        [eventId],
      );
      expect(rows.map((r) => r.status)).toEqual(['accepted']);

      await page.context().clearCookies();
      await signInAndWait(page, b.email, undefined, '/en/login');
      await gotoReady(page, `/en/events/${slugFull}`);
      // Auto-close is off here, so the database itself answers EVENT_FULL.
      await page
        .getByRole('button', { name: /register/i })
        .first()
        .click();
      await page.locator('.sdc-btn-confirm').click();
      await expect(page.getByRole('alert')).toBeVisible();

      await page.context().clearCookies();
      await signInAndWait(page, headAi.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/registrations');
      await expect(page.getByText('First Seat Person')).toHaveCount(0);
    } finally {
      await remove(a, b, headAi);
    }
  });
});
