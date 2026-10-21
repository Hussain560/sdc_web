import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AddMemberWizard } from '@/modules/members/components/AddMemberWizard';

const actions = vi.hoisted(() => ({
  create: vi.fn(),
  check: vi.fn(),
  resend: vi.fn(),
  search: vi.fn(),
}));
vi.mock('@/modules/members/actions', () => ({
  createMember: actions.create,
  checkMemberEmail: actions.check,
  resendMemberActivation: actions.resend,
}));
vi.mock('@/modules/access/actions', () => ({ searchAssignableUsers: actions.search }));
vi.mock('@/lib/min-duration', () => ({ withMinimumDuration: <T,>(p: Promise<T>) => p }));
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

const reference = {
  universities: [{ id: 1, nameAr: 'جامعة الملك فيصل', nameEn: 'King Faisal University' }],
  majors: [{ id: 2, nameAr: 'علوم الحاسب', nameEn: 'Computer science' }],
  tracks: [{ id: 3, nameAr: 'الذكاء الاصطناعي', nameEn: 'AI' }],
};
const committees = [
  { id: 'c-ai', slug: 'ai', name: { ar: 'لجنة الذكاء', en: 'AI committee' }, status: 'active' },
] as never;
const roles = [
  { key: 'committee_member', name: { ar: 'عضو', en: 'Member' } },
  { key: 'committee_deputy', name: { ar: 'نائب', en: 'Deputy' } },
  { key: 'committee_head', name: { ar: 'قائد', en: 'Head' } },
];

function setup(props: Partial<React.ComponentProps<typeof AddMemberWizard>> = {}) {
  return render(
    <AddMemberWizard
      reference={reference}
      committees={committees}
      roles={roles}
      canAssign
      {...props}
    />,
  );
}

async function fillIdentity(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/First name \(Arabic\)/), 'خالد');
  await user.type(screen.getByLabelText(/Last name \(Arabic\)/), 'الهاجري');
  await user.type(screen.getByLabelText(/First name \(English\)/), 'Khalid');
  await user.type(screen.getByLabelText(/Last name \(English\)/), 'Alhajri');
  await user.type(screen.getByLabelText(/^E-mail/), 'khalid.h@example.com');
}
const next = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Next' }));

async function toReview(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Add member' }));
  await fillIdentity(user);
  await next(user);
  await user.click(screen.getByRole('radio', { name: 'Student' }));
  await next(user);
  await next(user); // position is optional
}

beforeEach(() => {
  Object.values(actions).forEach((a) => a.mockReset());
  actions.check.mockResolvedValue({ ok: true, data: { account: false, member: null } });
  actions.search.mockResolvedValue({ ok: true, data: { restricted: false, head: null, rows: [] } });
  actions.create.mockResolvedValue({
    ok: true,
    data: { id: 'm1', userId: 'u1', emailStatus: 'sent', activationLinked: true },
  });
});

describe('AddMemberWizard', () => {
  it('has four steps, and three when the person cannot give positions', async () => {
    const user = userEvent.setup();
    const a = setup();
    await user.click(screen.getByRole('button', { name: 'Add member' }));
    const nav = screen.getByRole('navigation', { name: 'Add member steps' });
    expect(within(nav).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
    a.unmount();
    setup({ canAssign: false });
    await user.click(screen.getByRole('button', { name: 'Add member' }));
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
  });

  it('does not move on with missing names, and says which', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Add member' }));
    await next(user);
    expect(screen.getByText('Enter the first name in Arabic.')).toBeInTheDocument();
    expect(screen.getByText('Enter the last name in English.')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid e-mail address.')).toBeInTheDocument();
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('warns on the first step when the e-mail already belongs to a member, and blocks Next', async () => {
    actions.check.mockResolvedValue({
      ok: true,
      data: {
        account: true,
        member: { id: 'x1', nameAr: 'سارة العتيبي', nameEn: 'Sara Alotaibi' },
      },
    });
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Add member' }));
    await fillIdentity(user);
    await user.tab();
    expect(await screen.findByText(/belongs to another member:/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the record' })).toHaveAttribute(
      'href',
      '/dashboard/members/x1',
    );
    await next(user);
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
  });

  it('goes through the steps, shows a review and creates the member once', async () => {
    const user = userEvent.setup();
    setup();
    await toReview(user);
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
    expect(screen.getByText('One activation e-mail will be sent.')).toBeInTheDocument();
    expect(screen.getAllByText(/Khalid Alhajri/).length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole('button', { name: 'Add member' }).at(-1)!);
    await waitFor(() => expect(actions.create).toHaveBeenCalledOnce());
    expect(actions.create.mock.calls[0]![0]).toMatchObject({
      firstNameAr: 'خالد',
      lastNameEn: 'Alhajri',
      email: 'khalid.h@example.com',
      academicStatus: 'student',
    });
    expect('roleKey' in actions.create.mock.calls[0]![0]).toBe(false);
    expect(
      await screen.findByRole('heading', { name: 'Khalid Alhajri was added' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/activation e-mail sent to khalid.h@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View member' })).toHaveAttribute(
      'href',
      '/dashboard/members/m1',
    );
  });

  it('sends the position with the member, in the same call', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Add member' }));
    await fillIdentity(user);
    await next(user);
    await user.click(screen.getByRole('radio', { name: 'Student' }));
    await next(user);
    await user.selectOptions(screen.getByLabelText('Committee'), 'c-ai');
    await user.click(screen.getByRole('radio', { name: 'Member' }));
    await next(user);
    expect(screen.getByText(/AI committee/)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: 'Add member' }).at(-1)!);
    await waitFor(() => expect(actions.create).toHaveBeenCalledOnce());
    expect(actions.create.mock.calls[0]![0]).toMatchObject({
      committeeId: 'c-ai',
      roleKey: 'committee_member',
    });
  });

  it('names the current head, and the old head can stay as deputy', async () => {
    actions.search.mockResolvedValue({
      ok: true,
      data: { restricted: false, head: { nameAr: 'بدر', nameEn: 'Badr' }, rows: [] },
    });
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Add member' }));
    await fillIdentity(user);
    await next(user);
    await user.click(screen.getByRole('radio', { name: 'Student' }));
    await next(user);
    await user.selectOptions(screen.getByLabelText('Committee'), 'c-ai');
    await user.click(screen.getByRole('radio', { name: 'Head' }));
    expect(await screen.findByText(/This committee has a head: Badr/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /Make Badr the deputy head/ }));
    await next(user);
    await user.click(screen.getAllByRole('button', { name: 'Add member' }).at(-1)!);
    await waitFor(() => expect(actions.create).toHaveBeenCalledOnce());
    expect(actions.create.mock.calls[0]![0]).toMatchObject({
      roleKey: 'committee_head',
      handover: true,
      keepAsDeputy: true,
    });
  });

  it('a committee needs a position and a position needs a committee', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Add member' }));
    await fillIdentity(user);
    await next(user);
    await user.click(screen.getByRole('radio', { name: 'Student' }));
    await next(user);
    await user.selectOptions(screen.getByLabelText('Committee'), 'c-ai');
    await next(user);
    expect(screen.getByText('Choose the position.')).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
  });

  it('says when the e-mail is delayed and can send it again', async () => {
    actions.create.mockResolvedValue({
      ok: true,
      data: { id: 'm1', userId: 'u1', emailStatus: 'queued', activationLinked: true },
    });
    actions.resend.mockResolvedValue({ ok: true, data: { emailStatus: 'sent' } });
    const user = userEvent.setup();
    setup();
    await toReview(user);
    await user.click(screen.getAllByRole('button', { name: 'Add member' }).at(-1)!);
    expect(
      await screen.findByText('The member was added, but the e-mail is delayed'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send again now' }));
    await waitFor(() => expect(actions.resend).toHaveBeenCalledWith('m1', { lang: 'en' }));
    expect(
      await screen.findByRole('heading', { name: 'Khalid Alhajri was added' }),
    ).toBeInTheDocument();
  });

  it('explains a failure, saves nothing, and goes back to the review with the data kept', async () => {
    actions.create.mockResolvedValue({
      ok: false,
      code: 'INTERNAL',
      message: 'Something went wrong.',
    });
    const user = userEvent.setup();
    setup();
    await toReview(user);
    await user.click(screen.getAllByRole('button', { name: 'Add member' }).at(-1)!);
    expect(await screen.findByText('We could not add the member')).toBeInTheDocument();
    expect(screen.getByText(/Nothing was saved and no e-mail was sent/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to review' }));
    // The names are still there: the review lists them.
    expect((await screen.findAllByText(/Khalid Alhajri/)).length).toBeGreaterThan(0);
    expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
  });

  it('a head conflict sends the person back to the position step to resolve it', async () => {
    actions.create.mockResolvedValue({
      ok: false,
      code: 'HEAD_ALREADY_ACTIVE',
      message: 'This committee already has an active head.',
    });
    const user = userEvent.setup();
    setup();
    await toReview(user);
    await user.click(screen.getAllByRole('button', { name: 'Add member' }).at(-1)!);
    await user.click(await screen.findByRole('button', { name: 'Back to review' }));
    expect(await screen.findByText('Step 3 of 4')).toBeInTheDocument();
  });
});
