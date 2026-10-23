import 'server-only';
import QRCode from 'qrcode';
import { getUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { getAccountState, type AccountState } from '@/modules/account/state';
import type { MembershipCardData } from './components/MembershipCard';
import { memberThumbUrl } from './photo-url';

export type MyMembership = {
  state: NonNullable<AccountState['member']>;
  card: MembershipCardData;
  cardToken: string | null;
  verifyUrl: string | null;
  /** My current positions: a role, a committee and since when. */
  positions: Array<{ id: string; title: string; since: string }>;
  /** The latest decided leave request, shown for a while after the decision. */
  lastLeave: {
    status: 'approved' | 'declined';
    decidedAt: string;
    effectiveOn: string | null;
  } | null;
};

const siteUrl = () => (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/** The signed-in member's membership with the card, ready to render (QR as SVG made on the server). */
export async function getMyMembership(lang: 'ar' | 'en'): Promise<MyMembership | null> {
  const account = await getAccountState();
  const state = account?.member;
  if (!state) return null;
  const supabase = await createClient();
  const user = await getUser();
  const [{ data: m }, { data: leave }, { data: roles }] = await Promise.all([
    supabase
      .from('members')
      .select(
        'first_name_ar, last_name_ar, first_name_en, last_name_en, photo_path, show_photo, card_token',
      )
      .eq('id', state.id)
      .maybeSingle(),
    supabase
      .from('member_leave_requests')
      .select('status, decided_at, effective_on')
      .eq('member_id', state.id)
      .in('status', ['approved', 'declined'])
      .order('decided_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    user
      ? supabase
          .from('role_assignments')
          .select(
            'id, starts_at, ends_at, display_title_ar, display_title_en, roles(name_ar, name_en), committees(name_ar, name_en)',
          )
          .eq('user_id', user.id)
          .order('starts_at')
      : Promise.resolve({ data: [] }),
  ]);
  if (!m) return null;
  const cardToken = m.card_token ?? null;
  const verifyUrl = cardToken
    ? `${siteUrl()}${lang === 'en' ? '/en' : ''}/verify/member/${cardToken}`
    : null;
  const qrSvg = verifyUrl
    ? await QRCode.toString(verifyUrl, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' })
    : null;
  const decidedAt = leave?.decided_at ? Date.parse(leave.decided_at) : 0;
  return {
    state,
    cardToken,
    verifyUrl,
    card: {
      nameAr: `${m.first_name_ar} ${m.last_name_ar}`.trim(),
      nameEn: [m.first_name_en, m.last_name_en].filter(Boolean).join(' ') || null,
      memberNo: state.memberNo,
      joinedAt: state.joinedAt,
      termEndsAt: state.termEndsAt,
      status: state.status,
      photoUrl: m.show_photo ? memberThumbUrl(m.photo_path) : null,
      qrSvg,
    },
    positions: (roles ?? [])
      .filter((x) => !x.ends_at || Date.parse(x.ends_at) > Date.now())
      .map((x) => {
        const ar = lang === 'ar';
        const role = x.roles ? (ar ? x.roles.name_ar : x.roles.name_en) : '';
        const com = x.committees ? (ar ? x.committees.name_ar : x.committees.name_en) : '';
        return {
          id: x.id,
          title:
            (ar ? x.display_title_ar : x.display_title_en) ||
            [role, com].filter(Boolean).join(' • '),
          since: x.starts_at,
        };
      }),
    lastLeave:
      leave && Date.now() - decidedAt < 30 * 86_400_000
        ? {
            status: leave.status as 'approved' | 'declined',
            decidedAt: leave.decided_at!,
            effectiveOn: leave.effective_on,
          }
        : null,
  };
}
