'use client';

import {
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ExternalLink,
  FileText,
  IdCard,
  LayoutDashboard,
  ListTree,
  LogOut,
  Mail,
  Menu,
  Moon,
  ScrollText,
  Settings,
  ShieldCheck,
  Sun,
  Ticket,
  UserRound,
  Users,
  X,
  Languages,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/components/ui';
import type { NavIcon, VisibleNavGroup, VisibleNavItem } from '@/config/dashboard-nav';
import { signOut } from '@/modules/auth/actions';

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
        'relative flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-accent',
        active
          ? 'bg-surface-raised font-semibold text-accent'
          : 'text-muted hover:bg-surface-raised hover:text-text',
        active &&
          'before:absolute before:inset-y-2.5 before:start-0 before:w-1 before:rounded-full before:bg-accent',
      )}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{item.label[lang]}</span>
    </Link>
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
  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-22 flex-col justify-center border-b border-line px-5">
        <span className="text-[15px] font-bold">
          {ar ? 'المجتمع السعودي للمطورين' : 'Saudi Developer Community'}
        </span>
        <span className="text-xs font-semibold text-accent">
          {ar ? 'لوحة التحكم' : 'Dashboard'}
        </span>
      </div>
      <nav
        aria-label={ar ? 'التنقل الداخلي' : 'Internal navigation'}
        className="flex-1 overflow-y-auto px-3 pb-4"
      >
        {nav.map((group) => (
          <div key={group.key} className="mt-6 first:mt-4">
            <p className="px-4 pb-2 text-[11px] font-bold text-muted">{group.label[lang]}</p>
            <ul className="flex flex-col gap-1">
              {group.items.map((item) => (
                <li key={item.key}>
                  <NavItem item={item} active={item.key === activeItem} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium text-muted hover:bg-surface-raised hover:text-text"
        >
          <ExternalLink size={18} aria-hidden="true" />
          {ar ? 'الموقع العام' : 'Public site'}
        </Link>
      </div>
    </div>
  );
}

export function ShellFrame({
  nav,
  user,
  children,
}: {
  nav: VisibleNavGroup[];
  user: ShellUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const ar = lang === 'ar';

  const items = flatten(nav);
  const active = activeKey(items, pathname);
  const title =
    items.find((i) => i.key === active)?.label[lang] ?? (ar ? 'لوحة التحكم' : 'Dashboard');

  // Close overlays on navigation and with Escape.
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
    router.replace('/login');
    router.refresh();
  };

  return (
    <div className="min-h-dvh bg-canvas text-text lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      {/* Desktop sidebar (first in DOM → inline-start in both directions) */}
      <aside className="sticky top-0 hidden h-dvh border-e border-line bg-surface lg:block">
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
          <div className="absolute inset-y-0 start-0 w-72 max-w-[85vw] border-e border-line bg-surface">
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
        <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur lg:min-h-[72px] lg:px-8">
          <button
            type="button"
            className="rounded-full p-2 text-muted hover:text-text lg:hidden"
            aria-label={ar ? 'فتح القائمة' : 'Open menu'}
            onClick={() => setDrawer(true)}
          >
            <Menu size={20} />
          </button>
          <span aria-hidden="true" className="hidden h-9 w-1 rounded-full bg-accent lg:block" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-extrabold">{title}</h2>
            {user.positionLabel && (
              <p className="truncate text-xs text-muted">{user.positionLabel[lang]}</p>
            )}
          </div>

          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted hover:text-text"
          >
            <Languages size={18} aria-hidden="true" />
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

          <div className="relative">
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
                <Link
                  role="menuitem"
                  href="/account/profile"
                  onClick={() => setMenu(false)}
                  className="block rounded-xl px-3 py-2 text-sm hover:bg-surface-raised"
                >
                  {ar ? 'ملفي الشخصي' : 'My profile'}
                </Link>
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

        <main className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
