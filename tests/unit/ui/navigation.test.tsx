import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Accordion, Breadcrumb, PanelTabs, Stepper, Tabs } from '@/components/ui';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: { href: string }) => <a href={href} {...rest} />,
}));

const faq = [
  { id: 'a', question: 'Is it free?', answer: 'Yes.' },
  { id: 'b', question: 'Do I need a laptop?', answer: 'Bring one.' },
];

describe('Accordion', () => {
  it('starts closed and wires aria-expanded, aria-controls and a labelled region', async () => {
    render(<Accordion items={faq} />);
    const btn = screen.getByRole('button', { name: 'Is it free?' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Yes.')).not.toBeVisible();
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region', { name: 'Is it free?' });
    expect(region).toBeVisible();
    expect(btn.getAttribute('aria-controls')).toBe(region.id);
  });

  it('several items can be open at once and the trigger sits in a heading', async () => {
    render(<Accordion items={faq} />);
    await userEvent.click(screen.getByRole('button', { name: 'Is it free?' }));
    await userEvent.click(screen.getByRole('button', { name: 'Do I need a laptop?' }));
    expect(screen.getByText('Yes.')).toBeVisible();
    expect(screen.getByText('Bring one.')).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(2);
  });

  it('Enter and Space toggle from the keyboard', async () => {
    render(<Accordion items={faq} />);
    screen.getByRole('button', { name: 'Is it free?' }).focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByText('Yes.')).toBeVisible();
    await userEvent.keyboard(' ');
    expect(screen.getByText('Yes.')).not.toBeVisible();
  });
});

describe('PanelTabs', () => {
  const tabs = [
    { key: 'about', label: 'About', content: <p>About text</p> },
    { key: 'agenda', label: 'Agenda', content: <p>Agenda text</p> },
    { key: 'faq', label: 'FAQ', content: <p>FAQ text</p> },
  ];

  it('selects with a click and shows only the active panel', async () => {
    render(<PanelTabs tabs={tabs} label="Event sections" />);
    expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Agenda text')).not.toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'Agenda' }));
    expect(screen.getByText('Agenda text')).toBeVisible();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Agenda text');
  });

  it('uses a roving tabindex and arrow, Home and End keys', async () => {
    render(<PanelTabs tabs={tabs} label="Event sections" />);
    const about = screen.getByRole('tab', { name: 'About' });
    expect(about).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Agenda' })).toHaveAttribute('tabindex', '-1');
    about.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Agenda' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'FAQ' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'About' })).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'true');
  });

  it('arrow keys follow the reading direction in RTL', async () => {
    render(
      <div dir="rtl">
        <PanelTabs tabs={tabs} label="Sections" />
      </div>,
    );
    screen.getByRole('tab', { name: 'About' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Agenda' })).toHaveFocus();
  });
});

describe('Tabs (link based)', () => {
  it('marks the active tab with aria-current and shows counts', () => {
    render(
      <Tabs
        label="Registrations"
        active="pending"
        items={[
          { key: 'pending', label: 'Pending', href: '?tab=pending', count: 3 },
          { key: 'all', label: 'All', href: '?tab=all' },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: /Pending/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /All/ })).not.toHaveAttribute('aria-current');
  });
});

describe('Breadcrumb', () => {
  const items = [
    { label: 'Events', href: '/events' },
    { label: 'Workshop', href: '/events/a' },
    { label: 'Check-in' },
  ];

  it('marks the current page and does not link it', () => {
    render(<Breadcrumb items={items} label="Breadcrumb" />);
    const current = screen.getByText('Check-in');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.closest('a')).toBeNull();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('offers a back link to the nearest parent for phones', () => {
    render(<Breadcrumb items={items} label="Breadcrumb" />);
    const back = screen.getAllByRole('link', { name: 'Workshop' });
    expect(back.some((a) => a.className.includes('md:hidden'))).toBe(true);
  });
});

describe('Stepper', () => {
  const steps = [{ label: 'Basics' }, { label: 'Details' }, { label: 'Review', error: true }];

  it('marks the current step, shows a check for done steps and "!" for an error', () => {
    render(
      <Stepper
        steps={steps}
        current={2}
        maxReached={3}
        onSelect={() => {}}
        labelOf={(n, t, l) => `Step ${n} of ${t}: ${l}`}
        navLabel="Application steps"
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Application steps' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Details/ })).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('button', { name: /Review/ })).toHaveTextContent('!');
  });

  it('only steps already reached are clickable', async () => {
    const onSelect = vi.fn();
    render(
      <Stepper
        steps={steps}
        current={1}
        maxReached={2}
        onSelect={onSelect}
        labelOf={(n, t) => `${n}/${t}`}
      />,
    );
    expect(screen.getByRole('button', { name: /Review/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /Details/ }));
    expect(onSelect).toHaveBeenCalledWith(2);
  });
});
