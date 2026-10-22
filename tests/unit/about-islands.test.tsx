import { fireEvent, render, screen } from '@testing-library/react';
import type { FormEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TopicsMarquee } from '@/modules/about/components/TopicsMarquee';
import { ValuesList } from '@/modules/about/components/ValuesList';
import { VisionMission } from '@/modules/about/components/VisionMission';
import { FilterSelect, FilterSheet } from '@/components/patterns/FilterControls';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('VisionMission', () => {
  const setup = () =>
    render(
      <VisionMission
        title="Vision and mission"
        choose="Choose"
        vision={{ label: 'Our vision', text: 'The vision text' }}
        mission={{ label: 'Our mission', text: 'The mission text' }}
      />,
    );

  it('starts on the vision and announces changes politely', () => {
    setup();
    expect(screen.getByText('The vision text')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('radio', { name: 'Our vision' })).toBeChecked();
  });

  it('switches to the mission and back', () => {
    setup();
    fireEvent.click(screen.getByRole('radio', { name: 'Our mission' }));
    expect(screen.getByText('The mission text')).toBeInTheDocument();
    expect(screen.queryByText('The vision text')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Our vision' }));
    expect(screen.getByText('The vision text')).toBeInTheDocument();
  });
});

describe('ValuesList', () => {
  const items = [
    ['First value', 'First text'],
    ['Second value', 'Second text'],
  ] as const;

  it('shows every value and its text at once, with no button to press', () => {
    render(<ValuesList items={items} />);
    expect(screen.getByRole('heading', { name: 'First value' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Second value' })).toBeVisible();
    expect(screen.getByText('First text')).toBeVisible();
    expect(screen.getByText('Second text')).toBeVisible();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('keeps the values as an ordered list of cards', () => {
    render(<ValuesList items={items} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});

describe('TopicsMarquee', () => {
  it('lists the topics once for screen readers and pauses on request', () => {
    const { container } = render(
      <TopicsMarquee
        label="Fields"
        topics={['AI', 'Design']}
        pause="Pause motion"
        play="Play motion"
      />,
    );
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['AI', 'Design']);
    const region = screen.getByRole('region', { name: 'Fields' });
    expect(region).toHaveAttribute('data-paused', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }));
    expect(region).toHaveAttribute('data-paused', 'true');
    expect(screen.getByRole('button', { name: 'Play motion' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    // The moving copy is hidden from assistive technology.
    expect(container.querySelector('.m-marq-track')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('filter controls', () => {
  const sheet = (count: number) => (
    <FilterSheet
      label="Filters"
      count={count}
      title="Filter events"
      apply="Apply"
      closeLabel="Close"
    >
      <span />
    </FilterSheet>
  );

  it('shows how many filters are active on the sheet button', () => {
    const { rerender } = render(sheet(0));
    expect(screen.getByRole('button', { name: 'Filters' })).toBeInTheDocument();
    rerender(sheet(2));
    expect(screen.getByRole('button', { name: 'Filters (2)' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
  });

  it('sends the form when an auto select changes, and only then', () => {
    const submit = vi.fn((e: FormEvent) => e.preventDefault());
    render(
      <form onSubmit={submit}>
        <FilterSelect aria-label="auto" name="a" auto defaultValue="">
          <option value="">all</option>
          <option value="x">x</option>
        </FilterSelect>
        <FilterSelect aria-label="manual" name="b" defaultValue="">
          <option value="">all</option>
          <option value="y">y</option>
        </FilterSelect>
      </form>,
    );
    fireEvent.change(screen.getByLabelText('manual'), { target: { value: 'y' } });
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('auto'), { target: { value: 'x' } });
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
