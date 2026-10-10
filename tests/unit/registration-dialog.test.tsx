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
  await u.type(screen.getByLabelText(/First name \(Arabic\)/), 'سارة');
  await u.type(screen.getByLabelText(/Last name \(Arabic\)/), 'العتيبي');
  await u.type(screen.getByLabelText(/First name \(English\)/), 'Sara');
  await u.type(screen.getByLabelText(/Last name \(English\)/), 'Al Otaibi');
  await u.type(screen.getByLabelText(/E-mail/), 'sara@example.test');
  await u.type(screen.getByLabelText(/Mobile/), '501234567');
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
    expect(screen.getAllByText(/Enter your first name in Arabic/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Enter your first name in English/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/valid mobile number/).length).toBeGreaterThan(0);
    expect(actions.guest).not.toHaveBeenCalled();
    expect(dlg()).not.toHaveAttribute('aria-busy');
  });

  it('T4: locked while sending for 4 to 5 seconds, then the result shows', async () => {
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
    // the fast server answer is held back (4 to 5 seconds)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3900);
    });
    expect(screen.queryByText("You're registered")).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(screen.getByText("You're registered")).toBeInTheDocument();
    expect(actions.guest).toHaveBeenCalledTimes(1);
  });

  it('T5: a refusal waits the same 4 to 5 seconds and shows its own dialog', async () => {
    actions.guest.mockResolvedValue({ ok: false, code: 'ALREADY_REGISTERED', message: 'x' });
    const u = user();
    open();
    await fill(u);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await u.click(send());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3900);
    });
    expect(screen.queryByText("You're already registered")).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
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
      await vi.advanceTimersByTimeAsync(5100);
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
      await vi.advanceTimersByTimeAsync(5100);
    });
    expect(actions.guest).toHaveBeenCalledTimes(1);
  });

  it('members get a read-only confirm and the member action', async () => {
    actions.member.mockResolvedValue({ ok: true, data: { id: 'r', status: 'waitlisted' } });
    const u = user();
    open({ member: { name: 'Sara', email: 'sara@x.sa' } });
    expect(screen.queryByLabelText(/First name/)).toBeNull();
    expect(screen.getByText('sara@x.sa')).toBeInTheDocument();
    await u.click(screen.getByRole('checkbox'));
    await u.click(send());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100);
    });
    expect(actions.member).toHaveBeenCalledWith({ eventId: 'e1' }, { lang: 'en' });
    expect(screen.getByText("You're on the waiting list")).toBeInTheDocument();
  });
});

describe('registration dialog: names and phone', () => {
  it('the Arabic boxes drop Latin letters and the English boxes drop Arabic letters', async () => {
    const u = user();
    open();
    const ar = screen.getByLabelText(/First name \(Arabic\)/) as HTMLInputElement;
    const en = screen.getByLabelText(/First name \(English\)/) as HTMLInputElement;
    await u.type(ar, 'Saraسارة1');
    await u.type(en, 'Saraسارة1');
    expect(ar.value).toBe('سارة');
    expect(en.value).toBe('Sara');
  });

  it('shows the Saudi mask 5x xxx xxxx, caps the number and drops a leading zero', async () => {
    const u = user();
    open();
    const phone = screen.getByLabelText(/Mobile/) as HTMLInputElement;
    expect(phone.placeholder).toBe('5x xxx xxxx');
    await u.type(phone, '0501234567899');
    expect(phone.value).toBe('50 123 4567');
  });

  it('a number that is not a Saudi mobile number is refused before anything is sent', async () => {
    const u = user();
    open();
    await u.type(screen.getByLabelText(/First name \(Arabic\)/), 'سارة');
    await u.type(screen.getByLabelText(/Last name \(Arabic\)/), 'العتيبي');
    await u.type(screen.getByLabelText(/First name \(English\)/), 'Sara');
    await u.type(screen.getByLabelText(/Last name \(English\)/), 'Otaibi');
    await u.type(screen.getByLabelText(/E-mail/), 'sara@example.test');
    await u.type(screen.getByLabelText(/Mobile/), '412345678');
    await u.click(screen.getByRole('checkbox'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await u.click(send());
    expect(screen.getAllByText(/valid mobile number/).length).toBeGreaterThan(0);
    expect(actions.guest).not.toHaveBeenCalled();
  });

  it('sends the four names and the international number', async () => {
    actions.guest.mockResolvedValue({ ok: true, data: { id: 'r', status: 'accepted' } });
    const u = user();
    open({
      event: {
        ...event,
        calendar: {
          title: 'Workshop',
          startDate: '2026-10-22',
          endDate: '2026-10-22',
          startTime: '18:00:00',
          endTime: '20:00:00',
          place: 'Al-Ahsa',
          url: '/events/demo',
        },
      },
    });
    await fill(u);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await u.click(send());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100);
    });
    expect(actions.guest).toHaveBeenCalledWith(
      expect.objectContaining({
        firstAr: 'سارة',
        lastAr: 'العتيبي',
        firstEn: 'Sara',
        lastEn: 'Al Otaibi',
        phone: '+966501234567',
        phoneCountry: 'SA',
      }),
      { lang: 'en' },
    );
    // The success dialog offers Google and Apple calendars.
    expect(screen.getByRole('link', { name: /Google Calendar/ })).toHaveAttribute(
      'href',
      expect.stringContaining('calendar.google.com'),
    );
    expect(screen.getByRole('link', { name: /Apple Calendar/ })).toHaveAttribute(
      'href',
      '/en/events/demo/calendar.ics',
    );
  });
});

describe('registration dialog: student or employee', () => {
  it('is optional and shows the matching field only after a choice', async () => {
    const u = user();
    open();
    expect(screen.queryByLabelText(/University/)).toBeNull();
    expect(screen.queryByLabelText(/Employer/)).toBeNull();
    const student = screen.getByRole('button', { name: 'University student' });
    const employee = screen.getByRole('button', { name: 'Employee' });
    await u.click(student);
    expect(student).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText(/University/)).toBeInTheDocument();
    await u.click(employee);
    expect(screen.queryByLabelText(/University/)).toBeNull();
    expect(screen.getByLabelText(/Employer/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Other' }));
    expect(screen.queryByLabelText(/Employer/)).toBeNull();
    expect(screen.getByLabelText(/Please specify/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: 'Other' })); // a second click clears the choice
    expect(screen.queryByLabelText(/Please specify/)).toBeNull();
  });

  it('sends the occupation and only its own detail', async () => {
    actions.guest.mockResolvedValue({ ok: true, data: { id: 'r', status: 'pending' } });
    const u = user();
    open();
    await fill(u);
    await u.click(screen.getByRole('button', { name: 'University student' }));
    await u.type(screen.getByLabelText(/University/), 'King Faisal University');
    await u.click(screen.getByRole('button', { name: 'Employee' }));
    await u.type(screen.getByLabelText(/Employer/), 'Aramco');
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    await u.click(send());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100);
    });
    const sent = actions.guest.mock.calls[0]![0];
    expect(sent.occupation).toBe('employee');
    expect(sent.employer).toBe('Aramco');
    expect(sent.university).toBeUndefined();
  });

  it('shows a field message only after the field was filled and left', async () => {
    const u = user();
    open();
    const first = screen.getByLabelText(/First name \(Arabic\)/);
    expect(screen.queryByText(/Enter your first name in Arabic/)).toBeNull();
    await u.click(first);
    await u.tab();
    expect(screen.getByText(/Enter your first name in Arabic/)).toBeInTheDocument();
    // the others stay quiet until they are left too
    expect(screen.queryByText(/Enter your last name in Arabic/)).toBeNull();
  });
});
