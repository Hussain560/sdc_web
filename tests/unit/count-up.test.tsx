import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountUp } from '@/components/motion/CountUp';

let trigger: (visible: boolean) => void = () => undefined;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: (e: Array<{ isIntersecting: boolean }>) => void) {
        trigger = (v) => cb([{ isIntersecting: v }]);
      }
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('CountUp', () => {
  it('starts at 0, counts up when visible and lands on the figure', () => {
    const { container } = render(<CountUp value={7} locale="en" />);
    const el = container.firstElementChild!;
    expect(el.textContent).toBe('0');
    act(() => trigger(true));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(el.textContent).toBe('7');
  });

  it('keeps the final number for people who ask for reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const { container } = render(<CountUp value={5} locale="ar" />);
    expect(container.firstElementChild!.textContent).toBe('5');
  });

  it('is hidden from screen readers (the caller keeps a plain copy)', () => {
    const { container } = render(<CountUp value={3} locale="en" />);
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });
});
