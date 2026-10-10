import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Alert, Progress, ToastProvider, useToast } from '@/components/ui';

vi.mock('@/i18n/navigation', () => ({ Link: 'a' }));
vi.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ lang: 'en' }) }));

describe('Alert', () => {
  it('danger and warning are alerts, info and success are status', () => {
    const { rerender } = render(<Alert tone="danger">x</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<Alert tone="warning">x</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    rerender(<Alert tone="info">x</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
    rerender(<Alert tone="success">x</Alert>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows a title, a body, an action and an aria-hidden icon', () => {
    const { container } = render(
      <Alert tone="info" title="Heads up" action={<button type="button">Learn more</button>}>
        Registration closes soon.
      </Alert>,
    );
    expect(screen.getByText('Heads up')).toBeInTheDocument();
    expect(screen.getByText('Registration closes soon.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('Progress', () => {
  it('indeterminate has no value and a status line', () => {
    render(<Progress label="Registering you…" />);
    const bar = screen.getByRole('progressbar', { name: 'Registering you…' });
    expect(bar).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByRole('status')).toHaveTextContent('Registering you…');
  });

  it('determinate clamps and reports the value', () => {
    render(<Progress label="Uploading" value={140} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '140');
    expect((bar.firstChild as HTMLElement).style.width).toBe('100%');
  });
});

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success('Link copied', { label: 'Undo', onClick: undo })}>
        fire
      </button>
      <button onClick={() => toast.error('Could not save')}>fail</button>
    </>
  );
}
const undo = vi.fn();

describe('Toast', () => {
  it('announces politely, offers an action and a labelled close button', async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByText('fire'));
    expect(screen.getByRole('status')).toHaveTextContent('Link copied');
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(undo).toHaveBeenCalledOnce();
    expect(screen.queryByText('Link copied')).toBeNull();
  });

  it('errors are alerts and close with the labelled button', async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await userEvent.click(screen.getByText('fail'));
    expect(screen.getByRole('alert')).toHaveTextContent('Could not save');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('disappears on its own after the duration', () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    act(() => screen.getByText('fire').click());
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(5100);
    });
    expect(screen.queryByRole('status')).toBeNull();
    vi.useRealTimers();
  });
});
