import { expect, test, type Page } from '@playwright/test';
import { committeeId, sql } from './db';
import { gotoReady, signInAndWait } from './helpers';
import { persona, remove } from './personas';

// Sprint 05 — TEST-003: the KFUCS-style event wizard and lifecycle against the real local stack.
const tag = Math.random().toString(36).slice(2, 7);

async function cleanupEvents() {
  await sql(`delete from public.events where title_ar like $1 or slug like $2`, [
    `%${tag}%`,
    `%${tag}%`,
  ]);
}
test.afterAll(cleanupEvents);

/** Walks the wizard from step 1 to step 4 with valid data. */
async function fillWizard(page: Page, titleEn: string, opts: { groupLink?: string } = {}) {
  await page.getByLabel('Title (Arabic)').fill(`ورشة اختبار ${tag}`);
  await page.getByLabel('Title (English)').fill(titleEn);
  await page.getByRole('button', { name: 'Next' }).click();

  await page.locator('#field-startDate').fill('2027-03-10');
  await page.locator('#field-startTime').fill('18:00');
  await page.locator('#field-endTime').fill('20:00');
  if (opts.groupLink !== '')
    await page
      .locator('#field-groupLink')
      .fill(opts.groupLink ?? 'https://chat.example.test/group');
  await page.getByRole('button', { name: 'Next' }).click();

  await page.locator('#field-goals-first').fill('بناء تطبيق ويب كامل');
  await page.getByRole('button', { name: 'Next' }).click();
}

test.describe('wizard', () => {
  test('a head creates, submits; the leader reviews, requests changes, and approves', async ({
    page,
    browser,
  }) => {
    const head = await persona('committee_head', {
      committeeSlug: 'ai',
      fullName: 'Wizard Head Person',
    });
    const leader = await persona('community_leader', { fullName: 'Wizard Leader Person' });
    try {
      await signInAndWait(page, head.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/events/new');
      // A single committee is pre-selected and read-only.
      await expect(page.getByLabel('Organizing committee *')).toBeDisabled();
      await expect(page.getByLabel('Organizing committee *')).not.toHaveValue('');

      await fillWizard(page, `Wizard Test ${tag}`);
      // Step 4: the final button stays disabled until the confirmation is ticked.
      const submit = page.getByRole('button', { name: 'Submit for review' });
      await expect(submit).toBeDisabled();
      await page.locator('#field-confirmed').check();
      await submit.click();

      await expect(page).toHaveURL(/\/en\/dashboard\/events\/[0-9a-f-]{36}$/, { timeout: 20_000 });
      const eventUrl = new URL(page.url()).pathname;
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Pending review');

      // Leader: request changes with a too-short note, then a proper one.
      const lctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const lpage = await lctx.newPage();
      await signInAndWait(lpage, leader.email, undefined, '/en/login');
      await gotoReady(lpage, eventUrl);
      await lpage.getByRole('button', { name: 'Request changes' }).first().click();
      const dialog = lpage.getByRole('dialog');
      await dialog.getByLabel('Notes *').fill('short');
      await dialog.getByRole('button', { name: 'Send notes' }).click();
      await expect(
        lpage.getByRole('alert').filter({ hasText: 'at least 10 characters' }),
      ).toBeVisible();
      await dialog.getByLabel('Notes *').fill('Please add the prerequisites');
      await dialog.getByRole('button', { name: 'Send notes' }).click();
      await expect(lpage.getByRole('heading', { level: 1 })).toContainText('Changes requested');
      await expect(lpage.getByText('Please add the prerequisites').first()).toBeVisible();

      // Head sees the note, edits (the wizard shows it) and resubmits.
      await gotoReady(page, `${eventUrl}/edit`);
      await expect(page.getByText('Reviewer notes:').first()).toBeVisible();
      for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next' }).click();
      await page.locator('#field-confirmed').check();
      await page.getByRole('button', { name: 'Submit for review' }).click();
      await expect(page).toHaveURL(new RegExp(`${eventUrl}$`), { timeout: 20_000 });
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Pending review');

      // Leader approves → published.
      await gotoReady(lpage, eventUrl);
      await lpage.getByRole('button', { name: 'Approve & publish' }).click();
      await expect(lpage.getByRole('heading', { level: 1 })).toContainText('Published', {
        timeout: 20_000,
      });
      // Complete is blocked until the event has ended, with the reason.
      const complete = lpage.getByRole('button', { name: 'Complete' });
      await expect(complete).toBeDisabled();
      await expect(complete).toHaveAttribute('title', /after the event ends/i);

      // History lists the whole journey with the reviewer's note.
      await gotoReady(lpage, `${eventUrl}?tab=history`);
      await expect(
        lpage.getByRole('row').filter({ hasText: 'Please add the prerequisites' }),
      ).toContainText('Please add the prerequisites');
      await expect(lpage.getByRole('row', { name: /Approved and published/ })).toBeVisible();

      // Cancel needs a reason.
      await lpage.getByRole('button', { name: 'Cancel event' }).first().click();
      const cancel = lpage.getByRole('dialog');
      await cancel.getByRole('button', { name: 'Cancel event' }).click(); // empty reason: refused by the browser
      await expect(cancel).toBeVisible();
      await cancel.getByLabel('Reason *').fill('Speaker unavailable');
      await cancel.getByRole('button', { name: 'Cancel event' }).click();
      await expect(lpage.getByRole('heading', { level: 1 })).toContainText('Cancelled', {
        timeout: 20_000,
      });
      await expect(lpage.getByText('Speaker unavailable').first()).toBeVisible();
      await lctx.close();
    } finally {
      await remove(head, leader);
    }
  });

  test('validation: a required field blocks Next, shows the error and focuses the field', async ({
    page,
  }) => {
    const head = await persona('committee_head', { committeeSlug: 'ai' });
    try {
      await signInAndWait(page, head.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/events/new');
      await page.getByLabel('Title (Arabic)').fill(`ورشة ${tag}`);
      await page.getByRole('button', { name: 'Next' }).click();
      await page.getByRole('button', { name: 'Next' }).click(); // no date, no group link
      await expect(
        page.getByRole('alert').filter({ hasText: 'start date is required' }).first(),
      ).toBeVisible();
      await expect(page.locator('#field-startDate')).toBeFocused();
      await expect(page.getByText('Step 2 of 4', { exact: true })).toBeVisible();
    } finally {
      await remove(head);
    }
  });

  test('a refresh restores the wizard step and values (and can be discarded)', async ({ page }) => {
    const head = await persona('committee_head', { committeeSlug: 'ai' });
    try {
      await signInAndWait(page, head.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/events/new');
      await page.getByLabel('Title (Arabic)').fill(`ورشة الاستعادة ${tag}`);
      await page.getByRole('button', { name: 'Next' }).click();
      await page.locator('#field-startDate').fill('2027-05-01');

      await page.reload();
      await expect(page.getByText('We restored your last unsaved edit.')).toBeVisible();
      await expect(page.getByText('Step 2 of 4', { exact: true })).toBeVisible();
      await expect(page.locator('#field-startDate')).toHaveValue('2027-05-01');

      await page.getByRole('button', { name: 'Discard' }).click();
      await expect(page.getByText('Step 1 of 4', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Title (Arabic)')).toHaveValue('');
    } finally {
      await remove(head);
    }
  });

  test('a committee member can only save drafts', async ({ page }) => {
    const member = await persona('committee_member', { committeeSlug: 'ai' });
    try {
      await signInAndWait(page, member.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/events/new');
      await fillWizard(page, `Member Draft ${tag}`);
      await expect(page.getByRole('button', { name: 'Submit for review' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Approve/ })).toHaveCount(0);
      await expect(page.getByText('The committee head will submit it for review.')).toBeVisible();
      await page.getByRole('button', { name: 'Save draft' }).click();
      await expect(page).toHaveURL(/\/en\/dashboard\/events\/[0-9a-f-]{36}\/edit(\?saved=1)?$/, {
        timeout: 20_000,
      });
      await expect(page.getByText('Draft saved')).toBeVisible();
    } finally {
      await remove(member);
    }
  });

  test('an approver can publish directly from the wizard (fast-track)', async ({ page }) => {
    const leader = await persona('community_leader');
    try {
      await signInAndWait(page, leader.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/events/new');
      await page.getByLabel('Organizing committee *').selectOption({ label: 'Cybersecurity' });
      await fillWizard(page, `Fast Track ${tag}`);
      await page.locator('#field-confirmed').check();
      await expect(page.getByRole('button', { name: 'Submit for review' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Approve & publish directly' }).click();
      await expect(page).toHaveURL(/\/en\/dashboard\/events\/[0-9a-f-]{36}$/, { timeout: 20_000 });
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Published');
    } finally {
      await remove(leader);
    }
  });

  test('the server refuses a publish without a group link and points at the field', async ({
    page,
  }) => {
    const leader = await persona('community_leader');
    try {
      await signInAndWait(page, leader.email, undefined, '/en/login');
      // Create a draft through the database function path (no group link), then try to publish from the detail page.
      const cid = await committeeId('ai');
      const [row] = await sql<{ id: string }>(
        `insert into public.events (slug, committee_id, type, title_ar, title_en, start_date, location_mode, goals)
         values ($1, $2, 'meetup', $3, 'No Link', '2027-04-01', 'online', '{"ar":["هدف"],"en":[]}') returning id`,
        [`no-link-${tag}`, cid, `بدون رابط ${tag}`],
      );
      await gotoReady(page, `/en/dashboard/events/${row!.id}`);
      await page.getByRole('button', { name: 'Approve & publish' }).click();
      await expect(page.getByRole('alert').filter({ hasText: 'group link' }).first()).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Draft');
    } finally {
      await remove(leader);
    }
  });
});

test.describe('scope and list', () => {
  test("a head of another committee cannot open or edit a committee's event (404)", async ({
    page,
  }) => {
    const headA = await persona('committee_head', { committeeSlug: 'ai' });
    const headB = await persona('committee_head', { committeeSlug: 'cybersecurity' });
    try {
      const cid = await committeeId('ai');
      const [row] = await sql<{ id: string }>(
        `insert into public.events (slug, committee_id, type, title_ar, start_date) values ($1, $2, 'talk', $3, '2027-04-02') returning id`,
        [`scope-${tag}`, cid, `نطاق ${tag}`],
      );
      await signInAndWait(page, headB.email, undefined, '/en/login');
      for (const path of [
        `/en/dashboard/events/${row!.id}`,
        `/en/dashboard/events/${row!.id}/edit`,
      ]) {
        await page.goto(path);
        // The branded 404 (it may stream with a 200 status because the route has a loading skeleton).
        await expect(page.locator('.sdc-404-number')).toBeVisible();
      }
      // …and the list does not even mention it.
      await gotoReady(page, '/en/dashboard/events');
      await expect(page.getByText(`نطاق ${tag}`)).toHaveCount(0);
    } finally {
      await remove(headA, headB);
    }
  });

  test('the events list paginates, counts per status and filters', async ({ page }) => {
    const leader = await persona('community_leader');
    try {
      const cid = await committeeId('ai');
      await sql(
        `insert into public.events (slug, committee_id, type, title_ar, start_date)
         select 'pg-${tag}-' || i, $1, 'workshop', 'فعالية ترقيم ${tag} ' || i, '2027-06-01' from generate_series(1, 23) i`,
        [cid],
      );
      await signInAndWait(page, leader.email, undefined, '/en/login');
      await gotoReady(page, `/en/dashboard/events?q=${encodeURIComponent(`ترقيم ${tag}`)}`);
      await expect(page.getByText('Showing 1–20 of 23').first()).toBeVisible();
      await expect(page.getByRole('row')).toHaveCount(21); // header + 20
      await page.getByRole('link', { name: 'Next page' }).click();
      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByText('Showing 21–23 of 23').first()).toBeVisible();
      await expect(page.getByRole('row')).toHaveCount(4);

      // page size lives in the URL; changing it resets the page
      await page.getByRole('link', { name: '50', exact: true }).click();
      await expect(page.getByText('Showing 1–23 of 23').first()).toBeVisible();

      // status tab with a count; drafts only
      await expect(page.getByRole('link', { name: /Draft/ }).first()).toBeVisible();
      await gotoReady(
        page,
        `/en/dashboard/events?status=published&q=${encodeURIComponent(`ترقيم ${tag}`)}`,
      );
      await expect(page.getByText('No matching events').first()).toBeVisible();
    } finally {
      await remove(leader);
    }
  });

  test('a founder sees the pipeline read-only (no create button)', async ({ page }) => {
    const founder = await persona('founder');
    try {
      await signInAndWait(page, founder.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/events');
      await expect(page.getByText('View only').first()).toBeVisible();
      await expect(page.getByRole('link', { name: '+ New event' })).toHaveCount(0);
      const res = await page.goto('/en/dashboard/events/new');
      expect(res?.status()).toBe(200);
      await expect(
        page.getByRole('alert').filter({ hasText: "don't have access" }).first(),
      ).toBeVisible();
    } finally {
      await remove(founder);
    }
  });
});
