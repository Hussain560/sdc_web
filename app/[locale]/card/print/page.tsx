import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth/session';
import { MembershipCard } from '@/modules/members/components/MembershipCard';
import { PrintButton } from '@/modules/members/components/PrintButton';
import { getMyMembership } from '@/modules/members/my-membership';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// Print layout of the same card: one card at its real size, with the colors kept.
export default async function CardPrintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  await requireUser('/card/print');
  const mine = await getMyMembership(lang);
  if (!mine) return null;
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center gap-6 bg-canvas px-4 py-8 [print-color-adjust:exact] print:p-0">
      <div className="w-full">
        <MembershipCard data={mine.card} lang={lang} />
      </div>
      <PrintButton label={lang === 'ar' ? 'طباعة' : 'Print'} />
    </main>
  );
}
