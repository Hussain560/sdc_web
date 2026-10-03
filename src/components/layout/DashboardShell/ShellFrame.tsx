'use client';

import {
  BadgeCheck,
  BarChart3,
  Briefcase,
  Building2,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileText,
  IdCard,
  LayoutDashboard,
  ListTree,
  LogOut,
  Mail,
  Menu,
  PanelLeft,
  Moon,
  ScrollText,
  Settings,
  ShieldCheck,
  Sun,
  Ticket,
  UserRound,
  Users,
  UsersRound,
  X,
  Languages,
  LoaderCircle,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { cn, useToast } from '@/components/ui';
import type { NavGroupKey, NavIcon, VisibleNavGroup, VisibleNavItem } from '@/config/dashboard-nav';
import { signOut } from '@/modules/auth/actions';
import { CrumbsProvider, useCrumbs } from './Crumbs';

const ICONS: Record<NavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  ticket: Ticket,
  card: IdCard,
  user: UserRound,
  events: CalendarDays,
  clipboard: ClipboardCheck,
  file: FileText,
  users: Users,
  building: Building2,
  chart: BarChart3,
  shield: ShieldCheck,
  scroll: ScrollText,
  mail: Mail,
  list: ListTree,
  settings: Settings,
  badge: BadgeCheck,
};

const GROUP_ICONS: Partial<Record<NavGroupKey, LucideIcon>> = {
  committee: UsersRound,
  management: Briefcase,
  membership: IdCard,
  admin: ShieldCheck,
};

const OPEN_KEY = 'sdc_sidebar_open';
const COLLAPSE_KEY = 'sdc_sidebar_collapsed';

const ACCOUNT_LINKS = [
  { href: '/account/profile', icon: UserRound, label: { ar: 'ملفي الشخصي', en: 'My profile' } },
  {
    href: '/account/registrations',
    icon: Ticket,
    label: { ar: 'تسجيلاتي', en: 'My registrations' },
  },
  { href: '/account/roles', icon: BadgeCheck, label: { ar: 'مناصبي', en: 'My positions' } },
  { href: '/account/security', icon: ShieldCheck, label: { ar: 'الأمان', en: 'Security' } },
  { href: '/account/privacy', icon: ShieldCheck, label: { ar: 'بياناتي', en: 'My data' } },
] as const;

export type ShellUser = {
  name: string;
  email: string;
  positionLabel: { ar: string; en: string } | null;
};

function flatten(groups: VisibleNavGroup[]): VisibleNavItem[] {
  return groups.flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]));
}

/** Longest href prefix wins, so /dashboard/admin/roles/x keeps "Roles" active. */
function activeKey(items: VisibleNavItem[], pathname: string): string | null {
  const clean = (href: string) => href.split('?')[0] ?? href;
  let best: VisibleNavItem | null = null;
  for (const item of items) {
    const h = clean(item.href);
    const hit =
      h === '/dashboard' ? pathname === h : pathname === h || pathname.startsWith(`${h}/`);
    if (hit && (!best || clean(best.href).length < h.length)) best = item;
  }
  return best?.key ?? null;
}

function NavItem({
  item,
  active,
  onNavigate,
}: {
  item: VisibleNavItem;
  active: boolean;
  onNavigate: () => void;
}) {
  const { lang } = useLanguage();
  const Icon = ICONS[item.icon];
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex min-h-9 items-center gap-2.5 rounded-lg px-3 text-[13.5px] transition-colors',
        'focus-visible:outline-2 focus-visible:outline-accent',
        active
          ? 'bg-surface-raised font-semibold text-text'
          : 'font-medium text-muted hover:bg-surface-raised hover:text-text',
      )}
    >
      <Icon
        size={17}
        aria-hidden="true"
        className={cn('shrink-0', active ? 'text-accent' : 'text-muted group-hover:text-text')}
      />
      <span className="truncate">{item.label[lang]}</span>
    </Link>
  );
}

/** A related set of links behind one expandable row (blueprint 02 §4). Closed content stays in the DOM but inert. */
function NavSection({
  group,
  activeItem,
  open,
  onToggle,
  onNavigate,
}: {
  group: VisibleNavGroup;
  activeItem: string | null;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  const { lang } = useLanguage();
  const Icon = GROUP_ICONS[group.key] ?? Briefcase;
  const id = `nav-section-${group.key}`;
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className={cn(
          'flex min-h-9 w-full items-center gap-2.5 rounded-lg px-3 text-start text-[13.5px] font-medium text-muted transition-colors',
          'hover:bg-surface-raised hover:text-text focus-visible:outline-2 focus-visible:outline-accent',
          open && 'text-text',
        )}
      >
        <Icon size={17} aria-hidden="true" className="shrink-0" />
        <span className="flex-1 truncate">{group.label[lang]}</span>
        <ChevronRight
          size={15}
          aria-hidden="true"
          className={cn(
            'shrink-0 transition-transform duration-200 motion-reduce:transition-none rtl:-scale-x-100',
            open && 'rotate-90',
          )}
        />
      </button>
      <div
        id={id}
        inert={!open}
        className={cn(
          'grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <ul className="ms-[18px] flex min-h-0 flex-col gap-0.5 overflow-hidden border-s border-line ps-2">
          {group.items.map((item) => (
            <li key={item.key} className="first:mt-1 last:mb-1">
              <NavItem item={item} active={item.key === activeItem} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SidebarContent({
  nav,
  activeItem,
  onNavigate,
}: {
  nav: VisibleNavGroup[];
  activeItem: string | null;
  onNavigate: () => void;
}) {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  // A manual choice wins; otherwise a section is open while it holds the active page.
  const [manual, setManual] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(OPEN_KEY) ?? '{}') as Record<string, boolean>;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the saved choice after hydration
      setManual(saved);
    } catch {
      /* private mode: keep the defaults */
    }
  }, []);

  const toggle = (key: string, open: boolean) => {
    const next = { ...manual, [key]: !open };
    setManual(next);
    try {
      localStorage.setItem(OPEN_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const flat = nav.filter((g) => g.key === 'general').flatMap((g) => g.items);
  const sections = nav.filter((g) => g.key !== 'general');
  const home = flat[0]?.href ?? '/dashboard';

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Link
          href={home}
          onClick={onNavigate}
          aria-label={ar ? 'المجتمع السعودي للمطورين' : 'Saudi Developer Community'}
          className="flex items-center gap-2.5"
        >
          {/* The mark is an SVG, so it bypasses the image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/sdc-logo-mark.svg"
            alt=""
            width={20}
            height={37}
            style={{ height: 34, width: 'auto' }}
          />
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-extrabold">
              {ar ? 'المجتمع السعودي' : 'Saudi Developer'}
            </span>
            <span className="text-[13px] font-medium text-muted">
              {ar ? 'للمطورين' : 'Community'}
            </span>
          </span>
        </Link>
      </div>
      <nav
        aria-label={ar ? 'التنقل الداخلي' : 'Internal navigation'}
        className="flex-1 overflow-y-auto px-3 pb-4"
      >
        {flat.length > 0 && (
          <ul className="flex flex-col gap-0.5">
            {flat.map((item) => (
              <li key={item.key}>
                <NavItem item={item} active={item.key === activeItem} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-1 flex flex-col gap-0.5">
          {sections.map((group) => {
            const holdsActive = group.items.some((i) => i.key === activeItem);
            const open = holdsActive || (manual[group.key] ?? false);
            return (
              <NavSection
                key={group.key}
                group={group}
                activeItem={activeItem}
                open={open}
                onToggle={() => toggle(group.key, open)}
                onNavigate={onNavigate}
              />
            );
          })}
        </div>
      </nav>
      <div className="flex flex-col gap-1 border-t border-line p-3">
        <Link
          href="/"
          className="flex min-h-9 items-center gap-2.5 rounded-lg px-3 text-[13.5px] font-medium text-muted hover:bg-surface-raised hover:text-text"
        >
          <ExternalLink size={17} aria-hidden="true" />
          {ar ? 'الموقع العام' : 'Public site'}
        </Link>
      </div>
    </div>
  );
}

export function ShellFrame(props: {
  nav: VisibleNavGroup[];
  user: ShellUser;
  children: React.ReactNode;
}) {
  return (
    <CrumbsProvider>
      <ShellFrameInner {...props} />
    </CrumbsProvider>
  );
}

function ShellFrameInner({
  nav,
  user,
  children,
}: {
  nav: VisibleNavGroup[];
  user: ShellUser;
  children: React.ReactNode;
}) {
  const extra = useCrumbs();
  const pathname = usePathname();
  const router = useRouter();
  const { lang, toggleLanguage, isSwitching } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const toast = useToast();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const ar = lang === 'ar';

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the saved choice after hydration
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* private mode: stay open */
    }
  }, []);
  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const items = flatten(nav);
  const active = activeKey(items, pathname);
  const accountTitle = pathname.startsWith('/account')
    ? (ACCOUNT_LINKS.find((l) => l.href === pathname)?.label[lang] ?? (ar ? 'حسابي' : 'My account'))
    : null;
  const title =
    accountTitle ??
    items.find((i) => i.key === active)?.label[lang] ??
    (ar ? 'لوحة التحكم' : 'Dashboard');
  const section = nav.find((g) => g.key !== 'general' && g.items.some((i) => i.key === active))
    ?.label[lang];

  // Close overlays with Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawer(false);
        setMenu(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success(lang === 'ar' ? 'تم تسجيل الخروج.' : 'Signed out.');
    router.replace('/login');
    router.refresh();
  };

  return (
    <div
      className={cn(
        'sdc-inter min-h-dvh bg-canvas text-text lg:grid',
        collapsed ? 'lg:grid-cols-[minmax(0,1fr)]' : 'lg:grid-cols-[240px_minmax(0,1fr)]',
      )}
    >
      {/* Desktop sidebar (first in DOM → inline-start in both directions) */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh border-e border-line bg-surface',
          collapsed ? 'lg:hidden' : 'lg:block',
        )}
      >
        <SidebarContent nav={nav} activeItem={active} onNavigate={() => undefined} />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={ar ? 'القائمة' : 'Menu'}
        >
          <button
            type="button"
            aria-label={ar ? 'إغلاق' : 'Close'}
            className="absolute inset-0 bg-black/70"
            onClick={() => setDrawer(false)}
          />
          <div className="absolute inset-y-0 start-0 w-64 max-w-[85vw] border-e border-line bg-surface">
            <button
              type="button"
              aria-label={ar ? 'إغلاق' : 'Close'}
              className="absolute end-3 top-3 rounded-full p-2 text-muted hover:text-text"
              onClick={() => setDrawer(false)}
            >
              <X size={18} />
            </button>
            <SidebarContent nav={nav} activeItem={active} onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-line bg-canvas/85 px-4 backdrop-blur lg:px-6">
          <button
            type="button"
            className="rounded-full p-2 text-muted hover:text-text lg:hidden"
            aria-label={ar ? 'فتح القائمة' : 'Open menu'}
            onClick={() => setDrawer(true)}
          >
            <Menu size={20} />
          </button>
          <button
            type="button"
            className="hidden rounded-full p-2 text-muted hover:text-text lg:block"
            aria-label={
              collapsed
                ? ar
                  ? 'فتح الشريط الجانبي'
                  : 'Open sidebar'
                : ar
                  ? 'إغلاق الشريط الجانبي'
                  : 'Close sidebar'
            }
            aria-expanded={!collapsed}
            onClick={toggleSidebar}
          >
            <PanelLeft size={20} className="rtl:-scale-x-100" aria-hidden="true" />
          </button>
          <nav aria-label={ar ? 'مسار الصفحة' : 'Breadcrumb'} className="min-w-0 flex-1">
            <ol className="flex min-w-0 items-center gap-2 text-sm">
              <li className="flex items-center text-muted">
                <LayoutDashboard size={16} aria-hidden="true" />
              </li>
              {section && (
                <>
                  <li aria-hidden="true" className="hidden text-muted sm:block">
                    /
                  </li>
                  <li className="hidden truncate text-muted sm:block">{section}</li>
                </>
              )}
              <li aria-hidden="true" className="text-muted">
                /
              </li>
              <li className="min-w-0">
                {extra.length > 0 ? (
                  <Link
                    href={items.find((i) => i.key === active)?.href ?? '/dashboard'}
                    className="truncate text-[15px] text-muted hover:text-text"
                  >
                    {title}
                  </Link>
                ) : (
                  <h2 className="truncate text-[15px] font-semibold">{title}</h2>
                )}
              </li>
              {extra.map((c, i) => (
                <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-2">
                  <span aria-hidden="true" className="text-muted">
                    /
                  </span>
                  {i === extra.length - 1 || !c.href ? (
                    <h2
                      className="max-w-[16rem] truncate text-[15px] font-semibold"
                      aria-current="page"
                    >
                      {c.label}
                    </h2>
                  ) : (
                    <Link
                      href={c.href}
                      className="max-w-[12rem] truncate text-[15px] text-muted hover:text-text"
                    >
                      {c.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <button
            type="button"
            onClick={toggleLanguage}
            disabled={isSwitching}
            aria-busy={isSwitching}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted hover:text-text',
              'disabled:cursor-progress disabled:opacity-60',
            )}
          >
            {isSwitching ? (
              <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
            ) : (
              <Languages size={18} aria-hidden="true" />
            )}
            <span>{ar ? 'English' : 'العربية'}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={ar ? 'تبديل المظهر' : 'Toggle theme'}
            className="rounded-full p-2 text-muted hover:text-text"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {menu && (
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setMenu(false)}
            />
          )}
          <div className="relative z-20">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-line px-2 py-1.5 text-sm hover:bg-surface-raised"
            >
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-on-accent"
              >
                {(user.name.trim().charAt(0) || '?').toUpperCase()}
              </span>
              <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
            </button>
            {menu && (
              <div
                role="menu"
                className="absolute end-0 top-full mt-2 w-56 rounded-2xl border border-line bg-surface p-2 shadow-lg"
              >
                <p
                  dir="ltr"
                  className="truncate px-3 py-2 text-xs text-muted"
                  style={{ textAlign: 'start' }}
                >
                  {user.email}
                </p>
                {ACCOUNT_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    role="menuitem"
                    href={l.href}
                    onClick={() => setMenu(false)}
                    aria-current={pathname === l.href ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface-raised',
                      pathname === l.href && 'bg-surface-raised text-accent',
                    )}
                  >
                    <l.icon size={16} aria-hidden="true" />
                    {l.label[lang]}
                  </Link>
                ))}
                <div role="separator" className="my-1 border-t border-line" />
                <Link
                  role="menuitem"
                  href="/"
                  onClick={() => setMenu(false)}
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-surface-raised"
                >
                  {ar ? 'الموقع العام' : 'Public site'}
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-danger hover:bg-surface-raised"
                >
                  <LogOut size={16} aria-hidden="true" />
                  {ar ? 'تسجيل الخروج' : 'Sign out'}
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
