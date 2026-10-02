import { expect, settle, test } from './fixtures';

// Visual-regression + smoke for every public page (ENG-008, decision D-009).
// Baselines live in tests/e2e/__screenshots__; regenerate only for an approved redesign:
//   npm run e2e:update
const routes = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about' },
  { name: 'events', path: '/events' },
  { name: 'event-detail', path: '/events/1' },
  { name: 'articles', path: '/articles' },
  { name: 'article-detail', path: '/articles/1' },
  { name: 'members', path: '/members' },
  { name: 'member-profile', path: '/members/100' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  // Sprint 07: /join with no open cycle (the local database has none) = the "closed" state.
  { name: 'join', path: '/join' },
  { name: 'forgot-password', path: '/forgot-password' },
  { name: 'not-found', path: '/this-page-does-not-exist' },
] as const;

for (const lang of ['ar', 'en'] as const) {
  for (const route of routes) {
    test(`${route.name} [${lang}]`, async ({ page, setup }) => {
      await setup({ lang });
      const url = lang === 'en' ? `/en${route.path === '/' ? '' : route.path}` : route.path;
      await page.goto(url);
      await expect(page.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      await settle(page);
      await expect(page).toHaveScreenshot(`${route.name}-${lang}.png`, {
        fullPage: true,
        mask: [page.locator('[data-visual-mask]'), page.locator('.sdc-footer-text')],
      });
    });
  }
}
