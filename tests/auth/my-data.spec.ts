import { expect, test } from '@playwright/test';
import { sql } from './db';
import { gotoReady, signInAndWait } from './helpers';
import { persona, remove } from './personas';

// Sprint 17 follow-up: "My data" shows what the platform holds (including the application answers and the private
// phone), the member's phone is editable on the profile page, and a member with only a committee seat is not told they
// are part of the "leadership".
const tag = Math.random().toString(36).slice(2, 7);

test('my data shows the member record and the application; the profile holds the phone', async ({
  page,
}) => {
  const who = await persona(null, { member: true, fullName: 'Data Example' });
  try {
    await sql(
      `update public.members set last_name_ar = 'التجربة', phone = '+966555000222' where user_id = $1`,
      [who.id],
    );
    // Published cycles may never overlap: clear leftovers (demo data or earlier runs).
    await sql('delete from public.membership_applications');
    await sql('delete from public.membership_cycles');
    const [cycle] = await sql<{ id: string }>(
      `insert into public.membership_cycles (name_ar, opens_at, closes_at, status, questions)
       values ($1, now() - interval '3 days', now() - interval '1 day', 'published',
               '[{"key":"why","type":"text","required":true,"label_ar":"لماذا تريد الانضمام؟","label_en":"Why do you want to join?"}]'::jsonb)
       returning id`,
      [`دورة البيانات ${tag}`],
    );
    await sql(
      `insert into public.membership_applications
         (cycle_id, user_id, status, full_name_ar, phone, academic_status, answers, wants_directory_listing, consent_version)
       values ($1, $2, 'accepted', 'اسم المتقدم', '+966555000333', 'student', '{"why":"لأتعلم مع المجتمع"}'::jsonb, true, 'v1')`,
      [cycle!.id, who.id],
    );

    await signInAndWait(page, who.email, undefined, '/en/login');

    // On screen: the member record with the phone, then the application and the answer that was given.
    await gotoReady(page, '/en/account/membership');
    await expect(page.getByRole('heading', { name: 'Member record' })).toBeVisible();
    await expect(page.getByText('+966555000222').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Membership application/ })).toBeVisible();
    await expect(page.getByText('+966555000333').first()).toBeVisible();
    await expect(page.getByText('Why do you want to join?').first()).toBeVisible();
    await expect(page.getByText('لأتعلم مع المجتمع').first()).toBeVisible();

    // The profile page: the name is locked, the phone is there and can be changed.
    await gotoReady(page, '/en/account/profile');
    await expect(page.getByLabel('First name (Arabic)')).toBeDisabled();
    const contact = page.locator('section[aria-labelledby="ed-contact"]');
    await expect(contact.getByRole('textbox')).toHaveValue('55 500 0222');
    await contact.getByRole('textbox').fill('55 500 0444');
    await contact.getByRole('button', { name: 'Save' }).click();
    await expect
      .poll(async () => {
        const [r] = await sql<{ phone: string }>(
          `select phone from public.members where user_id = $1`,
          [who.id],
        );
        return r?.phone;
      })
      .toBe('+966555000444');

    // The overview was merged into the profile: the account area opens on it, and it has only four tabs.
    await gotoReady(page, '/en/account');
    await expect(page).toHaveURL(new RegExp('/en/account/profile$'));
    const tabs = page.getByRole('navigation', { name: 'Account menu' }).getByRole('link');
    await expect(tabs).toHaveCount(3);
    await expect(tabs.first()).toHaveText('My profile');
  } finally {
    await sql(`delete from public.membership_applications where user_id = $1`, [who.id]);
    await sql(`delete from public.membership_cycles where name_ar like $1`, [`%${tag}%`]);
    await remove(who);
  }
});
