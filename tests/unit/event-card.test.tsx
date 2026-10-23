import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EventCard, eventWhen } from '@/modules/events/components/EventCard';
import { FALLBACK_COVER, type PublicEventCard } from '@/modules/events/public-types';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const NOW = Date.parse('2026-10-10T09:00:00Z');
const card = (o: Partial<PublicEventCard> = {}): PublicEventCard => ({
  id: 'e1',
  slug: 'demo',
  titleAr: 'ورشة',
  titleEn: 'A workshop',
  locationAr: null,
  locationEn: 'Riyadh',
  startDate: '2026-10-20',
  endDate: '2026-10-20',
  startTime: '18:00:00',
  endTime: '20:00:00',
  phase: 'registration_open',
  cover: '/covers/a.png',
  seatsLeft: 12,
  access: 'public',
  waitlistEnabled: false,
  ...o,
});

describe('EventCard', () => {
  it('shows the type on the cover, the status and one link to the event', () => {
    const { container } = render(
      <EventCard event={card()} lang="en" now={NOW} typeLabel="Workshop" />,
    );
    expect(screen.getByText('Workshop')).toBeInTheDocument();
    expect(screen.getByText('Registration open')).toBeInTheDocument();
    expect(screen.getByText('12 seats left')).toBeInTheDocument();
    expect(container.querySelectorAll('a')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'A workshop' })).toHaveAttribute(
      'href',
      '/events/demo',
    );
  });

  it('tags a members-only event without hiding its status', () => {
    render(<EventCard event={card({ access: 'members_only' })} lang="en" now={NOW} />);
    expect(screen.getByText('Members only')).toBeInTheDocument();
    expect(screen.getByText('Registration open')).toBeInTheDocument();
  });

  it('says "Full · waiting list" only when the organisers enabled one', () => {
    const full = card({ seatsLeft: 0 });
    const { rerender } = render(<EventCard event={full} lang="en" now={NOW} />);
    expect(screen.getByText('Full')).toBeInTheDocument();
    rerender(<EventCard event={{ ...full, waitlistEnabled: true }} lang="en" now={NOW} />);
    expect(screen.getByText('Full · waiting list')).toBeInTheDocument();
  });

  it('draws the capsule mark instead of the placeholder picture when there is no cover', () => {
    const { container, rerender } = render(
      <EventCard event={card({ cover: FALLBACK_COVER })} lang="en" now={NOW} />,
    );
    // The emblem is itself an image, so the placeholder is identified by its source.
    expect(container.querySelector('img')).toHaveAttribute('src', '/assets/brand/sdc-mark.svg');
    rerender(<EventCard event={card()} lang="en" now={NOW} />);
    expect(container.querySelector('img')).toHaveAttribute('src', '/covers/a.png');
  });

  it('shows seats only while registration is open and some are left', () => {
    render(<EventCard event={card({ phase: 'ended', seatsLeft: 5 })} lang="en" now={NOW} />);
    expect(screen.queryByText(/seats left/)).toBeNull();
  });
});

describe('eventWhen', () => {
  it('joins the date and the 12-hour time', () => {
    expect(eventWhen(card(), 'en')).toBe('20 Oct 2026 · 6:00 – 8:00 PM');
  });

  it('is only the date when no time is set, and the announcement line when undated', () => {
    expect(eventWhen(card({ startTime: null, endTime: null }), 'en')).toBe('20 Oct 2026');
    expect(eventWhen(card({ startDate: null, endDate: null }), 'en')).toBe('To be announced soon');
  });
});
