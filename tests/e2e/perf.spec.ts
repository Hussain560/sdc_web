import { expect, settle, test } from './fixtures';

// ENG-010 / NFR-PERF-001: Core Web Vitals budget on a production build (local network, so LCP is a regression
// guard, not a field measurement): LCP < 2.5 s and CLS < 0.1 for the home page and an event page.
const pages = ['/', '/events', '/events/1'];

for (const path of pages) {
  test(`web vitals ${path}`, async ({ page, setup }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-dark', 'one project is enough for the budget');
    await setup({ lang: 'en' });
    await page.addInitScript(() => {
      const w = window as unknown as { __lcp: number; __cls: number };
      w.__lcp = 0;
      w.__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) w.__lcp = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries() as unknown as Array<{
          value: number;
          hadRecentInput: boolean;
        }>)
          if (!e.hadRecentInput) w.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(`/en${path === '/' ? '' : path}`);
    await settle(page);
    await page.waitForTimeout(1500);
    const { lcp, cls } = await page.evaluate(() => {
      const w = window as unknown as { __lcp: number; __cls: number };
      return { lcp: w.__lcp, cls: w.__cls };
    });
    console.log(`web vitals ${path}: LCP ${Math.round(lcp)} ms, CLS ${cls.toFixed(3)}`);
    expect(lcp, 'LCP (ms)').toBeLessThan(2500);
    expect(cls, 'CLS').toBeLessThan(0.1);
  });
}
