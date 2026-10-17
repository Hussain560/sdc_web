import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/ui';
import { AssignRoleDialog } from '@/modules/access/components/AssignRoleDialog';
import type { AssignableSearch } from '@/modules/access/actions';

const actions = vi.hoisted(() => ({ search: vi.fn(), assign: vi.fn(), handover: vi.fn() }));
vi.mock('@/modules/access/actions', () => ({
  searchAssignableUsers: actions.search,
  assignRole: actions.assign,
  handoverHead: actions.handover,
}));
vi.mock('@/context/LanguageContext', () => ({ useLanguage: () => ({ lang: 'en' }) }));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: { href: string }) => <a href={href} {...rest} />,
  useRouter: () => ({ refresh: vi.fn() }),
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

const row = (over: Partial<AssignableSearch['rows'][number]> = {}) => ({
  memberId: 'm1',
  userId: 'u1',
  nameAr: 'عبدالرحمن القحطاني',
  nameEn: 'Abdulrahman Alqahtani',
  email: 'a@example.test',
  photoPath: null,
  activated: true,
  inCommittee: false,
  roleAr: null,
  roleEn: null,
  ...over,
});
const found = (over: Partial<AssignableSearch> = {}): { ok: true; data: AssignableSearch } => ({
  ok: true,
  data: { restricted: false, head: null, rows: [row()], ...over },
});

const roles = [
  {
    key: 'committee_member',
    name: { ar: 'عضو لجنة', en: 'Committee member' },
    scope: 'committee',
    permissions: [],
  },
  {
    key: 'committee_head',
    name: { ar: 'قائد لجنة', en: 'Committee head' },
    scope: 'committee',
    permissions: [],
  },
] as never;
const committees = [
  { id: 'c-ai', slug: 'ai', name: { ar: 'الذكاء الاصطناعي', en: 'AI' }, status: 'active' },
] as never;

function open(props: Partial<React.ComponentProps<typeof AssignRoleDialog>> = {}) {
  return render(
    <ToastProvider>
      <AssignRoleDialog
        roles={roles}
        committees={committees}
        permissionLabels={{}}
        canHandover
        {...props}
      />
    </ToastProvider>,
  );
}

async function openAndSearch(user: ReturnType<typeof userEvent.setup>, q = 'qaht') {
  await user.click(screen.getByRole('button', { name: '+ Assign position' }));
  await user.type(screen.getByRole('combobox', { name: /Member/ }), q);
}

beforeEach(() => {
  actions.search.mockReset();
  actions.assign.mockReset();
  actions.handover.mockReset();
  actions.search.mockResolvedValue(found());
});

describe('AssignRoleDialog', () => {
  it('searches members and shows the person with e-mail, in English when the page is English', async () => {
    const user = userEvent.setup();
    open();
    await openAndSearch(user);
    const opt = await screen.findByRole('option', { name: /Abdulrahman Alqahtani/ });
    expect(within(opt).getByText('a@example.test')).toBeInTheDocument();
    expect(actions.search).toHaveBeenCalledWith('qaht', undefined);
  });

  it('shows who is not activated and who already holds a position in the committee', async () => {
    actions.search.mockResolvedValue(
      found({
        rows: [
          row({ userId: 'u1', inCommittee: true, roleEn: 'Committee head', roleAr: 'قائد' }),
          row({ userId: 'u2', nameEn: 'Naif Alqahtani', nameAr: 'نايف', activated: false }),
        ],
      }),
    );
    const user = userEvent.setup();
    open({ fixedCommitteeId: 'c-ai' });
    await openAndSearch(user);
    expect(await screen.findByText('Members of this committee')).toBeInTheDocument();
    expect(screen.getByText('Other members')).toBeInTheDocument();
    expect(screen.getByText('Committee head', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('Not activated')).toBeInTheDocument();
    expect(actions.search).toHaveBeenCalledWith('qaht', 'c-ai');
  });

  it('says so when the search is limited instead of staying silent', async () => {
    actions.search.mockResolvedValue(found({ restricted: true, rows: [] }));
    const user = userEvent.setup();
    open({ fixedCommitteeId: 'c-ai' });
    await openAndSearch(user);
    expect(await screen.findByRole('note')).toHaveTextContent(/cannot search every user/);
  });

  it('answers nobody found, with a way to add the person as a member', async () => {
    actions.search.mockResolvedValue(found({ rows: [] }));
    const user = userEvent.setup();
    open({ addMemberHref: '/dashboard/members' });
    await openAndSearch(user, 'zzzz');
    expect(await screen.findByText('Nobody with this name or e-mail')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Add them as a new member/ })).toHaveAttribute(
      'href',
      '/dashboard/members',
    );
  });

  it('shows an error with a retry that searches again', async () => {
    actions.search.mockResolvedValueOnce({ ok: false, code: 'INTERNAL', message: 'x' });
    const user = userEvent.setup();
    open();
    await openAndSearch(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('Search is unavailable');
    actions.search.mockResolvedValueOnce(found());
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('option', { name: /Abdulrahman/ })).toBeInTheDocument();
  });

  it('assigns the chosen person to the chosen position', async () => {
    actions.assign.mockResolvedValue({ ok: true, data: { id: 'a1' } });
    const user = userEvent.setup();
    open({ fixedCommitteeId: 'c-ai' });
    await openAndSearch(user);
    await user.click(await screen.findByRole('option', { name: /Abdulrahman/ }));
    await user.selectOptions(screen.getByLabelText('Position *'), 'committee_member');
    await user.click(screen.getByRole('button', { name: 'Assign' }));
    await waitFor(() => expect(actions.assign).toHaveBeenCalledOnce());
    expect(actions.assign.mock.calls[0]![0]).toMatchObject({
      userId: 'u1',
      roleKey: 'committee_member',
      committeeId: 'c-ai',
    });
  });

  it('cannot be saved before a person is chosen', async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('button', { name: '+ Assign position' }));
    expect(screen.getByRole('button', { name: 'Assign' })).toBeDisabled();
  });

  it('names the current head, and saving hands over; the old head can stay as deputy', async () => {
    actions.search.mockImplementation(async (q: string) =>
      q === '' ? found({ head: { nameAr: 'قائد سابق', nameEn: 'Old Head' }, rows: [] }) : found(),
    );
    actions.handover.mockResolvedValue({ ok: true, data: { id: 'a2' } });
    const user = userEvent.setup();
    open({ fixedCommitteeId: 'c-ai' });
    await openAndSearch(user);
    await user.click(await screen.findByRole('option', { name: /Abdulrahman/ }));
    await user.selectOptions(screen.getByLabelText('Position *'), 'committee_head');
    expect(await screen.findByText(/This committee has a head: Old Head/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /Make Old Head the deputy head/ }));
    await user.click(screen.getByRole('button', { name: 'Hand over leadership' }));
    await waitFor(() => expect(actions.handover).toHaveBeenCalledOnce());
    expect(actions.handover.mock.calls[0]![0]).toMatchObject({
      committeeId: 'c-ai',
      newHeadUserId: 'u1',
      keepAsDeputy: true,
    });
    expect(actions.assign).not.toHaveBeenCalled();
  });
});
