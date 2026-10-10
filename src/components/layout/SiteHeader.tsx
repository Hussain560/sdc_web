'use client';

import { ChevronDown, LayoutDashboard, LogOut, Menu, User } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button, LinkButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { IconAction } from '@/components/ui/IconAction';
import { TextLink } from '@/components/ui/TextLink';
import { cn } from '@/components/ui/cn';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { CHROME, NAV_ITEMS, isActive } from './chrome-strings';
import { LocaleSwitch } from './LocaleSwitch';
import { Logo } from './Logo';
import { ThemeSwitch, ThemeSwitchRow } from './ThemeSwitch';

/** Scroll state for the floating bar: elevated after 8 px, hidden while scrolling down (not under reduced motion). */
function useHeaderScroll() {
  const [elevated, setElevated] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setElevated(y > 8);
      if (!reduce) {
        if (y > last && y > 120) setHidden(true);
        else if (y < last) setHidden(false);
      }
      last = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return { elevated, hidden };
}

function AccountMenu() {
  const { user, hasPosition, logout } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const s = CHROME[lang];
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const name = String(user?.user_metadata?.full_name ?? user?.email ?? '');
  const item =
    't-label flex min-h-11 w-full items-center gap-3 rounded-shape-sm px-3 text-start text-text hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-focus-ring';

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={s.accountMenu}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-1 rounded-full ps-1 pe-2 hover:bg-surface-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <span
          aria-hidden="true"
          className="inline-flex size-9 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-on-accent-soft"
        >
          {Array.from(name)[0]?.toUpperCase() ?? <User className="size-4" />}
        </span>
        <ChevronDown aria-hidden="true" className="size-4 text-muted" />
      </button>
      {open && (
        <div
          id={id}
          className="absolute end-0 top-full z-(--z-overlay) mt-2 w-60 rounded-shape-lg border border-line bg-surface-overlay p-2 shadow-elev-2"
        >
          <Link href="/account" className={item} onClick={() => setOpen(false)}>
            <User aria-hidden="true" className="size-5 text-muted" />
            {s.account}
          </Link>
          {hasPosition && (
            <Link href="/dashboard" className={item} onClick={() => setOpen(false)}>
              <LayoutDashboard aria-hidden="true" className="size-5 text-muted" />
              {s.dashboard}
            </Link>
          )}
          <button
            type="button"
            className={item}
            onClick={async () => {
              setOpen(false);
              await logout();
              router.push('/');
              router.refresh();
            }}
          >
            <LogOut aria-hidden="true" className="size-5 text-muted" />
            {s.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Public header (components §4.2, PUBLIC-SCREENS-V2/00-chrome.md): a floating bar from 1024 px, a 56 px bar with a
 * bottom sheet below. The dashboard entry shows only for people who hold a position (the database decides; this
 * is a UI hint, the dashboard itself enforces permissions). Search stays hidden until `/search` exists (Q-023).
 */
export function SiteHeader() {
  const { lang } = useLanguage();
  const { isLoggedIn, loading } = useAuth();
  const pathname = usePathname();
  const s = CHROME[lang];
  const { elevated, hidden } = useHeaderScroll();
  const [sheet, setSheet] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-(--z-header) lg:top-3 lg:px-4',
        'transition-transform duration-(--duration-base) ease-(--ease-standard) motion-reduce:transition-none',
        hidden && '-translate-y-[calc(100%+1rem)]',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-(--z-skip) focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:t-label focus:text-on-accent"
      >
        {s.skip}
      </a>

      {/* Desktop: floating bar */}
      <div
        className={cn(
          'mx-auto hidden h-16 max-w-(--container-wide) items-center gap-4 rounded-shape-xl border border-line px-4 lg:flex',
          'bg-surface/85 backdrop-blur-md transition-shadow duration-(--duration-base)',
          elevated && 'shadow-elev-2',
        )}
      >
        <Logo label={s.logoHome} alt={s.logoAlt} priority />
        <nav aria-label={s.mainNav} className="mx-auto">
          <ul className="flex items-center gap-1 rounded-full bg-surface-raised p-1">
            {NAV_ITEMS.map(({ key, href }) => {
              const active = isActive(pathname, href);
              return (
                <li key={key}>
                  <TextLink
                    href={href}
                    variant="nav"
                    active={active}
                    className={cn('min-h-10 rounded-full px-4', active && 'bg-surface text-text')}
                  >
                    {s[key]}
                  </TextLink>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-1">
          <LocaleSwitch />
          <ThemeSwitch />
          {isLoggedIn ? (
            <AccountMenu />
          ) : (
            !loading && (
              <LinkButton href="/join" size="md" className="ms-2">
                {s.join}
              </LinkButton>
            )
          )}
        </div>
      </div>

      {/* Phone and tablet: 56 px bar */}
      <div className="flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Logo label={s.logoHome} alt={s.logoAlt} priority />
        <IconAction label={s.menu} variant="ghost" onClick={() => setSheet(true)}>
          <Menu aria-hidden="true" className="size-6" />
        </IconAction>
      </div>

      <Dialog
        open={sheet}
        onClose={() => setSheet(false)}
        title={s.menu}
        closeLabel={s.closeMenu}
        presentation="sheet"
      >
        <nav aria-label={s.mainNav}>
          <ul className="flex flex-col">
            {NAV_ITEMS.map(({ key, href }) => {
              const active = isActive(pathname, href);
              return (
                <li key={key}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setSheet(false)}
                    className={cn(
                      't-body flex min-h-12 items-center rounded-shape-sm px-3',
                      'focus-visible:outline-2 focus-visible:outline-focus-ring',
                      active ? 'bg-accent-soft font-semibold text-on-accent-soft' : 'text-text',
                    )}
                  >
                    {s[key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <hr className="my-3 border-line" />
        <div className="flex flex-col gap-1">
          <LocaleSwitch className="w-full justify-between" />
          <ThemeSwitchRow />
        </div>
        <div className="mt-4 flex flex-col items-center gap-2">
          {isLoggedIn ? (
            <>
              <LinkButton href="/account" fullWidth onClick={() => setSheet(false)}>
                {s.account}
              </LinkButton>
              <LogoutRow onDone={() => setSheet(false)} />
            </>
          ) : (
            <>
              <LinkButton href="/join" fullWidth onClick={() => setSheet(false)}>
                {s.join}
              </LinkButton>
              <TextLink
                href="/login"
                variant="standalone"
                className="min-h-11"
                onClick={() => setSheet(false)}
              >
                {s.memberSignIn}
              </TextLink>
            </>
          )}
        </div>
      </Dialog>
    </header>
  );
}

function LogoutRow({ onDone }: { onDone: () => void }) {
  const { logout, hasPosition } = useAuth();
  const { lang } = useLanguage();
  const router = useRouter();
  const s = CHROME[lang];
  return (
    <>
      {hasPosition && (
        <LinkButton href="/dashboard" variant="secondary" fullWidth onClick={onDone}>
          {s.dashboard}
        </LinkButton>
      )}
      <Button
        variant="ghost"
        onClick={async () => {
          onDone();
          await logout();
          router.push('/');
          router.refresh();
        }}
      >
        {s.signOut}
      </Button>
    </>
  );
}
