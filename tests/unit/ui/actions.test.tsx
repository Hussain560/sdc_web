import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  Button,
  IconButton,
  LinkButton,
  SegmentedToggle,
  TextLink,
  buttonClasses,
} from '@/components/ui';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: { href: string }) => <a href={href} {...rest} />,
}));

describe('Button', () => {
  it('renders every variant and size without throwing', () => {
    for (const variant of [
      'primary',
      'secondary',
      'brand',
      'ghost',
      'destructive',
      'danger',
      'link',
    ] as const)
      for (const size of ['sm', 'md', 'lg'] as const)
        expect(buttonClasses({ variant, size })).toContain('rounded-full');
  });

  it('keeps `danger` as an alias of `destructive`', () => {
    expect(buttonClasses({ variant: 'danger' })).toBe(buttonClasses({ variant: 'destructive' }));
  });

  it('loading keeps the label, shows a spinner and is busy and disabled', () => {
    render(<Button loading>Sending…</Button>);
    const btn = screen.getByRole('button', { name: 'Sending…' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    expect(btn.querySelector('svg')).not.toBeNull();
  });

  it('fullWidth and icons are rendered', () => {
    render(
      <Button fullWidth iconStart={<i data-testid="start" />} iconEnd={<i data-testid="end" />}>
        Go
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveClass('w-full');
    expect(screen.getByTestId('start')).toBeInTheDocument();
    expect(screen.getByTestId('end')).toBeInTheDocument();
  });

  it('LinkButton is a link that looks like a button', () => {
    render(<LinkButton href="/join">Join us</LinkButton>);
    const link = screen.getByRole('link', { name: 'Join us' });
    expect(link).toHaveAttribute('href', '/join');
    expect(link).toHaveClass('rounded-full');
  });
});

describe('IconButton', () => {
  it('has an accessible name and reports pressed state', async () => {
    const onClick = vi.fn();
    render(
      <IconButton label="Dark theme" pressed onClick={onClick}>
        <i />
      </IconButton>,
    );
    const btn = screen.getByRole('button', { name: 'Dark theme' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });
});

describe('TextLink', () => {
  it('nav link marks the current page', () => {
    render(
      <TextLink href="/events" variant="nav" active>
        Events
      </TextLink>,
    );
    expect(screen.getByRole('link', { name: 'Events' })).toHaveAttribute('aria-current', 'page');
  });

  it('external link opens safely and announces the new tab', () => {
    render(
      <TextLink href="https://maps.example" external externalLabel="(opens in a new tab)">
        Map
      </TextLink>,
    );
    const link = screen.getByRole('link', { name: /Map/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
    expect(link).toHaveTextContent('(opens in a new tab)');
  });
});

describe('SegmentedToggle', () => {
  function Demo() {
    const [v, setV] = useState<'upcoming' | 'past'>('upcoming');
    return (
      <SegmentedToggle
        label="Events"
        value={v}
        onChange={setV}
        options={[
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past' },
        ]}
      />
    );
  }

  it('is a radio group and selecting changes the value', async () => {
    render(<Demo />);
    expect(screen.getByRole('radio', { name: 'Upcoming' })).toBeChecked();
    await userEvent.click(screen.getByText('Past'));
    expect(screen.getByRole('radio', { name: 'Past' })).toBeChecked();
    expect(screen.getByRole('group', { name: 'Events' })).toBeInTheDocument();
  });

  it('arrow keys move the selection', async () => {
    render(<Demo />);
    screen.getByRole('radio', { name: 'Upcoming' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Past' })).toBeChecked();
  });
});
