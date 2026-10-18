import { expect, test } from '@playwright/test';
import { sql } from './db';
import { gotoReady, signInAndWait } from './helpers';
import { persona, remove } from './personas';

// Sprint 17 (MEM-013, RDS-034): a member fills the profile section by section, the completeness meter follows, and the
// public page shows exactly what they chose: never an e-mail or a phone number.
test('a member builds a profile; the public page shows only what they chose', async ({
  page,
  request,
}) => {
  const who = await persona(null, { member: true, fullName: 'Editor Example' });
  try {
    await sql(
      `update public.members set last_name_ar = 'التجربة', phone = '+966555000111', is_directory_visible = false where user_id = $1`,
      [who.id],
    );
    await signInAndWait(page, who.email, undefined, '/en/login');
    await gotoReady(page, '/en/account/profile');
    // The name is shown but locked: only leadership changes it.
    await expect(page.getByLabel('First name (Arabic)')).toBeDisabled();
    await expect(page.getByLabel('Last name (English)')).toBeDisabled();
    await expect(page.getByText(/You cannot change your own name/)).toBeVisible();
    const meter = page.getByRole('meter', { name: 'Profile completeness' });
    await expect(meter).toHaveAttribute('aria-valuenow', '0');

    // Headline and about, saved together (two checks of five).
    await page.getByLabel('Headline (English)').fill('Front-end developer');
    await page.getByLabel('Headline (Arabic)').fill('مطوّر واجهات');
    await page.getByLabel('About (English)').fill('I build simple interfaces.');
    await page
      .locator('section[aria-labelledby="ed-about"]')
      .getByRole('button', { name: 'Save' })
      .click();
    await expect(page.getByText('Saved.', { exact: true })).toBeVisible();
    await expect(meter).toHaveAttribute('aria-valuenow', '40');

    // Three skills, then a link.
    const skills = page.locator('section[aria-labelledby="ed-skills"]');
    for (const name of ['TypeScript', 'React', 'Figma']) {
      await skills.getByRole('button', { name, exact: true }).click();
    }
    await skills.getByRole('button', { name: 'Save' }).click();
    await expect(meter).toHaveAttribute('aria-valuenow', '60');

    const links = page.locator('section[aria-labelledby="ed-links"]');
    await links.getByLabel('GitHub').fill('http://insecure.example');
    await links.getByRole('button', { name: 'Save' }).click();
    await expect(links.getByText('The link must start with https://')).toBeVisible();
    await links.getByLabel('GitHub').fill('https://github.com/example');
    await links.getByRole('button', { name: 'Save' }).click();
    await expect(meter).toHaveAttribute('aria-valuenow', '80');

    // Listed: the public page shows the headline and skills, and no contact details anywhere.
    await page.getByText('Show my profile in the public member directory').click();
    const visibility = page.locator('section[aria-labelledby="ed-visibility"]');
    // Each field is its own consent: the headline and the skills are shown, the about text is not.
    await visibility.getByText('Headline', { exact: true }).click();
    await visibility.getByText('Skills', { exact: true }).click();
    await visibility.getByRole('button', { name: 'Save' }).click();
    await expect
      .poll(async () => {
        const [r] = await sql<{ v: boolean }>(
          `select is_directory_visible as v from public.members where user_id = $1`,
          [who.id],
        );
        return r?.v;
      })
      .toBe(true);
    const [row] = await sql<{ id: string }>(`select id from public.members where user_id = $1`, [
      who.id,
    ]);
    const res = await request.get(`/en/members/${row!.id}`);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain('Front-end developer');
    expect(html).toContain('TypeScript');
    expect(html).not.toContain('I build simple interfaces.');
    expect(html).not.toContain(who.email);
    expect(html).not.toContain('555000111');

    // Turning the directory off makes the page a 404.
    await sql(`update public.members set is_directory_visible = false where id = $1`, [row!.id]);
    expect((await request.get(`/en/members/${row!.id}`)).status()).toBe(404);
  } finally {
    await remove(who);
  }
});
