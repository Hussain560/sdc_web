import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { dur, ease, presets, reading, spring, stagger, staggerDelay } from '@/lib/motion';

const tokens = readFileSync('src/styles/tokens.css', 'utf8');
const ms = (name: string) => {
  const m = tokens.match(new RegExp(`--duration-${name}:\\s*(\\d+)ms`));
  if (!m) throw new Error(`token --duration-${name} not found`);
  return Number(m[1]) / 1000;
};
const bezier = (name: string) => {
  const m = tokens.match(new RegExp(`--ease-${name}:\\s*cubic-bezier\\(([^)]+)\\)`));
  if (!m) throw new Error(`token --ease-${name} not found`);
  return m[1]!.split(',').map(Number);
};

describe('motion presets', () => {
  it('mirror the CSS tokens', () => {
    for (const k of ['instant', 'fast', 'base', 'slow', 'counter'] as const)
      expect(dur[k]).toBeCloseTo(ms(k));
    for (const k of ['out', 'in', 'standard'] as const) expect(ease[k]).toEqual(bezier(k));
  });

  it('stagger waits 40 ms per item and stops at eight items', () => {
    expect(stagger.step).toBe(0.04);
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(3)).toBeCloseTo(0.12);
    expect(staggerDelay(7)).toBeCloseTo(0.28);
    expect(staggerDelay(40)).toBeCloseTo(0.28);
    expect(staggerDelay(-2)).toBe(0);
  });

  it('wizard steps enter from the side of progress and mirror in Arabic', () => {
    expect(reading(true)).toBe(-1);
    expect(presets.step(1, false).initial.x).toBe(24);
    expect(presets.step(1, true).initial.x).toBe(-24);
    expect(presets.step(-1, true).initial.x).toBe(24);
    expect(presets.step(1, false).exit.x).toBe(-24);
  });

  it('springs and dialogs use the spec values', () => {
    expect(spring.soft).toMatchObject({ stiffness: 380, damping: 34 });
    expect(spring.snappy).toMatchObject({ stiffness: 520, damping: 38 });
    expect(presets.dialog.initial).toMatchObject({ scale: 0.96, y: 8 });
    expect(presets.sheet.initial.y).toBe('100%');
  });

  it('only move with transform and opacity', () => {
    const allowed = new Set(['opacity', 'y', 'x', 'scale']);
    for (const p of [presets.reveal, presets.dialog, presets.card, presets.chip, presets.toast]) {
      for (const key of Object.keys(p.initial)) expect(allowed.has(key)).toBe(true);
    }
  });
});
