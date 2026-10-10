import { expect, test } from '@playwright/test';
import {
  PASSWORD,
  confirmLink,
  createConfirmedUser,
  deleteUser,
  expectHeaderName,
  gotoReady,
  signInViaUi,
  uniqueEmail,
  waitForMail,
} from './helpers';

// Sprint 03 — TEST-001. Runs against the real local Auth + Mailpit.
const FULL_NAME = 'سارة محمد العتيبي';

for (const lang of ['ar', 'en'] as const) {
  const prefix = lang === 'en' ? '/en' : '';

  test.describe(`[${lang}]`, () => {
    test('there is no sign-up: /register leads to the membership application, login offers no account creation', async ({
      page,
    }) => {
      await page.goto(`${prefix}/register`);
      await expect(page).toHaveURL(new RegExp(`${prefix}/join$`));
      await page.goto(`${prefix}/login`);
      await expect(
        page.getByRole('link', { name: /create a new account|إنشاء حساب جديد/i }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('link', { name: /apply for membership|قدّم طلب العضوية/i }),
      ).toBeVisible();
      // v2 auth layout: the page has no site header and no footer (ADR-014)
      await expect(page.locator('header.sdc-header')).toHaveCount(0);
      await expect(page.locator('footer')).toHaveCount(0);
      await expect(page.getByRole('banner')).toHaveCount(0);
    });

    test('sign in returns to the page I came from', async ({ page }) => {
      const email = uniqueEmail('signin');
      const id = await createConfirmedUser(email);
      try {
        await signInViaUi(
          page,
          email,
          PASSWORD,
          `${prefix}/login?redirect=/events/excel-power-bi-workshop`,
        );
        await expect(page).toHaveURL(new RegExp(`${prefix}/events/excel-power-bi-workshop$`));
      } finally {
        await deleteUser(id);
      }
    });

    test('wrong password shows a localized error and stays on the page', async ({ page }) => {
      const email = uniqueEmail('wrong');
      const id = await createConfirmedUser(email);
      try {
        await signInViaUi(page, email, 'Not-The-Password1!', `${prefix}/login`);
        await expect(
          page.getByText(lang === 'en' ? /Incorrect email or password/ : /غير صحيحة/),
        ).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`${prefix}/login`));
      } finally {
        await deleteUser(id);
      }
    });

    test('protected route without a session redirects to login with the return path', async ({
      page,
    }) => {
      await gotoReady(page, `${prefix}/account/profile`);
      await expect(page).toHaveURL(new RegExp(`${prefix}/login\\?redirect=%2Faccount%2Fprofile`));
    });

    test('a signed-in visitor on /login is redirected away on the server', async ({ page }) => {
      const email = uniqueEmail('already');
      const id = await createConfirmedUser(email);
      try {
        await signInViaUi(page, email, PASSWORD, `${prefix}/login`);
        await expect(page).toHaveURL(new RegExp(`${prefix}/account$`), { timeout: 20_000 });
        await gotoReady(page, `${prefix}/login`);
        await expect(page).toHaveURL(new RegExp(`${prefix}/account$`));
      } finally {
        await deleteUser(id);
      }
    });
  });
}

test.describe('security', () => {
  for (const target of [
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
  ]) {
    test(`open redirect is neutralised: ${target}`, async ({ page, baseURL }) => {
      const email = uniqueEmail('redir');
      const id = await createConfirmedUser(email);
      try {
        await signInViaUi(page, email, PASSWORD, `/login?redirect=${encodeURIComponent(target)}`);
        // A plain user with no safe destination lands on /account, never on the attacker's URL.
        await expect(page).toHaveURL(new RegExp(`^${baseURL}/account$`), { timeout: 20_000 });
        expect(new URL(page.url()).origin).toBe(new URL(baseURL!).origin);
      } finally {
        await deleteUser(id);
      }
    });
  }

  test('password reset gives the same answer for known and unknown e-mails (no oracle)', async ({
    page,
  }) => {
    const known = uniqueEmail('known');
    const id = await createConfirmedUser(known);
    const texts: string[] = [];
    try {
      for (const email of [known, uniqueEmail('unknown')]) {
        await gotoReady(page, '/en/forgot-password');
        await page.locator('input[type="email"]').fill(email);
        await page.locator('button[type="submit"]').click();
        const notice = page.getByText(/If an account exists/);
        await expect(notice).toBeVisible();
        texts.push(await notice.innerText());
      }
      expect(texts[0]).toBe(texts[1]);
    } finally {
      await deleteUser(id);
    }
  });

  test('the e-mail-existence Edge Function no longer exists', async ({ request }) => {
    const res = await request.post(`${process.env.SB_API_URL}/functions/v1/check-email-exists`, {
      data: { email: 'x@example.test' },
      failOnStatusCode: false,
    });
    expect([404, 500, 502, 503]).toContain(res.status());
  });
});

test.describe('password reset flow', () => {
  test('request → e-mail → set new password → sign in with it', async ({ page, baseURL }) => {
    const email = uniqueEmail('reset');
    const id = await createConfirmedUser(email, { locale: 'en' });
    const next = 'N3w!Passw0rd-x';
    try {
      await gotoReady(page, '/en/forgot-password');
      await page.locator('input[type="email"]').fill(email);
      await page.locator('button[type="submit"]').click();
      await expect(page.getByText(/If an account exists/)).toBeVisible();

      const mail = await waitForMail(email, { subject: /Reset|إعادة/ });
      expect(mail.html).toContain('Set a new password');
      await gotoReady(page, confirmLink(mail, baseURL!));
      await expect(page).toHaveURL(/\/en\/reset-password$/);

      const inputs = page.locator('input[type="password"]');
      await inputs.nth(0).fill(next);
      await inputs.nth(1).fill(next);
      await page.locator('button[type="submit"]').click();
      await expect(page.getByText(/Password updated successfully/)).toBeVisible();
      await expect(page).toHaveURL(/\/en\/login$/, { timeout: 15_000 });

      await signInViaUi(page, email, next, '/en/login');
      await expect(page).toHaveURL((u) => u.pathname === '/en/account');
    } finally {
      await deleteUser(id);
    }
  });

  test('an invalid or reused recovery link is explained, not silently accepted', async ({
    page,
    baseURL,
  }) => {
    await gotoReady(
      page,
      `${baseURL}/auth/confirm?token_hash=bogus&type=recovery&next=%2Freset-password`,
    );
    await expect(page).toHaveURL(/forgot-password\?error=LINK_EXPIRED/);
    await expect(page.getByText(/expired|انتهت/)).toBeVisible();
  });
});

test.describe('account area', () => {
  test('edit profile and change password from /account', async ({ page }) => {
    const email = uniqueEmail('acct');
    const id = await createConfirmedUser(email, { locale: 'en' });
    try {
      await signInViaUi(page, email, PASSWORD, '/en/login');
      await expect(page).toHaveURL((u) => u.pathname === '/en/account');

      await gotoReady(page, '/en/account/profile');
      const nameInput = page.getByLabel('Name (Arabic)');
      await nameInput.fill('أحمد علي الغامدي');
      await page.getByLabel('Name (English)').fill('Ahmed Ali Alghamdi');
      await page.getByRole('button', { name: 'Save changes' }).click();
      await expect(page.getByText('Changes saved')).toBeVisible();
      await page.reload();
      await expect(page.getByLabel('Name (Arabic)')).toHaveValue('أحمد علي الغامدي');

      await gotoReady(page, '/en/account/security');
      await page.getByLabel('New password', { exact: true }).fill('weak');
      await page.getByLabel('Confirm password').fill('weak');
      await page.getByRole('button', { name: 'Update password' }).click();
      await expect(page.getByText(/at least 8 characters/i).first()).toBeVisible();

      await page.getByLabel('New password', { exact: true }).fill('Another!Str0ng1');
      await page.getByLabel('Confirm password').fill('Another!Str0ng1');
      await page.getByRole('button', { name: 'Update password' }).click();
      await expect(page.getByText(/Password updated/)).toBeVisible();
    } finally {
      await deleteUser(id);
    }
  });

  test('logging out clears the server session', async ({ page }) => {
    const email = uniqueEmail('logout');
    const id = await createConfirmedUser(email);
    try {
      await signInViaUi(page, email);
      await expect(page).toHaveURL((u) => u.pathname === '/account');
      await gotoReady(page, '/');
      await expectHeaderName(page, /./);
      await page.getByRole('button', { name: /Account menu|قائمة الحساب/ }).click();
      await page.getByRole('button', { name: /Sign out|تسجيل الخروج/ }).click();
      // Wait for the server action to finish before navigating away.
      // The header flips as soon as the client signs out; wait until the server action cleared the cookie.
      await expect
        .poll(async () => (await page.context().cookies()).some((c) => /auth-token/.test(c.name)))
        .toBe(false);
      await expect(page.getByRole('link', { name: /Join us|انضم إلينا/ }).first()).toBeVisible();
      await gotoReady(page, '/account');
      await expect(page).toHaveURL(/\/login\?redirect=%2Faccount/);
    } finally {
      await deleteUser(id);
    }
  });
});
