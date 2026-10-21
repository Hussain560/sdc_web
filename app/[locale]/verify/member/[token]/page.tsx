import { CircleAlert, CircleCheck, Clock } from 'lucide-react';
import type { Metadata } from 'next';
import { FocusedHeader } from '@/components/layout/FocusedHeader';
import { formatDate } from '@/lib/format';
import { ipHash } from '@/lib/ip-hash';
import { createClient } from '@/lib/supabase/server';

// The link is the only credential: never index it, never leak it through the referrer.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

type Verified =
  | {
      ok: true;
      name_ar: string;
      name_en: string | null;
      member_no: string;
      status: string;
      term_ends_at: string | null;
      checked_at: string;
    }
  | { ok: false; code: string };

// MEM-020: what a person at the door sees after scanning the card. Name, number, real status and term end — nothing else.
export default async function VerifyMemberPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  const lang = locale === 'en' ? 'en' : 'ar';
  const L = (a: string, e: string) => (lang === 'ar' ? a : e);
  const { data } = await (
    await createClient()
  ).rpc('verify_member_card', { p_token: token, p_ip_hash: (await ipHash()) ?? undefined });
  const res = data as Verified | null;
  const valid = !!res && res.ok && res.status === 'active';
  const tone = valid
    ? 'bg-success-soft text-success'
    : res?.ok
      ? 'bg-warning-soft text-warning'
      : 'bg-danger-soft text-danger';
  const Icon = valid ? CircleCheck : res?.ok ? Clock : CircleAlert;
  const limited = !!res && !res.ok && res.code === 'RATE_LIMITED';

  return (
    <div className="min-h-dvh bg-canvas">
      <FocusedHeader title={L('التحقق من العضوية', 'Verify a membership')} />
      <main className="m-enter mx-auto flex max-w-lg flex-col gap-5 px-4 py-10">
        <section
          className={`m-pop flex flex-col items-center gap-3 rounded-shape-2xl p-8 text-center ${tone}`}
          role="status"
        >
          <Icon size={44} aria-hidden="true" />
          <h1 className="t-h2">
            {valid
              ? L('عضوية سارية', 'Valid membership')
              : res?.ok
                ? res.status === 'suspended'
                  ? L('العضوية موقوفة حالياً', 'Membership is paused')
                  : L('العضوية غير سارية', 'Membership is not valid')
                : limited
                  ? L('محاولات كثيرة', 'Too many attempts')
                  : L('الرمز غير معروف', 'Unknown code')}
          </h1>
        </section>
        {res?.ok ? (
          <dl className="grid gap-4 rounded-shape-xl border border-line bg-surface p-6">
            <div>
              <dt className="text-sm text-muted">{L('الاسم', 'Name')}</dt>
              <dd className="text-lg font-bold">
                {lang === 'ar' ? res.name_ar : res.name_en || res.name_ar}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{L('رقم العضوية', 'Member number')}</dt>
              <dd dir="ltr" className="text-start font-mono font-semibold">
                {res.member_no}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted">{L('صالحة حتى', 'Valid until')}</dt>
              <dd className="font-semibold">
                {res.term_ends_at ? formatDate(res.term_ends_at, lang) : '—'}
              </dd>
            </div>
            <p className="text-xs text-muted">
              {L(
                'تم التحقق الآن من سجلات المجتمع.',
                'Checked just now against the community records.',
              )}
            </p>
          </dl>
        ) : (
          <p className="text-center text-muted">
            {limited
              ? L('حاول بعد دقائق.', 'Try again in a few minutes.')
              : L(
                  'هذا الرمز غير صالح أو أُلغي. اطلب من العضو بطاقته الحالية.',
                  'This code is not valid or was cancelled. Ask the member for their current card.',
                )}
          </p>
        )}
      </main>
    </div>
  );
}
