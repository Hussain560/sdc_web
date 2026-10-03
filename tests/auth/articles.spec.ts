import { expect, test } from '@playwright/test';
import { sql } from './db';
import { gotoReady, signInAndWait, waitForMail } from './helpers';
import { persona, remove } from './personas';

// Sprint 09 — ART-001..003: write → submit → review → publish → public pages → archive, against the real local stack.
const tag = Math.random().toString(36).slice(2, 7);
const titleAr = `ثريد تجريبي ${tag}`;
const titleEn = `E2E Thread ${tag}`;

async function wipe() {
  await sql(`delete from public.articles where title_ar like $1`, [`%${tag}%`]);
  await sql(`delete from public.tags where slug like $1`, [`e2e-tag-${tag}%`]);
  await sql(`delete from public.email_logs where entity_type = 'article'`);
}
test.afterAll(wipe);

test.describe('articles: lifecycle and public pages', () => {
  test('a member writes, the head reviews and publishes, readers see it, archive hides it', async ({
    page,
    browser,
  }) => {
    const member = await persona('committee_member', {
      committeeSlug: 'ai',
      fullName: 'Thread Member Person',
      member: true,
    });
    const head = await persona('committee_head', {
      committeeSlug: 'ai',
      fullName: 'Thread Head Person',
    });
    const otherHead = await persona('committee_head', {
      committeeSlug: 'cybersecurity',
      fullName: 'Thread Other Head',
    });
    const plain = await persona(null, { fullName: 'Thread Plain Person' });
    try {
      // ---------------------------------------------------------------- the member writes and saves
      await signInAndWait(page, member.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/articles/new');
      await expect(page.getByLabel('Committee', { exact: true })).toBeDisabled();
      await page.getByLabel('Title (Arabic) *').fill(titleAr);
      await page.getByLabel('Excerpt (Arabic)').fill('مقتطف قصير');
      await page
        .getByLabel('Body (Markdown), Arabic *')
        .fill(
          '## مقدمة\n\nنص **مهم** مع <script>window.__pwned = 1</script> وروابط [الموقع](https://example.com).',
        );
      // The preview uses the public renderer: the script never reaches the page.
      await expect(page.getByRole('heading', { name: 'مقدمة', level: 2 })).toBeVisible();
      await expect(page.locator('script', { hasText: '__pwned' })).toHaveCount(0);

      await page.getByRole('tab', { name: 'English' }).click();
      await page.getByLabel('Title (English)').fill(titleEn);
      await page.getByLabel('Body (Markdown), English').fill('Hello **world**.');
      await page.getByLabel('New tag in English').fill(`e2e tag ${tag}`);
      await page.getByLabel('New tag in Arabic').fill('وسم تجريبي');
      await page.getByRole('button', { name: 'Add', exact: true }).click();

      await page.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
      await expect(page).toHaveURL(/\/en\/dashboard\/articles\/[0-9a-f-]{36}/);
      const id = page.url().match(/articles\/([0-9a-f-]{36})/)![1]!;

      // Reading time and byline are computed / defaulted by the database.
      const saved = await sql<{ status: string; reading_minutes: number; authors: string }>(
        `select a.status, a.reading_minutes, (select count(*)::text from public.article_authors where article_id = a.id) as authors
           from public.articles a where a.id = $1`,
        [id],
      );
      expect(saved[0]!.status).toBe('draft');
      expect(saved[0]!.reading_minutes).toBe(1);
      expect(saved[0]!.authors).toBe('1');

      // ---------------------------------------------------------------- submit for review
      await page.getByRole('button', { name: 'Submit for review' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'sent for review' })).toBeVisible();
      await expect(page).toHaveURL(/\/en\/dashboard\/articles$/);
      await expect(page.getByText(titleEn).first()).toBeVisible();

      // The committee head is told it is waiting (the author is not).
      const mail = await waitForMail(head.email, { subject: /waiting for your review/i });
      expect(mail.html).toContain(`/en/dashboard/articles/${id}`);

      // A member cannot publish (no button) and a plain user has no articles area.
      await gotoReady(page, `/en/dashboard/articles/${id}`);
      await expect(page.getByRole('button', { name: 'Publish', exact: true })).toHaveCount(0);
      const pctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const ppage = await pctx.newPage();
      await signInAndWait(ppage, plain.email, undefined, '/en/login');
      await gotoReady(ppage, '/en/dashboard/articles');
      await expect(ppage.getByRole('heading', { name: /don.t have access/ })).toBeVisible();
      await pctx.close();

      // The head of another committee gets a 404, not a hint that the article exists.
      const octx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const opage = await octx.newPage();
      await signInAndWait(opage, otherHead.email, undefined, '/en/login');
      await opage.goto(`/en/dashboard/articles/${id}`);
      // The branded 404 (it may stream with a 200 status because the route has a loading skeleton).
      await expect(opage.locator('.sdc-404-number')).toBeVisible();
      await octx.close();

      // ---------------------------------------------------------------- the head reviews
      const hctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const hpage = await hctx.newPage();
      await signInAndWait(hpage, head.email, undefined, '/en/login');
      await gotoReady(hpage, '/en/dashboard/articles');
      await expect(hpage.getByRole('link', { name: /In review/ })).toBeVisible();
      await hpage.getByRole('link', { name: titleEn }).first().click();
      await expect(hpage.getByRole('heading', { name: titleAr, level: 2 })).toBeVisible();
      await expect(hpage.getByRole('heading', { name: 'مقدمة', level: 2 })).toBeVisible();

      await hpage.getByRole('button', { name: 'Request changes' }).click();
      const dialog = hpage.getByRole('dialog');
      await dialog.getByLabel('Notes *').fill('short');
      await dialog.getByRole('button', { name: 'Send notes' }).click();
      await expect(
        hpage.getByRole('alert').filter({ hasText: 'at least 10 characters' }),
      ).toBeVisible();
      await dialog.getByLabel('Notes *').fill('Please add a code example and sources');
      await dialog.getByRole('button', { name: 'Send notes' }).click();
      await expect(hpage.getByRole('status').filter({ hasText: 'Notes sent' })).toBeVisible();

      // The author reads the note and resubmits.
      await gotoReady(page, `/en/dashboard/articles/${id}`);
      await expect(
        page.getByRole('note').getByText(/Please add a code example and sources/),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Submit for review' }).click();
      await expect(page).toHaveURL(/\/en\/dashboard\/articles$/);

      // ---------------------------------------------------------------- publish
      await gotoReady(hpage, `/en/dashboard/articles/${id}`);
      await hpage.getByRole('button', { name: 'Publish', exact: true }).click();
      await expect(
        hpage.getByRole('status').filter({ hasText: 'Article published' }),
      ).toBeVisible();

      const slug = (
        await sql<{ slug: string }>(`select slug from public.articles where id = $1`, [id])
      )[0]!.slug;
      expect(slug).toContain('e2e-thread');

      // Readers: list, detail and the home block, in both languages.
      await page.goto('/articles');
      await expect(page.getByText(titleAr).first()).toBeVisible();
      await page.goto('/en/articles');
      await expect(page.getByText(titleEn).first()).toBeVisible();
      await page.goto(`/en/articles/${slug}`);
      await expect(page.getByRole('heading', { name: titleEn, level: 1 })).toBeVisible();
      await expect(page.getByText('Hello')).toBeVisible();
      await page.goto('/');
      await expect(page.getByText(titleAr).first()).toBeVisible();

      // The English page of an article without an English body shows the Arabic one with a notice.
      await sql(`update public.articles set body_en = null where id = $1`, [id]);
      await page.goto(`/en/articles/${slug}`);
      await expect(page.getByText('Available in Arabic only')).toBeVisible();
      await sql(`update public.articles set body_en = 'Hello **world**.' where id = $1`, [id]);

      // ---------------------------------------------------------------- archive hides it, restore brings it back
      await gotoReady(hpage, `/en/dashboard/articles/${id}`);
      await hpage.getByRole('button', { name: 'Archive' }).click();
      await hpage.getByRole('dialog').getByRole('button', { name: 'Archive' }).click();
      await expect(hpage.getByRole('status').filter({ hasText: 'archived' })).toBeVisible();
      const gone = await page.goto(`/en/articles/${slug}`);
      expect(gone?.status()).toBe(404);

      await gotoReady(hpage, `/en/dashboard/articles/${id}`);
      await hpage.getByRole('button', { name: 'Restore' }).click();
      await expect(hpage.getByRole('status').filter({ hasText: 'restored' })).toBeVisible();
      const back = await page.goto(`/en/articles/${slug}`);
      expect(back?.status()).toBe(200);
      await hctx.close();
    } finally {
      await wipe();
      await remove(member, head, otherHead, plain);
    }
  });

  test('the six old numeric URLs answer 301 to readable slugs', async ({ request }) => {
    for (const [legacy, slug] of [
      [1, 'prompt-engineering'],
      [2, 'voice2face'],
      [3, 'recommendation-systems'],
      [6, 'ai-sentiment-analysis'],
    ] as const) {
      const res = await request.get(`/articles/${legacy}`, { maxRedirects: 0 });
      expect([301, 308]).toContain(res.status());
      expect(res.headers()['location']).toContain(`/articles/${slug}`);
    }
    const en = await request.get('/en/articles/4', { maxRedirects: 0 });
    expect(en.headers()['location']).toContain('/en/articles/chinese-and-english-applications');
    expect((await request.get('/articles/99', { maxRedirects: 0 })).status()).toBe(404);
  });
});
