import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPublicSettings } from '@/lib/site-settings';
import type { DigestData, TemplateData, TemplateKey } from '@/lib/email/templates';
import type { Lang } from '@/modules/auth/messages';
import { notify, type NotifyOutcome } from './notify';

/**
 * The membership lifecycle e-mails (NOT-004). Every function derives the recipient and the data from the current
 * database state and goes through notify(), so the idempotency key guarantees one delivery and the retry route can
 * re-run any of them. Decision mails are held back by the outbox for the undo window.
 */
const siteUrl = () => (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const prefix = (lang: Lang) => (lang === 'en' ? '/en' : '');
const loc = (v: unknown): Lang => (v === 'en' ? 'en' : 'ar');

/** "Thursday 26 November 2026" (Saudi time, Gregorian). Accepts an ISO instant or a yyyy-mm-dd date. */
export function longDate(value: string | Date | null | undefined, lang: Lang): string {
  if (!value) return '';
  const d =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00+03:00`)
      : new Date(value);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Riyadh',
  }).format(d);
}

function shortRange(from: Date, to: Date, lang: Lang): string {
  const f = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Riyadh',
  });
  return lang === 'ar'
    ? `من ${f.format(from)} إلى ${f.format(to)}`
    : `from ${f.format(from)} to ${f.format(to)}`;
}

const SUSPENSION_LABEL: Record<string, { ar: string; en: string }> = {
  conduct: { ar: 'عدم الالتزام بإرشادات المجتمع', en: 'not following the community guidelines' },
  inactivity: { ar: 'عدم النشاط', en: 'inactivity' },
  administrative: { ar: 'إجراء إداري', en: 'an administrative matter' },
  other: { ar: 'سبب آخر', en: 'another reason' },
};
export const suspensionLabel = (category: string | null | undefined, lang: Lang) =>
  SUSPENSION_LABEL[category ?? '']?.[lang] ?? SUSPENSION_LABEL.other![lang];

async function contactEmail(): Promise<string | undefined> {
  const s = await getPublicSettings();
  return s.contactEmail || undefined;
}

// ----------------------------------------------------------------------------------------------- applicants
type AppRow = {
  id: string;
  user_id: string | null;
  email: string;
  locale: string;
  status: string;
  first_name_ar: string | null;
  first_name_en: string | null;
  full_name_ar: string;
  full_name_en: string | null;
  submitted_at: string;
  decided_at: string | null;
  info_request: string | null;
  info_requested_at: string | null;
  accepted_at: string | null;
  lapsed_at: string | null;
  membership_cycles: {
    name_ar: string;
    name_en: string | null;
    closes_at: string;
    review_ends_at: string | null;
    activation_deadline_days: number;
  } | null;
};

const APP_SELECT =
  'id, user_id, email, locale, status, first_name_ar, first_name_en, full_name_ar, full_name_en, submitted_at, decided_at, info_request, info_requested_at, accepted_at, lapsed_at, membership_cycles(name_ar, name_en, closes_at, review_ends_at, activation_deadline_days)';

async function loadApplication(id: string): Promise<AppRow | null> {
  const { data } = await createAdminClient()
    .from('membership_applications')
    .select(APP_SELECT)
    .eq('id', id)
    .maybeSingle();
  return (data as unknown as AppRow) ?? null;
}

const appName = (a: AppRow, lang: Lang) =>
  (lang === 'en' ? (a.first_name_en ?? a.full_name_en) : null) ?? a.first_name_ar ?? a.full_name_ar;
const cycleName = (a: AppRow, lang: Lang) =>
  (lang === 'en' ? a.membership_cycles?.name_en : null) || a.membership_cycles?.name_ar || '';

/** A fresh tracking link for the application (the previous link stops working). */
async function freshTrackingUrl(applicationId: string, lang: Lang): Promise<string | undefined> {
  const { data } = await createAdminClient().rpc('rotate_tracking_token', {
    p_application: applicationId,
  });
  const r = data as { token?: string } | null;
  return r?.token ? `${siteUrl()}${prefix(lang)}/join/status/${r.token}` : undefined;
}

function reviewTimes(a: AppRow, lang: Lang) {
  const c = a.membership_cycles;
  if (!c?.review_ends_at) return { reviewWindow: undefined, decisionBy: undefined };
  const from = new Date(new Date(c.closes_at).getTime() + 86_400_000);
  const to = new Date(new Date(c.review_ends_at).getTime() - 86_400_000);
  return {
    reviewWindow: to > from ? shortRange(from, to, lang) : undefined,
    decisionBy: longDate(c.review_ends_at, lang),
  };
}

/**
 * membership.application_received — once per submission. `token` is the one returned when the person applied; a
 * retry (no token) mints a fresh one, so the link in the delivered mail always works.
 */
export async function notifyApplicationReceived(
  applicationId: string,
  token?: string,
  stateSuffix = '',
): Promise<NotifyOutcome | 'none'> {
  const a = await loadApplication(applicationId);
  if (!a) return 'none';
  const lang = loc(a.locale);
  return notify({
    templateKey: 'membership.application_received',
    entityType: 'membership_application',
    entityId: a.id,
    state: `${new Date(a.submitted_at).getTime()}${stateSuffix}`,
    recipient: { userId: a.user_id, email: a.email, locale: lang },
    data: async () => {
      const trackingUrl = token
        ? `${siteUrl()}${prefix(lang)}/join/status/${token}`
        : await freshTrackingUrl(a.id, lang);
      const times = reviewTimes(a, lang);
      return {
        name: appName(a, lang),
        eventTitle: cycleName(a, lang),
        reference: (await referenceOf(a.id)) ?? undefined,
        trackingUrl,
        ...times,
        eventUrl: `${siteUrl()}${prefix(lang)}/events`,
      };
    },
  });
}

async function referenceOf(id: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .from('membership_applications')
    .select('reference')
    .eq('id', id)
    .maybeSingle();
  return data?.reference ?? null;
}

/** membership.info_requested — the reviewer's message and a link to fix only what was asked. */
export async function notifyApplicationInfoRequested(
  applicationId: string,
): Promise<NotifyOutcome | 'none'> {
  const a = await loadApplication(applicationId);
  if (!a || a.status !== 'info_requested' || !a.info_requested_at) return 'none';
  const lang = loc(a.locale);
  return notify({
    templateKey: 'membership.info_requested',
    entityType: 'membership_application',
    entityId: a.id,
    state: `info:${new Date(a.info_requested_at).getTime()}`,
    recipient: { userId: a.user_id, email: a.email, locale: lang },
    data: async () => ({
      name: appName(a, lang),
      eventTitle: cycleName(a, lang),
      infoRequest: a.info_request ?? '',
      infoDeadline: longDate(
        a.membership_cycles?.review_ends_at ?? a.membership_cycles?.closes_at,
        lang,
      ),
      trackingUrl: await freshTrackingUrl(a.id, lang),
    }),
  });
}

/** The community WhatsApp group link set by the administrators (empty when none). */
async function communityWhatsapp(): Promise<string | null> {
  const { data } = await createAdminClient()
    .from('site_settings')
    .select('value')
    .eq('key', 'community_whatsapp_link')
    .maybeSingle();
  return typeof data?.value === 'string' && data.value ? data.value : null;
}

/**
 * membership.application_accepted / rejected / waitlisted — one mail per decision (idempotent on the decision time).
 * Rejected and waitlisted mails are plain: no note, no reason (the internal note is never part of the data).
 */
export async function notifyApplicationDecision(
  applicationId: string,
  /** Only for an acceptance that just created the person's account: the one-time link to set a password. */
  activationUrl?: string,
): Promise<NotifyOutcome | 'none'> {
  const a = await loadApplication(applicationId);
  if (!a || !a.decided_at) return 'none';
  const template: TemplateKey | null =
    a.status === 'accepted'
      ? 'membership.application_accepted'
      : a.status === 'rejected'
        ? 'membership.application_rejected'
        : a.status === 'waitlisted'
          ? 'membership.application_waitlisted'
          : null;
  if (!template) return 'none';
  const lang = loc(a.locale);
  return notify({
    templateKey: template,
    entityType: 'membership_application',
    entityId: a.id,
    state: `${template}:${new Date(a.decided_at).getTime()}`,
    recipient: { userId: a.user_id, email: a.email, locale: lang },
    data: async () => {
      const deadlineDays = a.membership_cycles?.activation_deadline_days ?? 7;
      const base: TemplateData = {
        name: appName(a, lang),
        eventTitle: cycleName(a, lang),
        membershipUrl: `${siteUrl()}${prefix(lang)}/account/profile`,
        eventUrl: `${siteUrl()}${prefix(lang)}/events`,
      };
      if (template === 'membership.application_accepted')
        return {
          ...base,
          activationUrl,
          activationDays: deadlineDays,
          activationDeadline: longDate(
            new Date(
              new Date(a.accepted_at ?? a.decided_at ?? Date.now()).getTime() +
                deadlineDays * 86_400_000,
            ),
            lang,
          ),
          whatsappUrl: await communityWhatsapp(),
        };
      if (template === 'membership.application_waitlisted')
        return {
          ...base,
          trackingUrl: await freshTrackingUrl(a.id, lang),
          decisionBy: longDate(a.membership_cycles?.review_ends_at, lang) || undefined,
        };
      return base;
    },
  });
}

/** membership.activation_reminder (day 3 / day 6): a fresh one-time link, in the person's language. */
export async function notifyActivationReminder(
  applicationId: string,
  day: number,
): Promise<NotifyOutcome | 'none'> {
  const a = await loadApplication(applicationId);
  if (!a || a.status !== 'accepted') return 'none';
  const lang = loc(a.locale);
  return notify({
    templateKey: 'membership.activation_reminder',
    entityType: 'membership_application',
    entityId: a.id,
    state: `reminder:${day}`,
    recipient: { userId: a.user_id, email: a.email, locale: lang },
    data: async () => {
      const days = a.membership_cycles?.activation_deadline_days ?? 7;
      return {
        name: appName(a, lang),
        eventTitle: cycleName(a, lang),
        activationUrl: await activationLinkFor(a.email, lang),
        activationDeadline: longDate(
          new Date(new Date(a.accepted_at ?? Date.now()).getTime() + days * 86_400_000),
          lang,
        ),
      };
    },
  });
}

/** membership.activation_lapsed — plain. */
export async function notifyActivationLapsed(
  applicationId: string,
): Promise<NotifyOutcome | 'none'> {
  const a = await loadApplication(applicationId);
  if (!a || a.status !== 'lapsed') return 'none';
  const lang = loc(a.locale);
  return notify({
    templateKey: 'membership.activation_lapsed',
    entityType: 'membership_application',
    entityId: a.id,
    state: `lapsed:${a.lapsed_at ? new Date(a.lapsed_at).getTime() : 0}`,
    recipient: { userId: a.user_id, email: a.email, locale: lang },
    data: { name: appName(a, lang), eventTitle: cycleName(a, lang) },
  });
}

/** A one-time link to choose a password (recovery link through the confirm route). */
export async function activationLinkFor(email: string, lang: Lang): Promise<string | undefined> {
  const gen = await createAdminClient().auth.admin.generateLink({ type: 'recovery', email });
  const hash = gen.data?.properties?.hashed_token;
  if (!hash) return undefined;
  return `${siteUrl()}/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=recovery&next=${encodeURIComponent('/reset-password?welcome=1')}${lang === 'en' ? '&locale=en' : ''}`;
}

// ----------------------------------------------------------------------------------------------- members
type MemberRow = {
  id: string;
  user_id: string | null;
  first_name_ar: string;
  first_name_en: string | null;
  last_name_ar: string;
  term_ends_at: string | null;
  profiles: { email: string; preferred_locale: string; full_name_ar: string } | null;
};

async function loadMember(id: string): Promise<MemberRow | null> {
  const { data } = await createAdminClient()
    .from('members')
    .select(
      'id, user_id, first_name_ar, first_name_en, last_name_ar, term_ends_at, profiles:user_id(email, preferred_locale, full_name_ar)',
    )
    .eq('id', id)
    .maybeSingle();
  return (data as unknown as MemberRow) ?? null;
}

const memberName = (m: MemberRow, lang: Lang) =>
  lang === 'en' ? (m.first_name_en ?? m.first_name_ar) : m.first_name_ar;

/** member.term_reminder — the smallest due mark (30 / 7 / 1 days), once per term. */
export async function notifyTermReminder(
  memberId: string,
  days: number,
  termEndsAt: string,
): Promise<NotifyOutcome | 'none'> {
  const m = await loadMember(memberId);
  if (!m?.profiles) return 'none';
  const lang = loc(m.profiles.preferred_locale);
  return notify({
    templateKey: 'member.term_reminder',
    entityType: 'member',
    entityId: m.id,
    state: `${termEndsAt}:${days}`,
    recipient: { userId: m.user_id, email: m.profiles.email, locale: lang },
    data: {
      name: memberName(m, lang),
      eventTitle: '',
      daysLeft: days,
      termEnd: longDate(termEndsAt, lang),
      membershipUrl: `${siteUrl()}${prefix(lang)}/account/membership`,
    },
  });
}

type MemberEventRow = { id: number; kind: string; data: Record<string, unknown> | null };

async function latestEvent(memberId: string, kind: string): Promise<MemberEventRow | null> {
  const { data } = await createAdminClient()
    .from('member_events')
    .select('id, kind, data')
    .eq('member_id', memberId)
    .eq('kind', kind)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as unknown as MemberEventRow) ?? null;
}

export const MEMBER_MAIL_KINDS = {
  expired: 'member.expired',
  renewed: 'member.renewed',
  suspended: 'member.suspended',
  reinstated: 'member.reinstated',
  ended: 'member.ended',
  leave_requested: 'member.leave_requested',
  leave_approved: 'member.leave_approved',
  leave_declined: 'member.leave_declined',
} as const;
export type MemberMailKind = keyof typeof MEMBER_MAIL_KINDS;

/**
 * The mail for the member's latest event of this kind (expired, renewed, suspended, reinstated, ended, leave
 * requested / approved / declined). The event id is the idempotency state: one mail per event. The internal reason
 * is never part of the data; a suspension shows its category only, and the optional message from leadership.
 */
export async function notifyMemberEvent(
  memberId: string,
  kind: MemberMailKind,
): Promise<NotifyOutcome | 'none'> {
  const m = await loadMember(memberId);
  if (!m?.profiles) return 'none';
  const ev = await latestEvent(memberId, kind);
  if (!ev) return 'none';
  const lang = loc(m.profiles.preferred_locale);
  const d = ev.data ?? {};
  const str = (k: string) => (typeof d[k] === 'string' && d[k] ? (d[k] as string) : null);
  const db = createAdminClient();
  return notify({
    templateKey: MEMBER_MAIL_KINDS[kind],
    entityType: 'member',
    entityId: m.id,
    state: `ev:${ev.id}`,
    recipient: { userId: m.user_id, email: m.profiles.email, locale: lang },
    data: async () => {
      const base: TemplateData = {
        name: memberName(m, lang),
        eventTitle: '',
        membershipUrl: `${siteUrl()}${prefix(lang)}/account/membership`,
        message: str('message'),
        termEnd: m.term_ends_at ? longDate(m.term_ends_at, lang) : undefined,
      };
      if (kind === 'suspended') {
        const { data: row } = await db
          .from('members')
          .select('suspension_category')
          .eq('id', m.id)
          .maybeSingle();
        return {
          ...base,
          reasonLabel: suspensionLabel(str('category') ?? row?.suspension_category, lang),
          until: str('until') ? longDate(str('until'), lang) : undefined,
          contactEmail: await contactEmail(),
        };
      }
      if (kind === 'expired')
        return { ...base, termEnd: longDate(str('term_ends_at') ?? m.term_ends_at, lang) };
      if (kind === 'leave_approved') {
        const { data: pos } = await db
          .from('role_assignments')
          .select('committees(name_ar, name_en)')
          .eq('user_id', m.user_id ?? '')
          .not('ends_at', 'is', null)
          .gte('ends_at', new Date(Date.now() - 7 * 86_400_000).toISOString())
          .limit(1)
          .maybeSingle();
        const c = (
          pos as unknown as {
            committees: { name_ar: string; name_en: string | null } | null;
          } | null
        )?.committees;
        return {
          ...base,
          lastDay: longDate(str('effective_on') ?? new Date(), lang),
          positionLine: c ? (lang === 'en' ? (c.name_en ?? c.name_ar) : c.name_ar) : null,
        };
      }
      return base;
    },
  });
}

/** account.blocked / account.unblocked — plain notices to the account's e-mail. */
export async function notifyAccount(
  userId: string,
  kind: 'blocked' | 'unblocked',
  stamp: string,
): Promise<NotifyOutcome | 'none'> {
  const { data: p } = await createAdminClient()
    .from('profiles')
    .select('id, email, preferred_locale, full_name_ar')
    .eq('id', userId)
    .maybeSingle();
  if (!p) return 'none';
  const lang = loc(p.preferred_locale);
  return notify({
    templateKey: kind === 'blocked' ? 'account.blocked' : 'account.unblocked',
    entityType: 'profile',
    entityId: p.id,
    state: `${kind}:${stamp}`,
    recipient: { userId: p.id, email: p.email, locale: lang },
    data: async () => ({
      name: p.full_name_ar.split(' ')[0] ?? p.full_name_ar,
      eventTitle: '',
      contactEmail: await contactEmail(),
      membershipUrl: `${siteUrl()}${prefix(lang)}/login`,
    }),
  });
}

// ----------------------------------------------------------------------------------------------- leadership
type Recipient = { id: string; email: string; locale: string; name: string };

export async function leadershipRecipients(): Promise<Recipient[]> {
  const { data } = await createAdminClient().rpc('leadership_digest');
  return ((data as { recipients?: Recipient[] } | null)?.recipients ?? []) as Recipient[];
}

/** A member asked to leave (member.leave_notice) or to renew (member.renewal_requested): leadership is told. */
export async function notifyLeadershipOfRequest(
  kind: 'leave' | 'renewal',
  memberId: string,
  requestId: string,
  message?: string | null,
): Promise<number> {
  const m = await loadMember(memberId);
  if (!m) return 0;
  let sent = 0;
  for (const r of await leadershipRecipients()) {
    const lang = loc(r.locale);
    const name = `${m.first_name_ar} ${m.last_name_ar}`.trim();
    const out = await notify({
      templateKey: kind === 'leave' ? 'member.leave_notice' : 'member.renewal_requested',
      entityType: 'leadership',
      entityId: `${requestId}:${r.id}`,
      state: kind,
      recipient: { userId: r.id, email: r.email, locale: lang },
      data: {
        name: r.name.split(' ')[0] ?? r.name,
        eventTitle: '',
        requester: name,
        message: message ?? null,
        termEnd: m.term_ends_at ? longDate(m.term_ends_at, lang) : undefined,
        reviewUrl: `${siteUrl()}${prefix(lang)}/dashboard/${kind === 'leave' ? 'membership/leave-requests' : `members/${m.id}`}`,
      },
    });
    if (out === 'sent') sent += 1;
  }
  return sent;
}

/** The daily digest to everyone who can act on it (idempotent per day and recipient). */
export async function sendLeadershipDigest(): Promise<{ recipients: number; sent: number }> {
  const { data } = await createAdminClient().rpc('leadership_digest');
  const g = data as unknown as {
    today: string;
    recipients: Recipient[];
    lapsed: { name_ar: string; name_en: string }[];
    promoted: { name_ar: string; name_en: string }[];
    ending_this_week: number;
    pending_leave: number;
    oldest_leave_days: number;
    renewal_requests: number;
    new_applications: number;
  } | null;
  if (!g) return { recipients: 0, sent: 0 };
  let sent = 0;
  for (const r of g.recipients) {
    const lang = loc(r.locale);
    const digest: DigestData = {
      lapsed: g.lapsed.map((x) => (lang === 'en' ? x.name_en : x.name_ar)),
      promoted: g.promoted.map((x) => (lang === 'en' ? x.name_en : x.name_ar)),
      endingThisWeek: g.ending_this_week,
      pendingLeave: g.pending_leave,
      oldestLeaveDays: g.oldest_leave_days,
      renewalRequests: g.renewal_requests,
      newApplications: g.new_applications,
    };
    const quiet =
      !digest.lapsed.length &&
      !digest.promoted.length &&
      !digest.endingThisWeek &&
      !digest.pendingLeave &&
      !digest.renewalRequests &&
      !digest.newApplications;
    if (quiet) continue;
    const out = await notify({
      templateKey: 'leadership.digest',
      entityType: 'leadership',
      entityId: `digest:${r.id}`,
      state: g.today,
      recipient: { userId: r.id, email: r.email, locale: lang },
      data: {
        name: r.name.split(' ')[0] ?? r.name,
        eventTitle: '',
        when: longDate(g.today, lang),
        digest,
        reviewUrl: `${siteUrl()}${prefix(lang)}/dashboard/membership/waitlist`,
      },
    });
    if (out === 'sent') sent += 1;
  }
  return { recipients: g.recipients.length, sent };
}

// ----------------------------------------------------------------------------------------------- outbox (undo window)
export const UNDO_HOLD_SECONDS = 6;

/** Holds a decision mail back for the undo window; the row is released by flushOutbox() (or cancelled by the undo). */
export async function enqueueDecisionMail(
  applicationId: string,
  template:
    | 'membership.application_accepted'
    | 'membership.application_rejected'
    | 'membership.application_waitlisted',
  activationUrl?: string,
): Promise<void> {
  const a = await loadApplication(applicationId);
  if (!a?.decided_at) return;
  await createAdminClient()
    .from('email_outbox')
    .upsert(
      {
        template_key: template,
        entity_type: 'membership_application',
        entity_id: a.id,
        state: String(new Date(a.decided_at).getTime()),
        recipient_email: a.email,
        recipient_user_id: a.user_id,
        locale: loc(a.locale),
        data: activationUrl ? { activationUrl } : {},
        not_before: new Date(Date.now() + UNDO_HOLD_SECONDS * 1000).toISOString(),
        status: 'pending',
      },
      { onConflict: 'template_key,entity_id,state', ignoreDuplicates: true },
    );
}

/** Releases the outbox rows that are due. Safe to call from anywhere, any number of times. */
export async function flushOutbox(
  limit = 50,
): Promise<{ sent: number; skipped: number; failed: number }> {
  const db = createAdminClient();
  const { data } = await db.rpc('claim_due_outbox', { p_limit: limit });
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of data ?? []) {
    let outcome: string = 'none';
    try {
      if (row.entity_type === 'membership_application') {
        const activationUrl =
          typeof (row.data as { activationUrl?: string } | null)?.activationUrl === 'string'
            ? (row.data as { activationUrl: string }).activationUrl
            : undefined;
        outcome = await notifyApplicationDecision(row.entity_id, activationUrl);
      }
    } catch (e) {
      console.error('[outbox] send failed', row.id, (e as Error).message);
      outcome = 'failed';
    }
    const status =
      outcome === 'sent' || outcome === 'duplicate'
        ? 'sent'
        : outcome === 'failed'
          ? 'failed'
          : 'cancelled';
    await db
      .from('email_outbox')
      .update({ status, data: {}, processed_at: new Date().toISOString() })
      .eq('id', row.id);
    if (status === 'sent') sent += 1;
    else if (status === 'failed') failed += 1;
    else skipped += 1;
  }
  return { sent, skipped, failed };
}

export async function cancelDecisionMail(applicationId: string): Promise<void> {
  await createAdminClient().rpc('cancel_outbox', {
    p_entity_type: 'membership_application',
    p_entity_id: applicationId,
  });
}

/**
 * The acceptance mail again with a fresh one-time activation link: after leadership restores a lapsed person, or
 * resends it from the activation list. Every call is its own event (no idempotency collision).
 */
export async function sendActivationMail(
  applicationId: string,
  kind: 'restored' | 'resend',
): Promise<NotifyOutcome | 'none'> {
  const a = await loadApplication(applicationId);
  if (!a || a.status !== 'accepted') return 'none';
  const lang = loc(a.locale);
  return notify({
    templateKey: 'membership.application_accepted',
    entityType: 'membership_application',
    entityId: a.id,
    state: `${kind}:${Date.now()}`,
    recipient: { userId: a.user_id, email: a.email, locale: lang },
    data: async () => {
      const days = a.membership_cycles?.activation_deadline_days ?? 7;
      return {
        name: appName(a, lang),
        eventTitle: cycleName(a, lang),
        membershipUrl: `${siteUrl()}${prefix(lang)}/account/profile`,
        activationUrl: await activationLinkFor(a.email, lang),
        activationDays: days,
        activationDeadline: longDate(new Date(Date.now() + days * 86_400_000), lang),
        whatsappUrl: await communityWhatsapp(),
      };
    },
  });
}
