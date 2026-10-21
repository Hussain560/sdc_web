import { ShieldAlert } from 'lucide-react';
import type { Metadata } from 'next';
import { FocusedHeader } from '@/components/layout/FocusedHeader';
import { LinkButton } from '@/components/ui';

export const metadata: Metadata = { robots: { index: false, follow: false } };

// ACC-008: shown after a sign-in attempt by a blocked account. Plain words, no reason, one way forward.
export default async function BlockedNoticePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const L = (a: string, e: string) => (locale === 'en' ? e : a);
  return (
    <div className="min-h-dvh bg-canvas">
      <FocusedHeader title={L('تنبيه الحساب', 'Account notice')} />
      <main
        className="m-enter mx-auto flex max-w-lg flex-col items-start gap-4 px-4 py-14"
        role="alert"
      >
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-danger-soft text-danger"
        >
          <ShieldAlert size={28} />
        </span>
        <h1 className="t-h1">
          {L('تعذّر الدخول إلى هذا الحساب', 'You cannot sign in to this account')}
        </h1>
        <p className="t-lede text-muted">
          {L(
            'أوقفت قيادة المجتمع هذا الحساب. لا يمكن الدخول إلى بوابة الأعضاء حتى يُرفع الإيقاف. إن ظننت أن هذا خطأ فتواصل مع القيادة.',
            'Community leadership has blocked this account. You cannot sign in to the members portal until it is unblocked. If you think this is a mistake, contact leadership.',
          )}
        </p>
        <LinkButton href="/" variant="secondary">
          {L('العودة إلى الرئيسية', 'Back to home')}
        </LinkButton>
      </main>
    </div>
  );
}
