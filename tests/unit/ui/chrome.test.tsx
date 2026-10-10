import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { isActive, realSocialUrl, socialLinks } from '@/components/layout/chrome-strings';
import { DEFAULT_SETTINGS } from '@/lib/site-settings-defaults';
import { SiteSettingsProvider } from '@/context/SiteSettingsContext';

const state = vi.hoisted(() => ({
  lang: 'ar' as 'ar' | 'en',
  auth: { isLoggedIn: false, loading: false, hasPosition: false, user: null as unknown },
  pathname: '/events',
}));

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...rest }: { href: string }) => <a href={href} {...rest} />,
  usePathname: () => state.pathname,
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/context/LanguageContext', () => ({
  useLanguage: () => ({
    lang: state.lang,
    toggleLanguage: vi.fn(),
    isSwitching: false,
    t: (k: string) => k,
  }),
}));
vi.mock('@/context/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: true, toggleTheme: vi.fn(), setTheme: vi.fn() }),
}));
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ ...state.auth, logout: vi.fn() }),
}));
vi.mock('next/image', () => ({
  default: ({ alt, ...rest }: { alt: string }) => <span role="img" aria-label={alt} {...rest} />,
}));

beforeEach(() => {
  state.lang = 'ar';
  state.auth = { isLoggedIn: false, loading: false, hasPosition: false, user: null };
  state.pathname = '/events';
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
});

describe('chrome helpers', () => {
  it('the placeholder instagram root and empty values count as missing', () => {
    expect(realSocialUrl('https://instagram.com')).toBeNull();
    expect(realSocialUrl('https://instagram.com/')).toBeNull();
    expect(realSocialUrl('')).toBeNull();
    expect(realSocialUrl('javascript:alert(1)')).toBeNull();
    expect(realSocialUrl('not a url')).toBeNull();
    expect(realSocialUrl('https://instagram.com/sdc_saudi')).toBe(
      'https://instagram.com/sdc_saudi',
    );
  });

  it('socialLinks drops the placeholder', () => {
    const keys = socialLinks(DEFAULT_SETTINGS).map((l) => l.key);
    expect(keys).toContain('x');
    expect(keys).toContain('linkedin');
    expect(keys).not.toContain('instagram');
  });

  it('home is active only on the exact path, others by prefix', () => {
    expect(isActive('/', '/')).toBe(true);
    expect(isActive('/events', '/')).toBe(false);
    expect(isActive('/events/my-event', '/events')).toBe(true);
    expect(isActive('/eventsx', '/events')).toBe(false);
  });
});

describe('SiteHeader', () => {
  it('has a skip link first, a labelled main nav and aria-current on the current page', () => {
    render(<SiteHeader />);
    const skip = screen.getAllByRole('link')[0]!;
    expect(skip).toHaveAttribute('href', '#main');
    const nav = screen.getAllByRole('navigation', { name: 'التنقل الرئيسي' })[0]!;
    expect(within(nav).getByRole('link', { name: 'الفعاليات' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'الرئيسية' })).not.toHaveAttribute('aria-current');
  });

  it('signed out: shows one Join us call to action and no search', () => {
    render(<SiteHeader />);
    expect(screen.getAllByRole('link', { name: 'انضم إلينا' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /بحث|search/i })).toBeNull();
  });

  it('signed in without a position: account menu has no dashboard entry', async () => {
    state.auth = {
      isLoggedIn: true,
      loading: false,
      hasPosition: false,
      user: { email: 'a@b.sa', user_metadata: {} },
    };
    render(<SiteHeader />);
    expect(screen.queryByRole('link', { name: 'انضم إلينا' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'قائمة الحساب' }));
    expect(screen.getByRole('link', { name: 'حسابي' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'لوحة التحكم' })).toBeNull();
  });

  it('signed in with a position: the dashboard entry appears', async () => {
    state.auth = {
      isLoggedIn: true,
      loading: false,
      hasPosition: true,
      user: { email: 'a@b.sa', user_metadata: { full_name: 'Sara' } },
    };
    render(<SiteHeader />);
    await userEvent.click(screen.getByRole('button', { name: 'قائمة الحساب' }));
    expect(screen.getByRole('link', { name: 'لوحة التحكم' })).toHaveAttribute('href', '/dashboard');
  });

  it('Esc closes the account menu', async () => {
    state.auth = {
      isLoggedIn: true,
      loading: false,
      hasPosition: false,
      user: { email: 'a@b.sa' },
    };
    render(<SiteHeader />);
    const btn = screen.getByRole('button', { name: 'قائمة الحساب' });
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    await userEvent.keyboard('{Escape}');
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('English labels', () => {
    state.lang = 'en';
    render(<SiteHeader />);
    expect(screen.getAllByRole('link', { name: 'Join us' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('navigation', { name: 'Main' }).length).toBeGreaterThan(0);
  });
});

describe('SiteFooter', () => {
  const renderFooter = (settings = DEFAULT_SETTINGS) =>
    render(
      <SiteSettingsProvider value={settings}>
        <SiteFooter />
      </SiteSettingsProvider>,
    );

  it('shows real social links and hides the placeholder instagram', () => {
    renderFooter();
    expect(screen.getAllByRole('link', { name: /X/ }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /Instagram/ })).toBeNull();
  });

  it('external links open in a new tab safely', () => {
    renderFooter();
    const links = screen.getAllByRole('link').filter((a) => a.getAttribute('target') === '_blank');
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) expect(a.getAttribute('rel')).toContain('noopener');
  });

  it('has member sign-in and privacy in the bottom bar and computes the year', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'دخول الأعضاء' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'سياسة الخصوصية' })).toBeInTheDocument();
    expect(document.body.textContent).toContain(String(new Date().getFullYear()));
  });

  it('contact e-mail renders only when configured, left-to-right', () => {
    const { unmount } = renderFooter();
    expect(screen.queryByRole('link', { name: /@/ })).toBeNull();
    unmount();
    renderFooter({ ...DEFAULT_SETTINGS, contactEmail: 'hello@sdc.sa' });
    expect(screen.getByRole('link', { name: 'hello@sdc.sa' })).toHaveAttribute('dir', 'ltr');
  });
});
