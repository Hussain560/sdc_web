import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Avatar,
  AvatarGroup,
  Card,
  CardLink,
  EmptyState,
  Media,
  SkeletonEventCard,
  SkeletonGroup,
  SkeletonLines,
  initialsOf,
} from '@/components/ui';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: { href: string }) => <a href={href} {...rest} />,
}));

describe('Card', () => {
  it('plain is the dashboard card (24 px radius, 20 px padding)', () => {
    const { container } = render(<Card>x</Card>);
    expect(container.firstChild).toHaveClass('rounded-shape-xl', 'p-5');
  });

  it('interactive card has one stretched link', () => {
    render(
      <Card variant="surface" interactive>
        <h3>
          <CardLink href="/events/a">Workshop</CardLink>
        </h3>
      </Card>,
    );
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveClass('after:absolute', 'after:inset-0');
  });

  it('cta uses the soft accent fill', () => {
    const { container } = render(<Card variant="cta">x</Card>);
    expect(container.firstChild).toHaveClass('bg-accent-soft');
  });
});

describe('Avatar', () => {
  it('initials: one letter for Arabic, two for Latin', () => {
    expect(initialsOf('حسين الغامدي')).toBe('ح');
    expect(initialsOf('Sara Al Otaibi')).toBe('SO');
    expect(initialsOf('sara')).toBe('S');
    expect(initialsOf('   ')).toBe('');
  });

  it('is decorative without alt and labelled with alt', () => {
    const { rerender, container } = render(<Avatar name="Sara Ali" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    rerender(<Avatar name="Sara Ali" alt="Sara Ali" />);
    expect(screen.getByRole('img', { name: 'Sara Ali' })).toBeInTheDocument();
  });

  it('shows the photo only when a src is given, otherwise initials', () => {
    const { container, rerender } = render(<Avatar name="Sara Ali" src="/p.jpg" />);
    expect(container.querySelector('img')).not.toBeNull();
    rerender(<Avatar name="Sara Ali" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container).toHaveTextContent('SA');
  });

  it('group caps the avatars and shows +N', () => {
    const people = Array.from({ length: 7 }, (_, i) => ({ name: `Person ${i}` }));
    render(<AvatarGroup people={people} max={4} moreLabel="3 more" />);
    expect(screen.getByRole('img', { name: '3 more' })).toHaveTextContent('+3');
  });
});

describe('Media', () => {
  it('falls back to the motif with the content icon when there is no source', () => {
    const { container } = render(<Media alt="Cover" kind="event" />);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.motif-dots')).not.toBeNull();
    expect(screen.getByRole('img', { name: 'Cover' })).toBeInTheDocument();
  });

  it('falls back after an image error and keeps the ratio box', () => {
    const { container } = render(<Media src="/missing.jpg" alt="Cover" ratio="3/4" />);
    const img = container.querySelector('img')!;
    fireEvent.error(img);
    expect(container.querySelector('img')).toBeNull();
    expect(container.firstChild).toHaveClass('aspect-[3/4]');
  });

  it('decorative image gets no accessible name', () => {
    const { container } = render(<Media src="/a.jpg" alt="" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});

describe('EmptyState and Skeleton', () => {
  it('v2 variant renders title, sentence and a single action', () => {
    render(
      <EmptyState
        variant="no-results"
        title="Nothing matches"
        description="Try fewer filters."
        action={<button>Clear filters</button>}
      />,
    );
    expect(screen.getByText('Nothing matches')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('legacy dashed look still works', () => {
    const { container } = render(<EmptyState title="Empty" />);
    expect(container.firstChild).toHaveClass('border-dashed');
  });

  it('skeleton group is busy and announces loading once', () => {
    const { container } = render(
      <SkeletonGroup label="Loading…">
        <SkeletonLines />
        <SkeletonEventCard />
      </SkeletonGroup>,
    );
    expect(container.firstChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });
});
