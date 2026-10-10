'use client';

import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useSyncExternalStore, type ReactNode } from 'react';
import { TextLink } from '@/components/ui/TextLink';
import { useLanguage } from '@/context/LanguageContext';
import { useSiteSettings } from '@/context/SiteSettingsContext';
import { CHROME, socialLinks } from './chrome-strings';
import { LocaleSwitch } from './LocaleSwitch';
import { ThemeSwitch } from './ThemeSwitch';

const ICONS: Record<string, ReactNode> = {
  x: (
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  ),
  linkedin: (
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" />
  ),
  instagram: (
    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm5.2-3.2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
  ),
};

const query = '(min-width: 768px)';
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(query);
  m.addEventListener('change', cb);
  return () => m.removeEventListener('change', cb);
};

/** A footer column: always open from 768 px, an accordion below it (components §4.3). */
function Column({ title, children }: { title: string; children: ReactNode }) {
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => true,
  );
  return (
    <details
      open={wide || undefined}
      className="group border-b border-line py-2 md:border-0 md:py-0"
    >
      <summary
        onClick={(e) => wide && e.preventDefault()}
        className="t-label flex min-h-11 cursor-pointer list-none items-center justify-between text-text focus-visible:outline-2 focus-visible:outline-focus-ring md:cursor-default [&::-webkit-details-marker]:hidden"
      >
        {title}
        <ChevronDown
          aria-hidden="true"
          className="size-5 text-muted transition-transform group-open:rotate-180 md:hidden"
        />
      </summary>
      <ul className="t-body-sm flex flex-col pb-3 md:pt-2 md:pb-0">{children}</ul>
    </details>
  );
}

const linkClass = 'flex min-h-11 items-center md:min-h-9';

/**
 * Public footer (components §4.3): a brand column, three link columns that become accordions on phones, and a
 * bottom bar with rights, privacy, member sign-in, language and theme. Social links and the contact e-mail come
 * from public `site_settings`; a placeholder or empty value hides the link.
 */
export function SiteFooter() {
  const { lang } = useLanguage();
  const settings = useSiteSettings();
  const s = CHROME[lang];
  const socials = socialLinks(settings);
  const rights = (lang === 'ar' ? settings.footerRightsAr : settings.footerRightsEn) || s.rights;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-(--section-gap) rounded-t-shape-2xl bg-surface px-4 pt-12 pb-6 md:px-8">
      <div className="mx-auto grid max-w-(--container) gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col items-start gap-4">
          <Image
            src="/assets/Logos.png"
            alt={s.logoAlt}
            width={224}
            height={99}
            loading="lazy"
            className="h-20 w-auto"
          />
          <p className="t-body-sm max-w-xs text-muted">{s.tagline}</p>
          {socials.length > 0 && (
            <ul aria-label={s.social} className="flex gap-1">
              {socials.map((l) => (
                <li key={l.key}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${l.label} ${s.newTab}`}
                    className="inline-flex size-11 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-5"
                    >
                      {ICONS[l.key]}
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Column title={s.colCommunity}>
          <li>
            <TextLink href="/about" variant="nav" className={linkClass}>
              {s.about}
            </TextLink>
          </li>
          <li>
            <TextLink href="/members" variant="nav" className={linkClass}>
              {s.members}
            </TextLink>
          </li>
          <li>
            <TextLink href="/articles" variant="nav" className={linkClass}>
              {s.articles}
            </TextLink>
          </li>
          <li>
            <TextLink href="/join" variant="nav" className={linkClass}>
              {s.join}
            </TextLink>
          </li>
        </Column>

        <Column title={s.colEvents}>
          <li>
            <TextLink href="/events" variant="nav" className={linkClass}>
              {s.upcoming}
            </TextLink>
          </li>
          <li>
            <TextLink href="/events" variant="nav" className={linkClass}>
              {s.past}
            </TextLink>
          </li>
          <li>
            <TextLink href="/certificates" variant="nav" className={linkClass}>
              {s.verifyCertificate}
            </TextLink>
          </li>
        </Column>

        <Column title={s.colContact}>
          {settings.contactEmail && (
            <li>
              <a
                href={`mailto:${settings.contactEmail}`}
                dir="ltr"
                className={`${linkClass} text-muted hover:text-text`}
              >
                {settings.contactEmail}
              </a>
            </li>
          )}
          {socials.map((l) => (
            <li key={l.key}>
              <TextLink
                href={l.href}
                variant="nav"
                external
                externalLabel={s.newTab}
                className={linkClass}
              >
                {l.label}
              </TextLink>
            </li>
          ))}
        </Column>
      </div>

      <div className="mx-auto mt-8 flex max-w-(--container) flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-line pt-4">
        <p className="t-caption text-muted">
          © {year} {rights}
          <span aria-hidden="true"> · </span>
          <TextLink href="/privacy" variant="inline" className="t-caption">
            {s.privacy}
          </TextLink>
          <span aria-hidden="true"> · </span>
          <TextLink href="/login" variant="inline" className="t-caption">
            {s.memberSignIn}
          </TextLink>
        </p>
        <div className="flex items-center gap-1">
          <LocaleSwitch />
          <ThemeSwitch />
        </div>
      </div>
    </footer>
  );
}
