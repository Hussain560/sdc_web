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
  | 'membership.application_received';

export type TemplateData = {
  name: string;
  eventTitle: string;
  eventUrl?: string;
  registrationsUrl?: string;
  membershipUrl?: string;
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
