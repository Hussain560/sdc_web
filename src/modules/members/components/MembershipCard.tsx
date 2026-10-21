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
  return (
    <div
      className={`relative isolate overflow-hidden rounded-shape-2xl bg-brand text-on-brand shadow-elev-2 ${full ? 'mx-auto w-full max-w-sm p-6' : 'p-5 sm:p-7'}`}
      aria-label={L('بطاقة العضوية', 'Membership card')}
      role="group"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -end-10 -top-10 -z-10 size-56 rounded-full bg-accent/20"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -start-16 bottom-0 -z-10 h-64 w-24 -rotate-12 rounded-full bg-accent/15"
      />
      <div
        className={
          full
            ? 'flex flex-col items-center gap-4 text-center'
            : 'grid items-center gap-5 sm:grid-cols-[auto_1fr_auto]'
        }
      >
        {data.qrSvg ? (
          <div
            className={`rounded-shape-lg bg-white p-2.5 ${full ? 'size-60' : 'size-36 sm:size-44'} [&>svg]:size-full`}
            role="img"
            aria-label={L('رمز التحقق من العضوية', 'Membership verification code')}
            dangerouslySetInnerHTML={{ __html: data.qrSvg }}
          />
        ) : (
          <div
            className={`flex items-center justify-center rounded-shape-lg bg-white/60 text-center text-sm text-on-brand ${full ? 'size-60' : 'size-36 sm:size-44'}`}
          >
            {L('الرمز غير فعّال', 'Code not active')}
          </div>
        )}
        <div className={`min-w-0 ${full ? '' : 'sm:order-none'}`}>
          <p
            className={`font-extrabold leading-tight ${full ? 'text-2xl' : 'text-xl sm:text-2xl'}`}
          >
            {ar ? data.nameAr : data.nameEn || data.nameAr}
          </p>
          {(ar ? data.nameEn : data.nameAr) && (
            <p
              dir={ar ? 'ltr' : 'rtl'}
              className="mt-0.5 text-sm opacity-80"
              style={{ textAlign: full ? 'center' : 'start' }}
            >
              {ar ? data.nameEn : data.nameAr}
            </p>
          )}
          <p
            dir="ltr"
            className="mt-3 font-mono text-sm tracking-wide"
            style={{ textAlign: full ? 'center' : 'start' }}
          >
            {data.memberNo}
          </p>
          <dl
            className={`mt-3 grid gap-3 text-sm ${full ? 'grid-cols-2 text-start' : 'grid-cols-2'}`}
          >
            <div>
              <dt className="opacity-75">{L('عضو منذ', 'Member since')}</dt>
              <dd className="font-semibold">{formatDate(data.joinedAt, lang)}</dd>
            </div>
            <div>
              <dt className="opacity-75">{L('صالحة حتى', 'Valid until')}</dt>
              <dd className="font-semibold">
                {data.termEndsAt ? formatDate(data.termEndsAt, lang) : '—'}
              </dd>
            </div>
          </dl>
        </div>
        <div
          className={`flex ${full ? 'items-center justify-center gap-3' : 'flex-col items-end gap-3 sm:justify-between sm:self-stretch'}`}
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-sm font-semibold">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${data.status === 'active' ? 'bg-accent' : 'bg-warning'}`}
            />
            {st[lang]}
          </span>
          <Avatar
            name={ar ? data.nameAr : data.nameEn || data.nameAr}
            src={data.photoUrl}
            size={full ? 56 : 72}
            className="ring-2 ring-white/60"
          />
        </div>
      </div>
    </div>
  );
}
