import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/auth/session';
import { MembershipCard } from '@/modules/members/components/MembershipCard';
import { getMyMembership } from '@/modules/members/my-membership';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// The card at full screen for showing at the door (MEM-020): outside the dashboard shell, nothing else on the page.
export default async function CardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const L = (a: string, e: string) => (lang === 'ar' ? a : e);
  await requireUser('/card');
  const mine = await getMyMembership(lang);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas sm:p-6">
      {mine ? (
        <div className="w-full">
          <MembershipCard
            data={mine.card}
            lang={lang}
            size="full"
            closeHref="/account/membership"
          />
        </div>
      ) : (
        <p className="text-center text-muted">
          {L('لا توجد بطاقة عضوية لحسابك.', 'There is no membership card for your account.')}
        </p>
      )}
      {mine && mine.card.status !== 'active' && (
        <p role="status" className="max-w-sm text-center text-sm text-muted">
          {L(
            'البطاقة غير سارية حالياً، وصفحة التحقق ستعرض ذلك.',
            'The card is not valid right now and the verification page will say so.',
          )}
        </p>
      )}
      {!mine && (
        <Link
          href="/account/membership"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-line-strong px-5 font-semibold hover:border-accent"
        >
          <ArrowRight size={16} aria-hidden="true" className="ltr:rotate-180" />
          {L('عودة إلى عضويتي', 'Back to my membership')}
        </Link>
      )}
    </main>
  );
}
