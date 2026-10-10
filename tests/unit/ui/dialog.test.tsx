import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Button, Dialog, ResultDialog } from '@/components/ui';

vi.mock('@/i18n/navigation', () => ({ Link: 'a' }));

// jsdom has no <dialog> modal support: model open/close and the cancel event.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

const open = (props: Partial<React.ComponentProps<typeof Dialog>> = {}) =>
  render(
    <Dialog open onClose={props.onClose ?? (() => {})} title="Register" {...props}>
      <input aria-label="phone" />
    </Dialog>,
  );

describe('Dialog', () => {
  it('opens as a modal with its title as the accessible name', () => {
    open({ description: 'Takes a minute' });
    const dlg = document.querySelector('dialog')!;
    expect(dlg).toHaveAttribute('open');
    expect(screen.getByRole('dialog', { name: 'Register', hidden: true })).toBeInTheDocument();
    expect(dlg.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('shows a close button only when a label is given, and it closes', async () => {
    const onClose = vi.fn();
    const { rerender } = open({ onClose });
    expect(screen.queryByRole('button', { name: 'Close', hidden: true })).toBeNull();
    rerender(
      <Dialog open onClose={onClose} title="Register" closeLabel="Close">
        x
      </Dialog>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Close', hidden: true }));
    expect(onClose).toHaveBeenCalled();
  });

  it('busy lock: Esc is cancelled, the close button is disabled and the body is inert', () => {
    open({ busy: true, busyHint: 'Closes when sending finishes', closeLabel: 'Close' });
    const dlg = document.querySelector('dialog')!;
    const cancel = new Event('cancel', { cancelable: true });
    dlg.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(screen.getByRole('button', { name: 'Close', hidden: true })).toBeDisabled();
    expect(dlg.querySelector('[inert]')).not.toBeNull();
    expect(screen.getByText('Closes when sending finishes')).toBeInTheDocument();
    expect(dlg).toHaveAttribute('aria-busy', 'true');
  });

  it('not busy: Esc is allowed', () => {
    open();
    const cancel = new Event('cancel', { cancelable: true });
    document.querySelector('dialog')!.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(false);
  });

  it('sheet presentation anchors to the bottom edge on phones', () => {
    open({ presentation: 'sheet' });
    expect(document.querySelector('dialog')).toHaveClass('max-md:mb-0', 'max-md:rounded-b-none');
  });

  it('renders the footer actions', () => {
    open({ footer: <Button>Confirm</Button> });
    expect(screen.getByRole('button', { name: 'Confirm', hidden: true })).toBeInTheDocument();
  });
});

describe('ResultDialog', () => {
  it('moves focus to the title and announces success as status', () => {
    render(
      <ResultDialog
        open
        onClose={() => {}}
        tone="success"
        title="You are registered"
        description="We sent the details to your inbox."
        actions={<Button>Add to calendar</Button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'You are registered', hidden: true })).toHaveFocus();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('We sent the details to your inbox.')).toBeInTheDocument();
  });

  it('a refusal is announced as an alert', () => {
    render(<ResultDialog open onClose={() => {}} tone="danger" title="Registration is closed" />);
    expect(screen.getByRole('alert', { hidden: true })).toBeInTheDocument();
  });

  it('calls onClose when the dialog closes', () => {
    const onClose = vi.fn();
    render(<ResultDialog open onClose={onClose} tone="info" title="Saved" />);
    fireEvent(document.querySelector('dialog')!, new Event('close'));
    expect(onClose).toHaveBeenCalled();
  });
});
