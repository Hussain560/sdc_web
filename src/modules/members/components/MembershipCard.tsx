import { Avatar } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { MEMBER_STATUS_LABEL } from '../schemas';

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
}: {
  data: MembershipCardData;
  lang: 'ar' | 'en';
  size?: 'card' | 'full';
}) {
  const ar = lang === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const st = MEMBER_STATUS_LABEL[data.status];
  const full = size === 'full';
  const nameMain = ar ? data.nameAr : data.nameEn || data.nameAr;
  const nameOther = ar ? data.nameEn : data.nameAr;
  const qr = data.qrSvg ? (
    <div
      className={`rounded-shape-lg bg-white p-2.5 ${full ? 'size-60' : 'size-32 sm:size-40 lg:size-48'} [&>svg]:size-full`}
      role="img"
      aria-label={L('رمز التحقق من العضوية', 'Membership verification code')}
      dangerouslySetInnerHTML={{ __html: data.qrSvg }}
    />
  ) : (
    <div
      className={`flex items-center justify-center rounded-shape-lg bg-white/60 text-center text-sm text-on-brand ${full ? 'size-60' : 'size-32 sm:size-40 lg:size-48'}`}
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
        <dt className="text-xs opacity-75 sm:text-sm">{L('رقم العضوية', 'Member no.')}</dt>
        <dd
          dir="ltr"
          className="whitespace-nowrap font-mono font-semibold tracking-wide"
          style={{ textAlign: 'start' }}
        >
          {data.memberNo}
        </dd>
      </div>
      <div>
        <dt className="text-xs opacity-75 sm:text-sm">{L('عضو منذ', 'Member since')}</dt>
        <dd className="font-semibold">{formatDate(data.joinedAt, lang)}</dd>
      </div>
      <div>
        <dt className="text-xs opacity-75 sm:text-sm">{L('صالحة حتى', 'Valid until')}</dt>
        <dd className="font-semibold">
          {data.termEndsAt ? formatDate(data.termEndsAt, lang) : '—'}
        </dd>
      </div>
    </dl>
  );

  if (full)
    return (
      <div
        className="relative isolate mx-auto w-full max-w-sm overflow-hidden rounded-shape-2xl bg-brand p-6 text-on-brand shadow-elev-2"
        aria-label={L('بطاقة العضوية', 'Membership card')}
        role="group"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -end-10 -top-10 -z-10 size-56 rounded-full bg-accent/20"
        />
        <div className="flex flex-col items-center gap-4 text-center">
          {qr}
          <div className="min-w-0">
            <p className="text-2xl font-extrabold leading-tight">{nameMain}</p>
            {nameOther && (
              <p
                dir={ar ? 'ltr' : 'rtl'}
                className="mt-0.5 text-sm opacity-80"
                style={{ textAlign: 'center' }}
              >
                {nameOther}
              </p>
            )}
            <div className="mt-3">{facts}</div>
          </div>
          <div className="flex items-center justify-center gap-3">
            {statusPill}
            <Avatar
              name={nameMain}
              src={data.photoUrl}
              size={56}
              className="ring-2 ring-white/60"
            />
          </div>
        </div>
      </div>
    );

  // The wide card (design: "عضويتي"): a plastic card in proportion. The brand mark sits large behind everything, the
  // status and the small logo are on top, the person and the three facts on the start side, the QR code on the end side.
  return (
    <div
      className="relative isolate flex flex-col gap-5 overflow-hidden rounded-shape-2xl bg-brand p-5 text-on-brand shadow-elev-2 sm:aspect-[1.53] sm:gap-0 sm:p-8"
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
        <div className="sm:me-[40%]">{statusPill}</div>
      </div>

      <div className="grid flex-1 gap-5 sm:grid-cols-[1fr_auto] sm:grid-rows-[1fr_auto] sm:gap-x-6 sm:gap-y-4">
        <div className="flex min-w-0 flex-col justify-center sm:row-start-1">
          <div className="flex items-center gap-4">
            <Avatar
              name={nameMain}
              src={data.photoUrl}
              size={72}
              className="shrink-0 ring-[3px] ring-white/60 sm:size-24! sm:text-3xl!"
            />
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-tight sm:text-3xl">{nameMain}</p>
              {nameOther && (
                <p
                  dir={ar ? 'ltr' : 'rtl'}
                  className="mt-0.5 truncate text-sm opacity-80 sm:text-base"
                  style={{ textAlign: 'start' }}
                >
                  {nameOther}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="sm:col-start-1 sm:row-start-2 sm:self-end">{facts}</div>
        <div className="order-last flex items-center justify-center sm:order-none sm:col-start-2 sm:row-span-2 sm:row-start-1">
          {qr}
        </div>
      </div>
    </div>
  );
}
