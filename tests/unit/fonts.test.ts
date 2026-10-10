import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// RDS-002: one font stack through next/font, and the t-* type utilities.
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const layout = read('app/[locale]/layout.tsx');
const globals = read('app/globals.css');
const tokens = read('src/styles/tokens.css');
const type = read('src/styles/type.css');

describe('fonts', () => {
  it('loads Rubik and IBM Plex Sans Arabic through next/font, once', () => {
    expect(layout).toContain("from 'next/font/google'");
    expect(layout).toContain("variable: '--font-rubik'");
    expect(layout).toContain("variable: '--font-plex-arabic'");
    expect(layout).not.toContain('fonts.googleapis.com/css2');
    expect(globals).not.toContain('fonts.googleapis.com');
  });

  it('puts Rubik first and Plex Arabic second in --font-sans', () => {
    expect(tokens).toMatch(/--font-sans: var\(--font-rubik\), var\(--font-plex-arabic\)/);
  });

  it('no longer swaps families per language', () => {
    expect(globals).not.toMatch(/:lang\((ar|en)\)\s*\{\s*font-family/);
  });
});

describe('type utilities', () => {
  it.each([
    'display',
    'h1',
    'h2',
    'h3',
    'h4',
    'stat',
    'lede',
    'body',
    'body-sm',
    'label',
    'caption',
    'badge',
  ])('t-%s exists and uses its token', (name) => {
    expect(type).toContain(`@utility t-${name} {`);
    expect(type).toContain(`var(--text-${name})`);
  });

  it('has Arabic and English line heights for the prose sizes', () => {
    expect(type).toContain('var(--leading-display-ar)');
    expect(type).toContain('var(--leading-display-en)');
    expect(type).toContain('var(--leading-body-ar)');
    expect(type).toContain('var(--leading-body-en)');
  });

  it('never sets letter-spacing', () => {
    expect(type.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/letter-spacing/);
  });
});
