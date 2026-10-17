import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  Combobox,
  splitMatch,
  type ComboOption,
  type ComboStatus,
  type ComboTexts,
} from '@/components/ui/Combobox';

const texts: ComboTexts = {
  hint: 'Type at least two letters',
  loading: 'Searching…',
  noResults: 'Nobody matches',
  noResultsHint: 'Try another part of the name',
  error: 'Search is unavailable',
  retry: 'Try again',
  restricted: 'You may only pick members of your committee',
  keys: 'Arrows to move, Enter to choose, Esc to close',
  count: (n) => `${n} results`,
  change: 'Change',
};

const people: ComboOption[] = [
  {
    id: 'a',
    label: 'Abdulrahman Alqahtani',
    sublabel: 'a@example.com',
    avatar: { name: 'Abdulrahman' },
    group: 'This committee',
    badge: { text: 'Head' },
  },
  {
    id: 'b',
    label: 'Salma Alqahtani',
    sublabel: 'b@example.com',
    avatar: { name: 'Salma' },
    group: 'Other members',
  },
  {
    id: 'c',
    label: 'Naif Alqahtani',
    sublabel: 'c@example.com',
    avatar: { name: 'Naif' },
    group: 'Other members',
    badge: { text: 'Not activated', tone: 'info' },
  },
];

function Harness({
  status = 'ready',
  options = people,
  onSelect = () => {},
  onRetry,
}: {
  status?: ComboStatus;
  options?: ComboOption[];
  onSelect?: (o: ComboOption) => void;
  onRetry?: () => void;
}) {
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<ComboOption | null>(null);
  return (
    <Combobox
      label="Member"
      query={q}
      onQueryChange={setQ}
      options={options}
      status={status}
      selected={picked}
      onSelect={(o) => {
        setPicked(o);
        onSelect(o);
      }}
      onClear={() => setPicked(null)}
      onRetry={onRetry}
      texts={texts}
    />
  );
}

vi.mock('@/i18n/navigation', () => ({ Link: 'a' }));

describe('splitMatch', () => {
  it('splits around the first case-insensitive match', () => {
    expect(splitMatch('Abdulrahman Alqahtani', 'qah')).toEqual(['Abdulrahman Al', 'qah', 'tani']);
    expect(splitMatch('Naif', 'zz')).toEqual(['Naif', '', '']);
    expect(splitMatch('Naif', '  ')).toEqual(['Naif', '', '']);
  });
});

describe('Combobox', () => {
  it('shows the hint first and follows the ARIA combobox pattern', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const box = screen.getByRole('combobox', { name: 'Member' });
    expect(screen.getByText('Type at least two letters')).toBeInTheDocument();
    expect(box).toHaveAttribute('aria-expanded', 'false');
    await user.type(box, 'qa');
    expect(box).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(box).toHaveAttribute('aria-activedescendant', screen.getAllByRole('option')[0]!.id);
  });

  it('groups the options under headings', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole('combobox'), 'qa');
    expect(screen.getByText('This committee')).toBeInTheDocument();
    expect(screen.getByText('Other members')).toBeInTheDocument();
  });

  it('moves with the arrows, wraps around and chooses with Enter', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    const box = screen.getByRole('combobox');
    await user.type(box, 'qa');
    await user.keyboard('{ArrowDown}');
    expect(screen.getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getAllByRole('option')[2]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'c' }));
    expect(screen.getByText('Naif Alqahtani')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });

  it('Escape closes the list and stops the key from reaching a dialog around it', async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    render(
      <div onKeyDown={outer}>
        <Harness />
      </div>,
    );
    const box = screen.getByRole('combobox');
    await user.type(box, 'qa');
    await user.keyboard('{Escape}');
    expect(box).toHaveAttribute('aria-expanded', 'false');
    expect(outer).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }));
  });

  it('lets the person change the choice', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole('combobox'), 'qa');
    await user.click(screen.getAllByRole('option')[0]!);
    await user.click(screen.getByRole('button', { name: 'Change' }));
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('announces the number of results politely', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole('combobox'), 'qa');
    expect(screen.getByText('3 results')).toBeInTheDocument();
  });

  it('answers a search with nobody found instead of an empty list', async () => {
    const user = userEvent.setup();
    render(<Harness options={[]} />);
    await user.type(screen.getByRole('combobox'), 'zz');
    expect(screen.getByText('Nobody matches')).toBeInTheDocument();
    expect(screen.getByText('Try another part of the name')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows a loading state', async () => {
    const user = userEvent.setup();
    render(<Harness status="loading" options={[]} />);
    await user.type(screen.getByRole('combobox'), 'qa');
    expect(screen.getByText('Searching…')).toBeInTheDocument();
  });

  it('shows an error with a retry that works', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<Harness status="error" options={[]} onRetry={onRetry} />);
    await user.type(screen.getByRole('combobox'), 'qa');
    expect(screen.getByRole('alert')).toHaveTextContent('Search is unavailable');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('says why the search is limited instead of staying silent', async () => {
    const user = userEvent.setup();
    render(<Harness status="restricted" options={[]} />);
    await user.type(screen.getByRole('combobox'), 'qa');
    expect(screen.getByRole('note')).toHaveTextContent(
      'You may only pick members of your committee',
    );
  });

  it('does not search before the minimum number of letters', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByRole('combobox'), 'q');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });
});
