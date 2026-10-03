import { expect, test, type Page } from '@playwright/test';
import { grant, onlyAdmins, removeAssignments, sql } from './db';
import {
  createConfirmedUser,
  deleteUser,
  expectHeaderName,
  gotoReady,
  signInAndWait,
  uniqueEmail,
} from './helpers';

// Sprint 04 — TEST-002: personas, sidebars, guards and term handling against the real local stack.
type Persona = { id: string; email: string };

async function persona(
  role: string | null,
  opts: {
    committeeSlug?: string;
    fullName?: string;
    member?: boolean;
    grantOpts?: Parameters<typeof grant>[2];
  } = {},
): Promise<Persona> {
  const email = uniqueEmail(role ?? 'plain');
  const id = await createConfirmedUser(email, {
    fullName: opts.fullName ?? `Persona ${role ?? 'plain'} Example`,
    locale: 'en',
  });
  if (role) await grant(id, role, { committeeSlug: opts.committeeSlug, ...opts.grantOpts });
  // Committee roles need an active member (is_active_member is real since Sprint 08).
  if (opts.member) {
    await sql(
      `insert into public.members (user_id, joined_via, first_name_ar) values ($1, 'manual', $2) on conflict (user_id) do nothing`,
      [id, opts.fullName ?? 'عضو'],
    );
  }
  return { id, email };
}

async function remove(...people: Persona[]) {
  for (const p of people) {
    await removeAssignments(p.id);
    await sql(`delete from public.members where user_id = $1`, [p.id]);
    await deleteUser(p.id);
  }
}

const sidebarLinks = async (page: Page) =>
  page
    .locator('nav[aria-label="Internal navigation"] a')
    .evaluateAll((els) =>
      els.map((e) => e.getAttribute('href')?.replace(/\?committee=[0-9a-f-]+$/, '')),
    );

const tag = Math.random().toString(36).slice(2, 7);
// Account pages (profile, positions, security) live in the user menu, not the sidebar.

const cases: Array<{
  name: string;
  role: string | null;
  committeeSlug?: string;
  start: string;
  expected: Array<string | null>;
}> = [
  { name: 'plain user', role: null, start: '/en/account', expected: ['/en/account'] },
  {
    name: 'committee member',
    role: 'committee_member',
    committeeSlug: 'ai',
    start: '/en/dashboard',
    expected: ['/en/dashboard', '/en/dashboard/events', '/en/dashboard/articles'],
  },
  {
    name: 'committee head',
    role: 'committee_head',
    committeeSlug: 'cybersecurity',
    start: '/en/dashboard',
    expected: [
      '/en/dashboard',
      '/en/dashboard/events',
      '/en/dashboard/registrations',
      '/en/dashboard/articles',
      '/en/dashboard/committees',
    ],
  },
  {
    name: 'founder',
    role: 'founder',
    start: '/en/dashboard',
    expected: [
      '/en/dashboard',
      '/en/dashboard/events',
      '/en/dashboard/committees',
      '/en/dashboard/members',
      '/en/dashboard/admin/roles',
    ],
  },
  {
    name: 'community leader',
    role: 'community_leader',
    start: '/en/dashboard',
    expected: [
      '/en/dashboard',
      '/en/dashboard/events',
      '/en/dashboard/registrations',
      '/en/dashboard/committees',
      '/en/dashboard/articles',
      '/en/dashboard/membership/cycles',
      '/en/dashboard/membership/applications',
      '/en/dashboard/members',
      '/en/dashboard/admin/users',
      '/en/dashboard/admin/roles',
      '/en/dashboard/admin/emails',
      '/en/dashboard/admin/reference-data',
    ],
  },
  {
    name: 'system admin',
    role: 'system_admin',
    start: '/en/dashboard',
    expected: [
      '/en/dashboard',
      '/en/dashboard/events',
      '/en/dashboard/registrations',
      '/en/dashboard/committees',
      '/en/dashboard/articles',
      '/en/dashboard/membership/cycles',
      '/en/dashboard/membership/applications',
      '/en/dashboard/members',
      '/en/dashboard/admin/users',
      '/en/dashboard/admin/roles',
      '/en/dashboard/admin/emails',
      '/en/dashboard/admin/reference-data',
    ],
  },
];

test.describe('sidebar per persona (role → view matrix)', () => {
  for (const c of cases) {
    test(c.name, async ({ page }) => {
      const p = await persona(c.role, { committeeSlug: c.committeeSlug });
      try {
        await signInAndWait(page, p.email, undefined, '/en/login');
        await gotoReady(page, c.start);
        await expect(page.locator('nav[aria-label="Internal navigation"]')).toBeVisible();
        expect(await sidebarLinks(page)).toEqual(c.expected);
      } finally {
        await remove(p);
      }
    });
  }
});

test.describe('route protection', () => {
  test('anonymous visitors are sent to login with the return path', async ({ page }) => {
    await gotoReady(page, '/en/dashboard');
    await expect(page).toHaveURL(/\/en\/login\?redirect=%2Fdashboard/);
  });

  test('a plain user has no dashboard: they land in the account area', async ({ page }) => {
    const p = await persona(null);
    try {
      await signInAndWait(page, p.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard');
      await expect(page).toHaveURL(/\/en\/account$/);
    } finally {
      await remove(p);
    }
  });

  test('a committee head cannot open the admin screens (403 inside the shell)', async ({
    page,
  }) => {
    const p = await persona('committee_head', { committeeSlug: 'ai' });
    try {
      await signInAndWait(page, p.email, undefined, '/en/login');
      for (const path of ['/en/dashboard/admin/roles', '/en/dashboard/admin/users']) {
        await gotoReady(page, path);
        await expect(
          page.getByRole('alert').filter({ hasText: "You don't have access to this page" }),
        ).toBeVisible();
        await expect(page.locator('nav[aria-label="Internal navigation"]')).toBeVisible();
      }
    } finally {
      await remove(p);
    }
  });
});

test.describe('assigning and ending positions', () => {
  test('a head conflict offers a handover, and the new head replaces the old one', async ({
    page,
  }) => {
    const leader = await persona('community_leader');
    const oldHead = await persona('committee_head', {
      committeeSlug: 'projects',
      fullName: `Outgoing Head ${tag}`,
    });
    const candidate = await persona(null, {
      fullName: `Incoming Candidate ${tag}`,
      member: true,
    });
    try {
      await signInAndWait(page, leader.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/admin/roles');
      await page.getByRole('button', { name: '+ Assign position' }).click();

      await page.getByLabel('User *').fill('Incoming Candidate');
      await page.getByRole('option', { name: new RegExp(`Incoming Candidate ${tag}`) }).click();
      await page.getByLabel('Role *').selectOption('committee_head');
      await page.getByLabel('Committee *').selectOption({ label: 'Projects' });
      // The permission preview shows what the role grants.
      await expect(page.getByText('Permissions it grants')).toBeVisible();
      await page.getByRole('button', { name: 'Assign', exact: true }).click();

      await expect(
        page.getByRole('alert').filter({ hasText: 'already has an active head' }),
      ).toBeVisible();
      await page.getByRole('button', { name: 'Hand over to this person' }).click();

      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(
        page.getByRole('row', { name: new RegExp(`Incoming Candidate ${tag}`) }),
      ).toContainText('Committee head');
      await expect(page.getByRole('row', { name: new RegExp(`Outgoing Head ${tag}`) })).toHaveCount(
        0,
      );

      await gotoReady(page, '/en/dashboard/admin/roles?tab=history');
      await expect(
        page.getByRole('row', { name: new RegExp(`Outgoing Head ${tag}`) }),
      ).toContainText('handover');
    } finally {
      await remove(leader, oldHead, candidate);
    }
  });

  test('guards are explained in the dialog (leader cannot grant system_admin)', async ({
    page,
  }) => {
    const leader = await persona('community_leader');
    try {
      await signInAndWait(page, leader.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/admin/roles');
      await page.getByRole('button', { name: '+ Assign position' }).click();
      // The role list only contains what the actor may grant (BR-ORG-006).
      const options = await page.getByLabel('Role *').locator('option').allInnerTexts();
      expect(options).not.toContain('System administrator');
      expect(options).not.toContain('Community leader');
      expect(options).toContain('Committee head');
    } finally {
      await remove(leader);
    }
  });

  test('ending a term needs a reason, moves the row to History and removes the access', async ({
    page,
    browser,
  }) => {
    const leader = await persona('community_leader');
    const member = await persona('committee_member', {
      committeeSlug: 'ai',
      fullName: `Leaving Member ${tag}`,
    });
    try {
      // The member can open the dashboard while the term is active.
      const memberCtx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const memberPage = await memberCtx.newPage();
      await signInAndWait(memberPage, member.email, undefined, '/en/login');
      await gotoReady(memberPage, '/en/dashboard');
      await expect(memberPage).toHaveURL(/\/en\/dashboard$/);

      await signInAndWait(page, leader.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/admin/roles');
      const row = page.getByRole('row', { name: new RegExp(`Leaving Member ${tag}`) });
      await row.getByRole('button', { name: 'End term' }).click();
      const dialog = page.getByRole('dialog');
      // A blank reason is refused (the field is required; the server enforces it too).
      await dialog.getByRole('button', { name: 'End term' }).click();
      await expect(dialog).toBeVisible();
      await dialog.getByLabel('Reason *').fill('Left the committee');
      await dialog.getByRole('button', { name: 'End term' }).click();
      await expect(
        page.getByRole('row', { name: new RegExp(`Leaving Member ${tag}`) }),
      ).toHaveCount(0);

      await gotoReady(page, '/en/dashboard/admin/roles?tab=history');
      await expect(
        page.getByRole('row', { name: new RegExp(`Leaving Member ${tag}`) }),
      ).toContainText('Left the committee');

      // Access ended with the term — no deploy needed: the next request has no dashboard.
      await gotoReady(memberPage, '/en/dashboard');
      await expect(memberPage).toHaveURL(/\/en\/account$/);
      await memberCtx.close();
    } finally {
      await remove(leader, member);
    }
  });

  test('a term that expires by date removes access without any action', async ({ page }) => {
    const member = await persona('committee_member', { committeeSlug: 'ai' });
    try {
      await signInAndWait(page, member.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard');
      await expect(page).toHaveURL(/\/en\/dashboard$/);

      const { sql } = await import('./db');
      await sql(
        `update public.role_assignments set ends_at = now() - interval '1 second' where user_id = $1`,
        [member.id],
      );

      await gotoReady(page, '/en/dashboard');
      await expect(page).toHaveURL(/\/en\/account$/);
    } finally {
      await remove(member);
    }
  });

  test('the last system admin cannot be ended (button disabled with the reason)', async ({
    page,
  }) => {
    const admin = await persona('system_admin');
    try {
      await onlyAdmins([admin.id]);
      await signInAndWait(page, admin.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/admin/roles');
      const row = page.getByRole('row', { name: new RegExp(admin.email.split('@')[0]!) });
      const end = row.getByRole('button', { name: 'End term' });
      await expect(end).toBeDisabled();
      await expect(end).toHaveAttribute('title', /last system admin/i);
    } finally {
      await remove(admin);
    }
  });

  test('the roles & permissions tab is the read-only documented matrix', async ({ page }) => {
    const founder = await persona('founder');
    try {
      await signInAndWait(page, founder.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/admin/roles?tab=matrix');
      await expect(page.getByText('This matrix is read-only').first()).toBeVisible();
      await expect(page.getByRole('button', { name: '+ Assign position' })).toHaveCount(0);
      await expect(page.getByText('View only').first()).toBeVisible();
      const approve = page.getByRole('row', { name: /Approve \(publish\) events/ });
      await expect(approve).toBeVisible();
    } finally {
      await remove(founder);
    }
  });
});

test.describe('public leadership comes from the database', () => {
  test('/members shows a founder assigned in the database, and hides them when the term ends', async ({
    page,
  }) => {
    const founder = await persona('founder', {
      fullName: `Founder Display ${tag}`,
      grantOpts: {
        bioAr: 'Co-founder of the community',
        tagsAr: ['Founding', 'Vision'],
      },
    });
    try {
      await gotoReady(page, '/en/members');
      await expect(page.getByText(`Founder Display ${tag}`)).toBeVisible();
      await expect(page.getByText('Community Founders')).toBeVisible();

      const { sql } = await import('./db');
      await sql(
        `update public.role_assignments set ends_at = now() - interval '1 second' where user_id = $1`,
        [founder.id],
      );
      await gotoReady(page, '/en/members');
      await expect(page.getByText(`Founder Display ${tag}`)).toHaveCount(0);
    } finally {
      await remove(founder);
    }
  });

  test('the committee registrations page is gated by the database permission, not an e-mail list', async ({
    page,
    browser,
  }) => {
    const reviewer = await persona('committee_head', { committeeSlug: 'ai' });
    const plain = await persona(null);
    try {
      await signInAndWait(page, plain.email, undefined, '/en/login');
      await gotoReady(page, '/en/dashboard/registrations');
      // A plain user is sent to the account area; nothing of the review queue renders.
      await expect(
        page.getByRole('heading', { name: 'Registrations', exact: true, level: 1 }),
      ).toHaveCount(0);

      const ctx = await browser.newContext({ baseURL: 'http://127.0.0.1:3300' });
      const other = await ctx.newPage();
      await signInAndWait(other, reviewer.email, undefined, '/en/login');
      await gotoReady(other, '/en/dashboard/registrations');
      await expect(
        other.getByRole('heading', { name: 'Registrations', exact: true, level: 1 }),
      ).toBeVisible();
      await ctx.close();
    } finally {
      await remove(reviewer, plain);
    }
  });
});
