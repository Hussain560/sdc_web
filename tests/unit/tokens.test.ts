import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Design System v2 token guards (RDS-001): docs/10-design-system/token-mapping.md.
const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8').replace(/\r\n/g, '\n');
const primitives = read('src/styles/primitives.css');
const tokens = read('src/styles/tokens.css');

const COLOUR_TOKENS = [
  'canvas',
  'band',
  'surface',
  'surface-raised',
  'surface-overlay',
  'field',
  'border',
  'border-strong',
  'border-accent',
  'text',
  'text-muted',
  'text-subtle',
  'text-on-accent',
  'accent',
  'accent-hover',
  'accent-text',
  'accent-soft',
  'on-accent-soft',
  'signal',
  'brand',
  'on-brand',
  'success',
  'success-soft',
  'warning',
  'warning-soft',
  'danger',
  'danger-soft',
  'danger-fill',
  'on-danger-fill',
  'info',
  'info-soft',
  'focus-ring',
  'qr-ground',
  'scrim',
];

function block(selector: string): string {
  const start = tokens.indexOf('{', tokens.indexOf(selector));
  let depth = 0;
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i] === '{') depth++;
    if (tokens[i] === '}' && --depth === 0) return tokens.slice(start + 1, i);
  }
  throw new Error(`no block for ${selector}`);
}

describe('v2 tokens', () => {
  const dark = block(':root {');
  const light = block(":root[data-theme='light'] {");

  it.each(COLOUR_TOKENS)('--%s is defined in both themes', (name) => {
    expect(dark).toMatch(new RegExp(`--${name}:`));
    expect(light).toMatch(new RegExp(`--${name}:`));
  });

  it('every colour token is exposed to Tailwind', () => {
    const theme = tokens.slice(tokens.indexOf('@theme inline'));
    for (const name of COLOUR_TOKENS) {
      expect(theme, `--${name}`).toMatch(new RegExp(`:\\s*var\\(--${name}\\);`));
    }
  });

  it('only references primitives that exist', () => {
    const known = new Set([...primitives.matchAll(/--(c-[0-9a-f]{6}):/g)].map((m) => m[1]));
    const used = [...tokens.matchAll(/var\(--(c-[0-9a-f]{6})\)/g)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(30);
    for (const p of used) expect(known.has(p), `--${p}`).toBe(true);
  });

  it('has no colour literal outside primitives.css', () => {
    const code = tokens.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(code).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(code).not.toMatch(/\brgba?\(/);
  });

  it('adds exactly the 11 v2 primitives and keeps the old ones', () => {
    for (const hex of [
      '0c1a2e',
      '1d4ed8',
      '2a1013',
      '2a1f05',
      '60a5fa',
      '7a4f00',
      'b91c1c',
      'e8f0fe',
      'f87171',
      'fdecec',
      'fff4dc',
    ]) {
      expect(primitives).toContain(`--c-${hex}: #${hex};`);
    }
    expect(primitives).toContain('--c-00e676: #00e676;');
    expect(primitives).toContain('--c-050d09: #050d09;');
  });

  it('keeps Tailwind radius utilities untouched (v2 shapes use --shape-*)', () => {
    expect(tokens).not.toMatch(/--radius-(xs|sm|md|lg|xl|2xl):/);
    expect(tokens).toContain('--shape-xl: 24px;');
  });

  it('passes the contrast gate and the hex guard', () => {
    expect(() => execFileSync('node', ['scripts/check-contrast.mjs'], { cwd: root })).not.toThrow();
    expect(() => execFileSync('node', ['scripts/check-tokens.mjs'], { cwd: root })).not.toThrow();
  });
});
