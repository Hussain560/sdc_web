import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CompletenessBar } from '@/modules/members/components/CompletenessBar';

const segments = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('[role="meter"] > span')) as HTMLElement[];
const filled = (c: HTMLElement, cls: string) =>
  segments(c).filter((s) => s.className.includes(cls));

describe('CompletenessBar', () => {
  it('is a meter with the number as text, never colour alone', () => {
    render(<CompletenessBar percent={80} label="Profile completeness" />);
    const meter = screen.getByRole('meter', { name: 'Profile completeness' });
    expect(meter).toHaveAttribute('aria-valuenow', '80');
    expect(meter).toHaveAttribute('aria-valuetext', '80%');
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('fills one segment per 20 percent', () => {
    for (const [pct, n] of [
      [0, 0],
      [20, 1],
      [60, 3],
      [100, 5],
    ] as const) {
      const { container, unmount } = render(<CompletenessBar percent={pct} label="x" />);
      expect(segments(container)).toHaveLength(5);
      expect(filled(container, 'bg-accent').length + filled(container, 'bg-warning').length).toBe(
        n,
      );
      unmount();
    }
  });

  it('uses the warning tone under 40 percent and the brand tone from 40', () => {
    const low = render(<CompletenessBar percent={20} label="x" />);
    expect(filled(low.container, 'bg-warning')).toHaveLength(1);
    expect(filled(low.container, 'bg-accent')).toHaveLength(0);
    low.unmount();
    const ok = render(<CompletenessBar percent={40} label="x" />);
    expect(filled(ok.container, 'bg-accent')).toHaveLength(2);
    expect(filled(ok.container, 'bg-warning')).toHaveLength(0);
  });

  it('can hide the number when the page already shows it', () => {
    render(<CompletenessBar percent={60} label="x" showNumber={false} />);
    expect(screen.queryByText('60%')).not.toBeInTheDocument();
  });

  it('keeps out-of-range values inside the five segments', () => {
    const { container } = render(<CompletenessBar percent={250} label="x" />);
    expect(filled(container, 'bg-accent')).toHaveLength(5);
  });
});
