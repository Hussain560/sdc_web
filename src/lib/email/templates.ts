import type { Lang } from '@/modules/auth/messages';

/** Every template, in both languages. Values are escaped here, so callers pass raw strings (notifications NO-4). */
export type TemplateKey =
  | 'registration.received'
  | 'registration.confirmed'
  | 'registration.rejected'
  | 'registration.waitlisted'
  | 'registration.cancelled_by_organizer'
  | 'event.cancelled'
  | 'event.changed'
  | 'membership.application_received'
  | 'membership.application_accepted'
  | 'membership.application_rejected'
  | 'membership.application_waitlisted'
  | 'member.claim_invite'
  | 'review.pending'
  | 'committee.assigned';

export type TemplateData = {
  name: string;
  eventTitle: string;
  eventUrl?: string;
  registrationsUrl?: string;
  membershipUrl?: string;
  /** member.claim_invite: the one-time link (7 days). */
  claimUrl?: string;
  /** review.pending: where a publisher opens the submitted item. */
  reviewUrl?: string;
  /** committee.assigned: the dashboard the new position opens. */
  dashboardUrl?: string;
  when?: string;
  where?: string;
  /** Only ever set for registration.confirmed (NO-6). */
  groupLink?: string | null;
  note?: string | null;
};

export type Rendered = { subject: string; html: string; text: string };

const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The e-mail brand colour (same green as the existing messages); e-mail clients need inline hex values.
const BRAND = '#286A5E';

type Copy = {
  subject: string;
  lead: string;
  body: string[];
  action?: { label: string; url?: string };
};

function copy(key: TemplateKey, lang: Lang, d: TemplateData): Copy {
  const t = d.eventTitle;
  const ar = lang === 'ar';
  const mine = { label: ar ? 'تسجيلاتي' : 'My registrations', url: d.registrationsUrl };
  const browse = { label: ar ? 'تصفّح الفعاليات' : 'Browse events', url: d.eventUrl };
  const details = [
    ...(d.when ? [ar ? `الموعد: ${d.when}` : `When: ${d.when}`] : []),
    ...(d.where ? [ar ? `المكان: ${d.where}` : `Where: ${d.where}`] : []),
  ];
  const reason = d.note ? [ar ? `السبب: ${d.note}` : `Reason: ${d.note}`] : [];

  switch (key) {
    case 'registration.received':
      return {
        subject: ar ? `تم استلام تسجيلك في فعالية ${t}` : `We received your registration for ${t}`,
        lead: ar
          ? `تم استلام طلب تسجيلك في فعالية «${t}».`
          : `We received your registration for “${t}”.`,
        body: [
          ar
            ? 'سيراجع الفريق المختص الطلب، وسيصلك إشعار عند اتخاذ القرار.'
            : 'The organising team will review it, and you will be notified once a decision is made.',
        ],
        action: mine,
      };
    case 'registration.confirmed':
      return {
        subject: ar ? `تم قبول تسجيلك في فعالية ${t}` : `You're in: ${t}`,
        lead: ar
          ? `يسعدنا إخبارك بقبول تسجيلك في فعالية «${t}».`
          : `Your registration for “${t}” is confirmed.`,
        body: [...details, ...(d.note ? [d.note] : [])],
        action: d.groupLink
          ? {
              label: ar ? 'الانضمام إلى مجموعة الفعالية' : 'Join the event group',
              url: d.groupLink,
            }
          : mine,
      };
    case 'registration.rejected':
      return {
        subject: ar ? `بخصوص تسجيلك في فعالية ${t}` : `About your registration for ${t}`,
        lead: ar
          ? `نشكر اهتمامك بفعالية «${t}»، ونأسف لعدم تمكّننا من قبول تسجيلك هذه المرة.`
          : `Thank you for your interest in “${t}”. We are sorry we could not accept your registration this time.`,
        body: [
          ...(d.note ? [d.note] : []),
          ar ? 'نتطلع لرؤيتك في فعالياتنا القادمة.' : 'We hope to see you at our upcoming events.',
        ],
        action: browse,
      };
    case 'registration.waitlisted':
      return {
        subject: ar ? `أنت على قائمة الانتظار لفعالية ${t}` : `You're on the waiting list for ${t}`,
        lead: ar
          ? `أُضيف تسجيلك في فعالية «${t}» إلى قائمة الانتظار.`
          : `Your registration for “${t}” is on the waiting list.`,
        body: [
          ar
            ? 'سنخبرك فور توفّر مقعد.'
            : 'We will let you know as soon as a seat becomes available.',
        ],
        action: mine,
      };
    case 'registration.cancelled_by_organizer':
      return {
        subject: ar ? `تم إلغاء تسجيلك في فعالية ${t}` : `Your registration for ${t} was cancelled`,
        lead: ar
          ? `أُلغي تسجيلك في فعالية «${t}» من قِبل فريق التنظيم.`
          : `The organising team cancelled your registration for “${t}”.`,
        body: reason,
        action: browse,
      };
    case 'membership.application_received':
      return {
        subject: ar ? 'تم استلام طلب عضويتك' : 'We received your membership application',
        lead: ar
          ? `تم استلام طلب انضمامك إلى المجتمع السعودي للمطورين في «${t}».`
          : `We received your application to join the Saudi Developer Community (“${t}”).`,
        body: [
          ar
            ? 'سيراجع الفريق الطلبات بعد إغلاق باب التقديم، وسيصلك القرار بالبريد الإلكتروني. يمكنك متابعة حالة طلبك من حسابك.'
            : 'The team reviews applications once the window closes and you will get the decision by e-mail. You can follow your status in your account.',
        ],
        action: { label: ar ? 'طلبي' : 'My application', url: d.membershipUrl },
      };
    case 'membership.application_accepted':
      return {
        subject: ar
          ? 'مرحبًا بك عضوًا في المجتمع السعودي للمطورين'
          : 'Welcome to the Saudi Developer Community',
        lead: ar
          ? `يسرّنا إبلاغك بقبول طلب عضويتك في «${t}».`
          : `We are delighted to tell you that your membership application (“${t}”) was accepted.`,
        body: [
          ar
            ? 'يمكنك الآن إكمال ملفك الشخصي واختيار ما إذا كنت ترغب في الظهور في دليل الأعضاء.'
            : 'You can now complete your profile and choose whether to appear in the member directory.',
        ],
        action: { label: ar ? 'ملف العضوية' : 'My member profile', url: d.membershipUrl },
      };
    case 'membership.application_rejected':
      return {
        subject: ar ? 'بخصوص طلب عضويتك' : 'About your membership application',
        lead: ar
          ? `نشكرك على اهتمامك بالانضمام إلينا (${t}). لم نتمكن من قبول طلبك في هذه الدورة.`
          : `Thank you for your interest in joining us (${t}). We were not able to accept your application in this cycle.`,
        body: [
          ar
            ? 'يسعدنا استقبال طلبك مجددًا في الدورات القادمة، ويمكنك حضور فعالياتنا دون عضوية.'
            : 'You are welcome to apply again in a future cycle, and you can attend our events without membership.',
        ],
        action: { label: ar ? 'تصفّح الفعاليات' : 'Browse events', url: d.eventUrl },
      };
    case 'membership.application_waitlisted':
      return {
        subject: ar ? 'طلب عضويتك على قائمة الانتظار' : 'Your membership application is waitlisted',
        lead: ar
          ? `أُضيف طلبك في «${t}» إلى قائمة الانتظار.`
          : `Your application (“${t}”) has been placed on the waiting list.`,
        body: [
          ar ? 'سنراسلك إذا توفّر مقعد.' : 'We will get in touch if a place becomes available.',
        ],
        action: { label: ar ? 'طلبي' : 'My application', url: d.membershipUrl },
      };
    case 'member.claim_invite':
      return {
        subject: ar ? 'استعد ملفك في المجتمع السعودي للمطورين' : 'Claim your SDC member profile',
        lead: ar
          ? 'لديك ملف عضو قديم في المجتمع السعودي للمطورين. اربطه بحسابك بنقرة واحدة.'
          : 'You have an existing member profile in the Saudi Developer Community. Link it to your account in one step.',
        body: [
          ar
            ? 'سجّل الدخول (أو أنشئ حسابًا) بهذا البريد الإلكتروني نفسه ثم أكّد أن الملف لك. الرابط صالح لمدة 7 أيام ويُستخدم مرة واحدة.'
            : 'Sign in (or create an account) with this same e-mail address, then confirm the profile is yours. The link is valid for 7 days and works once.',
        ],
        action: { label: ar ? 'المطالبة بملفي' : 'Claim my profile', url: d.claimUrl },
      };
    case 'review.pending':
      return {
        subject: ar ? `مقال بانتظار مراجعتك: ${t}` : `An article is waiting for your review: ${t}`,
        lead: ar
          ? `أُرسل مقال «${t}» للمراجعة وهو بانتظار قرارك.`
          : `“${t}” was submitted for review and is waiting for your decision.`,
        body: [
          ar
            ? 'يمكنك نشره أو طلب تعديلات من المؤلف مع ملاحظة.'
            : 'You can publish it, or ask the author for changes with a note.',
        ],
        action: { label: ar ? 'مراجعة المقال' : 'Review the article', url: d.reviewUrl },
      };
    case 'committee.assigned':
      return {
        subject: ar ? `تم تكليفك: ${t}` : `You have a new position: ${t}`,
        lead: ar
          ? `تم تكليفك بمنصب «${t}» في المجتمع السعودي للمطورين.`
          : `You have been assigned the position “${t}” in the Saudi Developer Community.`,
        body: [
          ar
            ? 'ستجد الأدوات الخاصة بمنصبك في لوحة التحكم.'
            : 'You will find the tools for your position in the dashboard.',
        ],
        action: { label: ar ? 'لوحة التحكم' : 'Open the dashboard', url: d.dashboardUrl },
      };
    case 'event.cancelled':
      return {
        subject: ar ? `إلغاء فعالية ${t}` : `${t} has been cancelled`,
        lead: ar
          ? `نأسف لإبلاغك بإلغاء فعالية «${t}».`
          : `We are sorry to tell you that “${t}” has been cancelled.`,
        body: reason,
        action: browse,
      };
    case 'event.changed':
      return {
        subject: ar ? `تحديث على فعالية ${t}` : `Update to ${t}`,
        lead: ar
          ? `تغيّرت تفاصيل فعالية «${t}» التي سجّلت فيها.`
          : `The details of “${t}”, which you registered for, have changed.`,
        body: details,
        action: { label: ar ? 'عرض الفعالية' : 'View the event', url: d.eventUrl },
      };
  }
}

export function renderTemplate(key: TemplateKey, lang: Lang, data: TemplateData): Rendered {
  const c = copy(key, lang, data);
  const ar = lang === 'ar';
  const greeting = ar ? `أهلًا بك ${data.name}،` : `Hello ${data.name},`;
  const signoff = ar ? 'شكرًا لك،' : 'Thank you,';
  const team = ar ? 'فريق المجتمع السعودي للمطورين' : 'Saudi Developer Community team';
  const orgName = ar ? 'المجتمع السعودي للمطورين' : 'Saudi Developer Community';

  const paragraph = (s: string) =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.9;color:#333333;">${esc(s)}</p>`;
  const button = c.action?.url
    ? `<p style="margin:24px 0;"><a href="${esc(c.action.url)}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;padding:10px 22px;border-radius:8px;font-size:14px;font-weight:bold;">${esc(c.action.label)}</a></p>`
    : '';

  const html = `<!DOCTYPE html>
<html dir="${ar ? 'rtl' : 'ltr'}" lang="${lang}">
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Tahoma, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td align="center" style="background-color:${BRAND};padding:22px 24px;">
          <span style="color:#ffffff;font-size:18px;font-weight:bold;">${esc(orgName)}</span>
        </td></tr>
        <tr><td style="padding:28px 24px;text-align:${ar ? 'right' : 'left'};">
          ${paragraph(greeting)}
          ${paragraph(c.lead)}
          ${c.body.map(paragraph).join('\n          ')}
          ${button}
          <hr style="border:none;border-top:1px solid #eeeeee;margin:0 0 16px;">
          <p style="margin:0;font-size:14px;color:#333333;">${esc(signoff)}<br><strong>${esc(team)}</strong></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    greeting,
    '',
    c.lead,
    ...c.body,
    ...(c.action?.url ? ['', `${c.action.label}: ${c.action.url}`] : []),
    '',
    signoff,
    team,
  ].join('\n');
  return { subject: c.subject, html, text };
}
