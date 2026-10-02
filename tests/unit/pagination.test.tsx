import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from '@/components/ui';
import { pageMeta, pageWindow, parsePage } from '@/lib/pagination';

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, ...rest }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('parsePage', () => {
  it('defaults to page 1, size 20', () => {
    expect(parsePage({})).toEqual({ page: 1, size: 20, from: 0, to: 19 });
  });

  it('reads page and an allowed size', () => {
    expect(parsePage({ page: '3', size: '50' })).toEqual({ page: 3, size: 50, from: 100, to: 149 });
  });

  it.each([
    [{ page: '0' }, 1],
    [{ page: '-4' }, 1],
    [{ page: 'abc' }, 1],
    [{ page: ['2', '9'] }, 2],
  ])('sanitises the page %j', (input, page) => {
    expect(parsePage(input).page).toBe(page);
  });

  it('ignores sizes that are not offered (no unbounded queries)', () => {
    expect(parsePage({ size: '100000' }).size).toBe(20);
    expect(parsePage({ size: '7' }).size).toBe(20);
  });
});

describe('pageMeta', () => {
  it('computes totals and the visible range', () => {
    expect(pageMeta(45, { page: 2, size: 20 })).toMatchObject({
      totalPages: 3,
      firstItem: 21,
      lastItem: 40,
    });
  });

  it('clamps a page past the end and handles empty lists', () => {
    expect(pageMeta(45, { page: 99, size: 20 }).page).toBe(3);
    expect(pageMeta(0, { page: 1, size: 20 })).toMatchObject({
      firstItem: 0,
      lastItem: 0,
      totalPages: 1,
    });
  });
});

describe('pageWindow', () => {
  it('shows everything for a few pages', () => {
    expect(pageWindow(2, 3)).toEqual([1, 2, 3]);
  });

  it('keeps first, last and a window with gaps', () => {
    expect(pageWindow(10, 20)).toEqual([1, null, 9, 10, 11, null, 20]);
    expect(pageWindow(1, 20)).toEqual([1, 2, null, 20]);
  });
});

describe('<Pagination />', () => {
  const meta = pageMeta(95, { page: 3, size: 20 });

  it('renders the summary, current page and keeps other filters in the links', () => {
    render(
      <Pagination meta={meta} searchParams={{ tab: 'history', q: 'sara', page: '3' }} lang="en" />,
    );
    expect(screen.getByText('Showing 41–60 of 95')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
    const next = screen.getByRole('link', { name: 'Next page' });
    expect(next).toHaveAttribute('href', expect.stringContaining('tab=history'));
    expect(next).toHaveAttribute('href', expect.stringContaining('q=sara'));
    expect(next).toHaveAttribute('href', expect.stringContaining('page=4'));
  });

  it('page 1 link drops the page parameter', () => {
    render(<Pagination meta={meta} searchParams={{ tab: 'history' }} lang="en" />);
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('href', '?tab=history');
  });

  it('disables previous on the first page and next on the last', () => {
    const { rerender } = render(
      <Pagination meta={pageMeta(95, { page: 1, size: 20 })} searchParams={{}} lang="en" />,
    );
    expect(screen.queryByRole('link', { name: 'Previous page' })).toBeNull();
    rerender(<Pagination meta={pageMeta(95, { page: 5, size: 20 })} searchParams={{}} lang="en" />);
    expect(screen.queryByRole('link', { name: 'Next page' })).toBeNull();
  });

  it('renders nothing for an empty list and speaks Arabic', () => {
    const { container, rerender } = render(
      <Pagination meta={pageMeta(0, { page: 1, size: 20 })} searchParams={{}} lang="en" />,
    );
    expect(container).toBeEmptyDOMElement();
    rerender(<Pagination meta={meta} searchParams={{}} lang="ar" />);
    expect(screen.getByText('عرض 41–60 من 95')).toBeInTheDocument();
  });

  it('changing the page size resets to page 1', () => {
    render(<Pagination meta={meta} searchParams={{ page: '3' }} lang="en" />);
    expect(screen.getByRole('link', { name: '50' })).toHaveAttribute('href', '?size=50');
  });
});
