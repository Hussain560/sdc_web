// WCAG 2 contrast of every Design System v2 token pair, in both themes, computed from the REAL css files
// (src/styles/primitives.css + src/styles/tokens.css). Fails (exit 1) when a pair drops below its threshold.
//   node scripts/check-contrast.mjs          (npm run check:contrast)
// The pair list mirrors docs/10-design-system/tools/contrast.py and accessibility.md §2.
import { readFileSync } from 'node:fs';

const read = (p) =>
  readFileSync(new URL(`../${p}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const primitives = read('src/styles/primitives.css');
const tokens = read('src/styles/tokens.css');

const prim = {};
for (const m of primitives.matchAll(/--(c-[0-9a-f]{6}):\s*(#[0-9a-fA-F]{6});/g)) prim[m[1]] = m[2];

function block(selector) {
  const i = tokens.indexOf(selector);
  if (i < 0) throw new Error(`${selector} block not found in tokens.css`);
  const start = tokens.indexOf('{', i);
  let depth = 0;
  for (let k = start; k < tokens.length; k++) {
    if (tokens[k] === '{') depth++;
    if (tokens[k] === '}' && --depth === 0) return tokens.slice(start + 1, k);
  }
  throw new Error(`unterminated ${selector}`);
}

function parseTheme(css) {
  const out = {};
  for (const m of css.matchAll(/--([a-z-]+):\s*var\(--(c-[0-9a-f]{6})\);/g)) {
    const hex = prim[m[2]];
    if (!hex) throw new Error(`--${m[1]} uses an unknown primitive --${m[2]}`);
    out[m[1]] = hex;
  }
  return out;
}

const dark = parseTheme(block(':root {'));
const light = { ...dark, ...parseTheme(block(":root[data-theme='light'] {")) };

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [la, lb] = [lum(a), lum(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

// [foreground token, [background tokens], minimum ratio (null = informational only)]
const PAIRS = [
  ['text', ['canvas', 'band', 'surface', 'surface-raised', 'field', 'accent-soft'], 4.5],
  ['text-muted', ['canvas', 'band', 'surface', 'surface-raised', 'field'], 4.5],
  ['accent-text', ['canvas', 'band', 'surface', 'surface-raised'], 4.5],
  ['text-on-accent', ['accent', 'accent-hover'], 4.5],
  ['on-accent-soft', ['accent-soft'], 4.5],
  ['on-brand', ['brand'], 4.5],
  ['success', ['surface', 'success-soft'], 4.5],
  ['warning', ['surface', 'canvas', 'warning-soft'], 4.5],
  ['danger', ['surface', 'canvas', 'field', 'danger-soft'], 4.5],
  ['on-danger-fill', ['danger-fill'], 4.5],
  ['info', ['surface', 'info-soft'], 4.5],
  ['text-subtle', ['field'], null],
  ['border-strong', ['canvas', 'surface', 'field', 'surface-overlay'], 3.0],
  ['focus-ring', ['canvas', 'band', 'surface', 'surface-raised'], 3.0],
  ['signal', ['canvas', 'surface'], 3.0],
];

let failures = 0;
let rows = 0;
for (const [fg, bgs, need] of PAIRS) {
  for (const bg of bgs) {
    for (const [name, theme] of [
      ['dark', dark],
      ['light', light],
    ]) {
      if (!theme[fg] || !theme[bg]) {
        console.log(`FAIL  --${fg} or --${bg} is missing in the ${name} theme`);
        failures++;
        continue;
      }
      const r = ratio(theme[fg], theme[bg]);
      rows++;
      if (need && r < need) {
        failures++;
        console.log(
          `FAIL  ${name.padEnd(5)} --${fg} on --${bg}: ${r.toFixed(2)}:1 (needs ${need}:1)`,
        );
      }
    }
  }
}
console.log(
  failures ? `\n${failures} contrast failure(s)` : `All ${rows} token pairs pass in both themes`,
);
process.exit(failures ? 1 : 0);
