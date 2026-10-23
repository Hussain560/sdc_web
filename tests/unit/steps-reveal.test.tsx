import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StepsReveal } from '@/components/motion/StepsReveal';

type Cb = (entries: Array<{ isIntersecting: boolean; target: Element }>) => void;
let cb: Cb = () => undefined;

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(fn: Cb) {
        cb = fn;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => vi.unstubAllGlobals());

const list = () => (
  <StepsReveal>
    <li>one</li>
    <li>two</li>
    <li>three</li>
  </StepsReveal>
);

describe('StepsReveal', () => {
  it('arms the list, then marks each step as it arrives and grows the thread', () => {
    const { container } = render(list());
    const ol = container.querySelector('ol')!;
    const steps = [...ol.querySelectorAll('li:not(.m-steps-line)')];
    expect(ol).toHaveAttribute('data-armed');
    expect(steps[0]).not.toHaveAttribute('data-in');

    act(() => cb([{ isIntersecting: true, target: steps[0]! }]));
    expect(steps[0]).toHaveAttribute('data-in');
    expect(ol.style.getPropertyValue('--p')).toBe('0');

    act(() => cb([{ isIntersecting: true, target: steps[1]! }]));
    expect(ol.style.getPropertyValue('--p')).toBe('0.5');

    act(() => cb([{ isIntersecting: true, target: steps[2]! }]));
    expect(ol.style.getPropertyValue('--p')).toBe('1');
  });

  it('leaves every step in its final state for reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const { container } = render(list());
    expect(container.querySelector('ol')).not.toHaveAttribute('data-armed');
  });
});
