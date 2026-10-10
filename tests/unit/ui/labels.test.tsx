import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Badge,
  CountdownChip,
  DateChip,
  FilterChip,
  RemovableChip,
  StatusPill,
  TagChip,
} from '@/components/ui';
import { STATUS_META } from '@/components/ui/StatusPill';

vi.mock('@/i18n/navigation', () => ({ Link: 'a' }));

describe('Badge', () => {
  it('uses the soft tone pairs', () => {
    const { container } = render(<Badge tone="success">Open</Badge>);
    expect(container.firstChild).toHaveClass('bg-success-soft', 'text-success');
  });

  it('a count badge keeps tabular numbers and shows its icon aria-hidden', () => {
    const { container } = render(
      <Badge icon={<i data-testid="i" />} aria-label="12 members">
        12
      </Badge>,
    );
    expect(container.firstChild).toHaveClass('tabular-nums');
    expect(screen.getByTestId('i').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('StatusPill', () => {
  it('always renders text and an icon, never colour alone', () => {
    for (const status of Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>) {
      const { container, unmount } = render(
        <StatusPill status={status} label={`label-${status}`} />,
      );
      expect(screen.getByText(`label-${status}`)).toBeInTheDocument();
      expect(container.querySelector('svg')).not.toBeNull();
      unmount();
    }
  });

  it('maps cancelled to danger and open to success', () => {
    expect(STATUS_META.cancelled.tone).toBe('danger');
    expect(STATUS_META['registration-open'].tone).toBe('success');
  });
});

describe('TagChip', () => {
  it('overflow chip lists the hidden tags in its accessible name', () => {
    render(<TagChip title="AI, Web">+2</TagChip>);
    expect(screen.getByLabelText('+2 AI, Web')).toBeInTheDocument();
  });

  it('filter chip toggles with aria-pressed', async () => {
    const onClick = vi.fn();
    render(
      <FilterChip pressed onClick={onClick}>
        AI
      </FilterChip>,
    );
    const btn = screen.getByRole('button', { name: 'AI' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('removable chip has a labelled remove button', async () => {
    const onRemove = vi.fn();
    render(
      <RemovableChip removeLabel="Remove filter: AI" onRemove={onRemove}>
        AI
      </RemovableChip>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: AI' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

describe('DateChip', () => {
  it('block variant exposes the full date to assistive tech and a datetime', () => {
    const { container } = render(<DateChip date="2026-10-14" lang="en" variant="block" />);
    const time = container.querySelector('time')!;
    expect(time).toHaveAttribute('datetime', '2026-10-14');
    expect(time.getAttribute('aria-label')).toContain('2026');
  });

  it('inline variant shows a time range with Western digits in Arabic', () => {
    render(<DateChip date="2026-10-14" lang="ar" start="18:00:00" end="20:00:00" />);
    expect(screen.getByText('18:00 – 20:00')).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/14/);
  });

  it('countdown keeps the absolute date for screen readers', () => {
    const now = Date.parse('2026-10-11T00:00:00Z');
    const { container } = render(<CountdownChip date="2026-10-14" lang="en" now={now} />);
    expect(container.textContent).toContain('in 3 days');
    expect(container.querySelector('.sr-only')?.textContent).toContain('2026');
  });
});
