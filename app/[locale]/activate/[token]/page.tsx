import { CircleCheck, KeyRound, Lock } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { FocusedHeader } from '@/components/layout/FocusedHeader';
import { LinkButton } from '@/components/ui';
import { createAdminClient } from '@/lib/supabase/admin';
import { RequestLinkForm } from '@/modules/membership/components/JoinClient';

// The link is the only credential: never index it, never leak it through the referrer.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

type Resolved =
  | { ok: true; id: string; email: string; locale: string }
  | { ok: false; code: 'TOKEN_INVALID' | 'TOKEN_EXPIRED' | 'NOT_ACCEPTED' | 'ALREADY_ACTIVE' };

/**
 * /activate/<token> — the link in the acceptance e-mail (ACC-009). The token lives as long as the activation period
 * (7 days by default). A valid one creates a fresh one-time sign-in link on the spot and sends the person straight to
 * choosing a password; anything else shows one calm page with a way forward.
 */
export default async function ActivatePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const L = (a: string, e: string) => (lang === 'ar' ? a : e);
  const db = createAdminClient();

  const { data } = /^[0-9a-f]{40,80}$/i.test(token)
    ? await db.rpc('resolve_activation_token', { p_token: token })
    : { data: { ok: false, code: 'TOKEN_INVALID' } };
  const res = (data ?? { ok: false, code: 'TOKEN_INVALID' }) as Resolved;

  if (res.ok) {
    const gen = await db.auth.admin.generateLink({ type: 'recovery', email: res.email });
    const hash = gen.data?.properties?.hashed_token;
    if (hash) {
      redirect(
        `/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=recovery&next=${encodeURIComponent('/reset-password?welcome=1')}${lang === 'en' ? '&locale=en' : ''}`,
      );
    }
  }

  const code = res.ok ? 'TOKEN_INVALID' : res.code;
  const active = code === 'ALREADY_ACTIVE';

  return (
    <div className="min-h-dvh bg-canvas">
      <FocusedHeader title={L('تفعيل الحساب', 'Activate your account')} />
      <main className="m-enter mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-14 text-center">
        <span
          aria-hidden="true"
          className={`flex size-16 items-center justify-center rounded-full ${
            active ? 'bg-accent-soft text-accent-text' : 'bg-surface-raised text-muted'
          }`}
        >
          {active ? (
            <CircleCheck size={30} />
          ) : code === 'TOKEN_EXPIRED' ? (
            <KeyRound size={28} />
          ) : (
            <Lock size={28} />
          )}
        </span>
        <h1 className="t-h2">
          {active
            ? L('حسابك مفعّل بالفعل', 'Your account is already active')
            : code === 'TOKEN_EXPIRED'
              ? L('انتهت صلاحية رابط التفعيل', 'This activation link has expired')
              : L('رابط التفعيل غير صالح', 'This activation link is not valid')}
        </h1>
        <p className="text-muted">
          {active
            ? L(
                'يمكنك تسجيل الدخول الآن بالبريد وكلمة المرور التي اخترتها.',
                'You can sign in now with your e-mail and the password you chose.',
              )
            : L(
                'اكتب بريدك وسنرسل رابط تفعيل جديداً إن كان لديك طلب مقبول لم يُفعَّل بعد. الرابط الجديد يلغي القديم.',
                'Enter your e-mail and we will send a new activation link if you have an accepted application that is not active yet. The new link replaces the old one.',
              )}
        </p>
        {active ? (
          <LinkButton href="/login" size="lg">
            {L('تسجيل الدخول', 'Sign in')}
          </LinkButton>
        ) : (
          <div className="w-full rounded-shape-xl border border-line bg-surface p-5 text-start">
            <RequestLinkForm kind="activation" />
          </div>
        )}
      </main>
    </div>
  );
}
