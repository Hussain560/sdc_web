import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { RegistrationDialog } from '@/modules/registrations/components/RegistrationDialog';

// Sprint 15 timing and feedback tests T4-T6 (fake timers, no network).
const actions = vi.hoisted(() => ({ guest: vi.fn(), member: vi.fn() }));
vi.mock('@/modules/registrations/actions', () => ({
  registerGuest: actions.guest,
  registerForEvent: actions.member,
}));
vi.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ lang: 'en' }) }));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: { href: string }) => <a href={href} {...rest} />,
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  actions.guest.mockReset();
  actions.member.mockReset();
});
afterEach(() => vi.useRealTimers());

const event = { id: 'e1', slug: 'demo', title: 'Workshop', meta: '14 Oct · Riyadh' };
const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

async function fill(u: ReturnType<typeof user>) {
  await u.type(screen.getByLabelText(/Full name/), 'Sara Al Otaibi');
  await u.type(screen.getByLabelText(/E-mail/), 'sara@example.test');
  await u.type(screen.getByLabelText(/Mobile/), '0551234567');
  await u.click(screen.getByRole('checkbox'));
}
const send = () => screen.getByRole('button', { name: /^Register$|Registering/ });
const open = (props = {}) =>
  render(<RegistrationDialog open onClose={() => {}} event={event} {...props} />);
const dlg = () => document.querySelector('dialog[open]')!;

describe('registration dialog', () => {
  it('T6: invalid fields show errors at once and send nothing', async () => {
    const u = user();
    open();
    await u.click(send());
    expect(screen.getAllByText(/Enter your full name/).length).toBeGreaterThan(0);
    expect(actions.guest).not.toHaveBeenCalled();
    expect(dlg()).not.toHaveAttribute('aria-busy');
  });

  it('T4: locked while sending until 1500 ms, then the result shows', async () => {
    actions.guest.mockResolvedValue({ ok: true, data: { id: 'r', status: 'accepted' } });
    const u = user();
    open();
    await fill(u);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await u.click(send());
    // immediately locked
    expect(dlg()).toHaveAttribute('aria-busy', 'true');
    expect(dlg().querySelector('[inert]')).not.toBeNull();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    const esc = new Event('cancel', { cancelable: true });
    dlg().dispatchEvent(esc);
    expect(esc.defaultPrevented).toBe(true);
    // the fast server answer is held back
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1400);
    });
    expect(screen.queryByText("You're registered")).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(screen.getByText("You're registered")).toBeInTheDocument();
    expect(actions.guest).toHaveBeenCalledTimes(1);
  });

  it('T5: a refusal waits the floor too and shows its own dialog', async () => {
    actions.guest.mockResolvedValue({ ok: false, code: 'ALREADY_REGISTERED', message: 'x' });
    const u = user();
    open();
    await fill(u);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await u.click(send());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1400);
    });
    expect(screen.queryByText("You're already registered")).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
    expect(screen.getByText("You're already registered")).toBeInTheDocument();
  });

  it('a throttle refusal shows a countdown and locks the retry', async () => {
    actions.guest.mockResolvedValue({ ok: false, code: 'RATE_LIMITED', message: 'x' });
    const u = user();
    open();
    await fill(u);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await u.click(send());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(screen.getByText('Too many attempts')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('a double click sends one request', async () => {
    actions.guest.mockResolvedValue({ ok: true, data: { id: 'r', status: 'pending' } });
    const u = user();
    open();
    await fill(u);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await u.dblClick(send());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1700);
    });
    expect(actions.guest).toHaveBeenCalledTimes(1);
  });

  it('members get a read-only confirm and the member action', async () => {
    actions.member.mockResolvedValue({ ok: true, data: { id: 'r', status: 'waitlisted' } });
    const u = user();
    open({ member: { name: 'Sara', email: 'sara@x.sa' } });
    expect(screen.queryByLabelText(/Full name/)).toBeNull();
    expect(screen.getByText('sara@x.sa')).toBeInTheDocument();
    await u.click(screen.getByRole('checkbox'));
    await u.click(send());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1600);
    });
    expect(actions.member).toHaveBeenCalledWith({ eventId: 'e1' }, { lang: 'en' });
    expect(screen.getByText("You're on the waiting list")).toBeInTheDocument();
  });
});
