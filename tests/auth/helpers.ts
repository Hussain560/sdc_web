import { expect, type Page } from '@playwright/test';

const API = () => process.env.SB_API_URL!;
const SERVICE = () => process.env.SB_SERVICE_ROLE_KEY!;
const MAILPIT = () => process.env.SB_MAILPIT_URL!;

export const PASSWORD = 'Str0ng!Passw0rd';

let counter = 0;
export const uniqueEmail = (prefix = 'user') =>
  `${prefix}.${Date.now().toString(36)}${counter++}@example.test`;

const adminHeaders = () => ({
  apikey: SERVICE(),
  Authorization: `Bearer ${SERVICE()}`,
  'Content-Type': 'application/json',
});

/** Creates an already-confirmed account (bypasses the e-mail step). Returns the user id. */
export async function createConfirmedUser(
  email: string,
  opts: { fullName?: string; password?: string; locale?: 'ar' | 'en' } = {},
) {
  const res = await fetch(`${API()}/auth/v1/admin/users`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({
      email,
      password: opts.password ?? PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: opts.fullName ?? 'مستخدم تجريبي كامل',
        locale: opts.locale ?? 'ar',
      },
    }),
  });
  if (!res.ok) throw new Error(`createConfirmedUser failed: ${res.status} ${await res.text()}`);
  return ((await res.json()) as { id: string }).id;
}

export async function deleteUser(id: string) {
  await fetch(`${API()}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: adminHeaders() });
}

export type Mail = { id: string; subject: string; html: string; text: string };

/** Waits for the newest e-mail sent to `to` (Mailpit API). */
export async function waitForMail(
  to: string,
  { subject }: { subject?: RegExp } = {},
): Promise<Mail> {
  for (let i = 0; i < 40; i++) {
    const list = (await (
      await fetch(`${MAILPIT()}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`)
    ).json()) as { messages?: Array<{ ID: string; Subject: string }> };
    const hit = list.messages?.find((m) => !subject || subject.test(m.Subject));
    if (hit) {
      const full = (await (await fetch(`${MAILPIT()}/api/v1/message/${hit.ID}`)).json()) as {
        HTML: string;
        Text: string;
      };
      return { id: hit.ID, subject: hit.Subject, html: full.HTML, text: full.Text };
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No e-mail for ${to} arrived in time`);
}

/** First /auth/confirm link in an e-mail, as an absolute URL on the app under test. */
export function confirmLink(mail: Mail, baseURL: string): string {
  const m = /href="([^"]*\/auth\/confirm[^"]*)"/.exec(mail.html);
  if (!m?.[1]) throw new Error(`No confirm link in mail:\n${mail.html}`);
  const url = new URL(m[1].replace(/&amp;/g, '&'));
  return `${baseURL}${url.pathname}${url.search}`;
}

export async function signInViaUi(page: Page, email: string, password = PASSWORD, path = '/login') {
  await gotoReady(page, path);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

export async function expectHeaderName(page: Page, name: string | RegExp) {
  await expect(page.locator('header.sdc-header')).toContainText(name, { timeout: 15_000 });
}

/** page.goto + wait until React has hydrated any form on the page (dev server compiles lazily). */
export async function gotoReady(page: Page, url: string) {
  await page.goto(url);
  await page.waitForFunction(() => {
    const form = document.querySelector('form');
    return !form || Object.keys(form).some((k) => k.startsWith('__reactProps$'));
  });
}

/** Signs in through the UI and waits until the app has left /login (the Server Action finished). */
export async function signInAndWait(
  page: Page,
  email: string,
  password = PASSWORD,
  path = '/login',
) {
  await signInViaUi(page, email, password, path);
  await page.waitForURL((u) => !/\/login/.test(u.pathname), { timeout: 30_000 });
}
