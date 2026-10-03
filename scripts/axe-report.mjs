// Prints every serious/critical axe finding with the colours involved: node scripts/axe-report.mjs [baseUrl]
// Run against a running site (default http://localhost:3000). Used to triage SEC-004 findings.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = process.argv[2] ?? 'http://localhost:3000';
const routes = [
  '/',
  '/about',
  '/events',
  '/events/1',
  '/articles',
  '/articles/1',
  '/members',
  '/login',
  '/join',
  '/forgot-password',
  '/privacy',
];
const browser = await chromium.launch();
const seen = new Map();
for (const theme of ['dark', 'light']) {
  for (const lang of ['ar', 'en']) {
    const ctx = await browser.newContext({
      colorScheme: theme,
      viewport: { width: 1280, height: 900 },
    });
    await ctx.addInitScript((t) => localStorage.setItem('sdc_theme', t), theme);
    const page = await ctx.newPage();
    for (const r of routes) {
      await page.goto(`${base}${lang === 'en' ? '/en' : ''}${r === '/' && lang === 'en' ? '' : r}`);
      await page.waitForTimeout(800);
      const res = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      for (const v of res.violations.filter(
        (x) => x.impact === 'serious' || x.impact === 'critical',
      )) {
        for (const n of v.nodes) {
          const d = n.any?.[0]?.data ?? {};
          const key = `${v.id}|${n.target.join(' ')}|${theme}|${d.fgColor ?? ''}|${d.bgColor ?? ''}`;
          if (!seen.has(key))
            seen.set(
              key,
              `${v.id} [${theme}/${lang}] ${r} ${n.target.join(' ')} ${d.fgColor ? `fg ${d.fgColor} on ${d.bgColor} = ${d.contrastRatio}` : ''}`,
            );
        }
      }
    }
    await ctx.close();
  }
}
await browser.close();
console.log([...seen.values()].join('\n'));
console.log(`\n${seen.size} distinct findings`);
