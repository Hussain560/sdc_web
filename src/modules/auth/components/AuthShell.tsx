import Image from 'next/image';
import type { ReactNode } from 'react';
import { LocaleSwitch } from '@/components/layout/LocaleSwitch';
import { Logo } from '@/components/layout/Logo';
import { ThemeSwitch } from '@/components/layout/ThemeSwitch';

/**
 * Split layout of the auth pages (patterns §14, PUBLIC-SCREENS-V2/05-auth.md): the form on the inline-start side
 * and a decorative brand panel on the inline-end side, collapsing to a 96 px strip below 1024 px. The public
 * header and footer do not render here. The panel is `aria-hidden` and holds nothing a reader needs.
 */
export function AuthShell({
  children,
  labels,
}: {
  children: ReactNode;
  labels: { logoHome: string; logoAlt: string };
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1fr_45%] lg:gap-4 lg:p-4">
      <div
        aria-hidden="true"
        className="motif-dots flex h-24 items-center justify-center rounded-b-shape-2xl bg-band text-muted lg:hidden"
      >
        <Image src="/assets/sdc-logo-mark.svg" alt="" width={48} height={48} className="size-12" />
      </div>

      <div className="flex min-h-[calc(100dvh-6rem)] flex-col px-4 py-4 lg:min-h-0 lg:px-12 lg:py-6">
        <div className="flex items-center justify-between">
          <Logo label={labels.logoHome} alt={labels.logoAlt} priority />
          <div className="flex items-center gap-1">
            <LocaleSwitch />
            <ThemeSwitch />
          </div>
        </div>
        <main
          id="main"
          className="m-auto flex w-full max-w-(--container-tight) flex-col gap-6 py-10"
        >
          {children}
        </main>
      </div>

      <aside
        aria-hidden="true"
        className="motif-dots relative hidden items-center justify-center overflow-hidden rounded-shape-2xl bg-band text-muted lg:flex"
      >
        <div className="flex items-center gap-4">
          <Image
            src="/assets/sdc-logo-mark.svg"
            alt=""
            width={160}
            height={160}
            className="size-40"
          />
        </div>
      </aside>
    </div>
  );
}

/** Heading block used by every auth page: one h1 and a short lede. */
export function AuthHeading({ title, lede }: { title: string; lede?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="t-h1">{title}</h1>
      {lede && <p className="t-lede text-muted">{lede}</p>}
    </div>
  );
}
