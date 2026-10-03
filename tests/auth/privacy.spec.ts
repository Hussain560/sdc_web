import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { committeeId, sql } from './db';
import { gotoReady, signInAndWait } from './helpers';
import { persona, remove } from './personas';

// SEC-003: the notice, the data export, a deletion request handled by an administrator (anonymized + account gone).
test('the privacy notice is public in both languages and linked from the footer', async ({
  page,
}) => {
  await page.goto('/en/privacy');
  await expect(page.getByRole('heading', { name: 'Privacy notice', level: 1 })).toBeVisible();
  await expect(page.getByText('What we collect')).toBeVisible();
  await expect(page.getByText(/draft awaiting legal review/)).toBeVisible();
  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: 'سياسة الخصوصية', level: 1 })).toBeVisible();
  await page.goto('/en');
  await expect(page.getByRole('link', { name: 'Privacy notice' })).toBeVisible();
});

test('a member downloads their data and an administrator completes their deletion request', async ({
  page,
  browser,
}) => {
  const admin = await persona('system_admin', { fullName: 'Privacy Admin Person' });
  const subject = await persona(null, { fullName: 'Privacy Subject Person', member: true });
  const slug = `priv-${Math.random().toString(36).slice(2, 7)}`;
  try {
    const [ev] = await sql<{ id: string }>(
      `insert into public.events (slug, committee_id, type, status, title_ar, title_en, schedule_type, start_date, end_date, location_mode, published_at)
       values ($1, $2, 'workshop', 'published', 'فعالية خصوصية', 'Privacy Event', 'single_day', current_date + 30, current_date + 30, 'online', now()) returning id`,
      [slug, await committeeId('ai')],
    );
    await sql(
      `insert into public.event_registrations (event_id, user_id, status, full_name_snapshot, email_snapshot)
       values ($1, $2, 'accepted', 'Privacy Subject Person', $3)`,
      [ev!.id, subject.id, subject.email],
    );

    // the member downloads the JSON
    await signInAndWait(page, subject.email, undefined, '/en/login');
    await gotoReady(page, '/en/account/privacy');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download' }).click(),
    ]);
    const file = JSON.parse(readFileSync((await download.path())!, 'utf-8')) as {
      profile: { email: string };
      registrations: unknown[];
    };
    expect(file.profile.email).toBe(subject.email.toLowerCase());
    expect(file.registrations.length).toBe(1);

    // and asks for deletion (a second request is refused)
    await page.getByRole('button', { name: 'Request account deletion' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Send request' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'deletion request was sent' }),
    ).toBeVisible();
    await expect(page.getByText('A deletion request is waiting')).toBeVisible();

    // the administrator completes it
    const actx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
    const apage = await actx.newPage();
    await signInAndWait(apage, admin.email, undefined, '/en/login');
    await gotoReady(apage, '/en/dashboard/admin/privacy');
    const row = apage.getByRole('row').filter({ hasText: subject.email });
    await row.getByRole('button', { name: 'Complete deletion' }).click();
    await apage.getByRole('dialog').getByRole('button', { name: 'Complete deletion' }).click();
    await expect(apage.getByRole('status').filter({ hasText: 'Request completed' })).toBeVisible();
    await actx.close();

    const [reg] = await sql<{ full_name_snapshot: string; user_id: string | null }>(
      `select full_name_snapshot, user_id from public.event_registrations where event_id = $1`,
      [ev!.id],
    );
    expect(reg!.full_name_snapshot).toBe('Anonymized');
    expect(reg!.user_id).toBeNull();
    const [acct] = await sql<{ n: string }>(
      `select count(*)::text as n from auth.users where id = $1`,
      [subject.id],
    );
    expect(acct!.n).toBe('0');
  } finally {
    await sql(
      `delete from public.event_registrations where event_id in (select id from public.events where slug = $1)`,
      [slug],
    );
    await sql(`delete from public.events where slug = $1`, [slug]);
    await sql(`delete from public.data_requests where email = $1`, [subject.email]);
    await remove(admin);
    await sql(`delete from public.members where user_id = $1`, [subject.id]);
  }
});
