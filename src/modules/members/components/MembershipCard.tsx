import { X } from 'lucide-react';
import { Avatar } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { formatDate } from '@/lib/format';
import { memberStatusLabel } from '../schemas';

export type MembershipCardData = {
  nameAr: string;
  nameEn: string | null;
  memberNo: string;
  joinedAt: string;
  termEndsAt: string | null;
  status: 'active' | 'suspended' | 'expired' | 'ended';
  photoUrl: string | null;
  /** The QR code as an SVG string (generated on the server), or null when the card is not valid. */
  qrSvg: string | null;
};

/**
 * The digital membership card (MEM-020): name in both languages, the photo only if the member shows it, the member
 * number, "member since", the term end, the real status and a QR code to the public verification page. It looks the
 * same on screen and in print; the card is never attached to an e-mail.
 */
export function MembershipCard({
  data,
  lang,
  size = 'card',
  closeHref,
}: {
  data: MembershipCardData;
  lang: 'ar' | 'en';
  size?: 'card' | 'full';
  /** Full screen only: where the close button goes. */
  closeHref?: string;
}) {
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const st = memberStatusLabel(data.status);
  const full = size === 'full';
  const nameMain = ar ? data.nameAr : data.nameEn || data.nameAr;
  const nameOther = ar ? data.nameEn : data.nameAr;
  const qr = data.qrSvg ? (
    <div
      className={`rounded-shape-lg bg-white p-2.5 ${full ? 'size-60' : 'size-32 @lg:size-40 @2xl:size-48'} [&>svg]:size-full`}
      role="img"
      aria-label={L('رمز التحقق من العضوية', 'Membership verification code')}
      dangerouslySetInnerHTML={{ __html: data.qrSvg }}
    />
  ) : (
    <div
      className={`flex items-center justify-center rounded-shape-lg bg-white/60 text-center text-sm text-on-brand ${full ? 'size-60' : 'size-32 @lg:size-40 @2xl:size-48'}`}
    >
      {L('الرمز غير فعّال', 'Code not active')}
    </div>
  );
  const statusPill = (
    <span className="inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-sm font-semibold">
      <span
        aria-hidden="true"
        className={`size-2 rounded-full ${data.status === 'active' ? 'bg-accent' : 'bg-warning'}`}
      />
      {st[lang]}
    </span>
  );
  const facts = (
    <dl
      className={`grid gap-3 text-sm ${full ? 'grid-cols-2 text-start' : 'grid-cols-3 gap-4 border-t border-current/20 pt-4'}`}
    >
      <div className={full ? 'col-span-2' : ''}>
        <dt className="text-xs opacity-75 @lg:text-sm">{L('رقم العضوية', 'Member no.')}</dt>
        <dd
          dir="ltr"
          className="whitespace-nowrap font-mono font-semibold tracking-wide"
          style={{ textAlign: 'start' }}
        >
          {data.memberNo}
        </dd>
      </div>
      <div>
        <dt className="text-xs opacity-75 @lg:text-sm">{L('عضو منذ', 'Member since')}</dt>
        <dd className="font-semibold">{formatDate(data.joinedAt, lang)}</dd>
      </div>
      <div>
        <dt className="text-xs opacity-75 @lg:text-sm">{L('صالحة حتى', 'Valid until')}</dt>
        <dd className="font-semibold">
          {data.termEndsAt ? formatDate(data.termEndsAt, lang) : '—'}
        </dd>
      </div>
    </dl>
  );

  const logo = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/brand/sdc-mark.svg"
      alt=""
      aria-hidden="true"
      style={{ height: 40, width: 'auto' }}
    />
  );

  // Full screen (design: "البطاقة بملء الشاشة"): a tall card to show at the door. Close at the start, logo at the end,
  // the person and a big QR code in the middle, the status line and a hint to raise the brightness at the bottom.
  if (full)
    return (
      <div
        className="relative isolate mx-auto flex min-h-dvh w-full flex-col items-center gap-4 overflow-hidden bg-brand p-6 text-center text-on-brand sm:min-h-[calc(100dvh-3rem)] sm:max-w-md sm:rounded-shape-2xl sm:shadow-elev-2"
        aria-label={L('بطاقة العضوية', 'Membership card')}
        role="group"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-black/[0.14]"
          style={{ clipPath: 'polygon(0 0, 58% 0, 0 46%)' }}
        />
        <div className="flex w-full items-center justify-between">
          {closeHref ? (
            <Link
              href={closeHref}
              aria-label={L('إغلاق', 'Close')}
              className="flex size-11 items-center justify-center rounded-full hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              <X size={22} aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
          {logo}
        </div>
        <Avatar name={nameMain} src={data.photoUrl} size={120} className="ring-4 ring-white/50" />
        <div className="min-w-0">
          <p className="text-2xl font-extrabold leading-tight">{nameMain}</p>
          {nameOther && (
            <p dir={ar ? 'ltr' : 'rtl'} className="mt-0.5 text-sm" style={{ textAlign: 'center' }}>
              {nameOther}
            </p>
          )}
        </div>
        {qr}
        <p dir="ltr" className="font-mono text-xl font-bold tracking-wide">
          {data.memberNo}
        </p>
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="inline-flex items-center gap-2 font-semibold">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${data.status === 'active' ? 'bg-accent' : 'bg-warning'}`}
            />
            {st[lang]}
          </span>
          <span>
            {L('حتى', 'Until')} {data.termEndsAt ? formatDate(data.termEndsAt, lang) : '—'}
          </span>
        </div>
        <p className="mt-auto pt-4 text-sm">
          {L(
            'ارفع سطوع الشاشة عند المسح. تعمل البطاقة دون اتصال بعد حفظها.',
            'Raise the screen brightness when scanning. The card works offline once saved.',
          )}
        </p>
      </div>
    );

  // Phones (design: "عضويتي" on mobile): a compact card, the person and number on the start side and the QR on the end.
  const compact = (
    <div
      className="relative isolate overflow-hidden rounded-shape-2xl bg-brand p-4 text-on-brand shadow-elev-2 @lg:hidden"
      aria-label={L('بطاقة العضوية', 'Membership card')}
      role="group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/brand/sdc-mark.svg"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -z-10"
        style={{
          top: '-30%',
          insetInlineStart: '10%',
          height: '170%',
          width: 'auto',
          maxWidth: 'none',
          opacity: 0.18,
        }}
      />
      <div className="flex items-center justify-between gap-3">
        {data.status !== 'active' ? statusPill : <span />}
        {logo}
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-stretch gap-4">
        <div className="flex min-w-0 flex-col justify-between gap-3">
          <div>
            <p className="text-xl font-extrabold leading-tight">{nameMain}</p>
            <p dir="ltr" className="mt-1 font-mono text-sm" style={{ textAlign: 'start' }}>
              {data.memberNo}
            </p>
          </div>
          <p className="text-sm">
            {L('حتى', 'Until')} {data.termEndsAt ? formatDate(data.termEndsAt, lang) : '—'}
          </p>
        </div>
        {data.qrSvg ? (
          <div
            className="size-36 rounded-shape-lg bg-white p-2 [&>svg]:size-full"
            role="img"
            aria-label={L('رمز التحقق من العضوية', 'Membership verification code')}
            dangerouslySetInnerHTML={{ __html: data.qrSvg }}
          />
        ) : (
          <div className="flex size-36 items-center justify-center rounded-shape-lg bg-white/60 text-center text-sm">
            {L('الرمز غير فعّال', 'Code not active')}
          </div>
        )}
      </div>
    </div>
  );

  // The wide card (design: "عضويتي"): a plastic card in proportion. The brand mark sits large behind everything, the
  // status and the small logo are on top, the person and the three facts on the start side, the QR code on the end side.
  return (
    <div className="@container">
      {compact}
      <div
        className="relative isolate hidden flex-col gap-5 overflow-hidden rounded-shape-2xl bg-brand p-5 text-on-brand shadow-elev-2 @lg:flex @lg:aspect-[1.53] @lg:gap-0 @lg:p-8"
        aria-label={L('بطاقة العضوية', 'Membership card')}
        role="group"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/brand/sdc-mark.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -z-10"
          style={{
            top: '-22%',
            insetInlineStart: '22%',
            height: '150%',
            width: 'auto',
            maxWidth: 'none',
            opacity: 0.2,
          }}
        />
        <div
          className="motif-dots pointer-events-none absolute inset-0 -z-10 opacity-40"
          aria-hidden="true"
        />

        <div className="flex items-start justify-between gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/brand/sdc-mark.svg"
            alt=""
            aria-hidden="true"
            style={{ height: 40, width: 'auto' }}
          />
          <div className="@lg:me-[40%]">{statusPill}</div>
        </div>

        <div className="grid flex-1 gap-5 @lg:grid-cols-[1fr_auto] @lg:grid-rows-[1fr_auto] @lg:gap-x-6 @lg:gap-y-4">
          <div className="flex min-w-0 flex-col justify-center @lg:row-start-1">
            <div className="flex items-center gap-4">
              <Avatar
                name={nameMain}
                src={data.photoUrl}
                size={72}
                className="shrink-0 ring-[3px] ring-white/60 @lg:size-24! @lg:text-3xl!"
              />
              <div className="min-w-0">
                <p className="text-2xl font-extrabold leading-tight @lg:text-3xl">{nameMain}</p>
                {nameOther && (
                  <p
                    dir={ar ? 'ltr' : 'rtl'}
                    className="mt-0.5 truncate text-sm opacity-80 @lg:text-base"
                    style={{ textAlign: 'start' }}
                  >
                    {nameOther}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="@lg:col-start-1 @lg:row-start-2 @lg:self-end">{facts}</div>
          <div className="order-last flex items-center justify-center @lg:order-none @lg:col-start-2 @lg:row-span-2 @lg:row-start-1">
            {qr}
          </div>
        </div>
      </div>
    </div>
  );
}
