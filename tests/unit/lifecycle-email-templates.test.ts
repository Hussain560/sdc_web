import { describe, expect, it } from 'vitest';
import { LIFECYCLE_KEYS, PLAIN_KEYS } from '@/lib/email/lifecycle-templates';
import { renderTemplate, type TemplateData, type TemplateKey } from '@/lib/email/templates';

const data: TemplateData = {
  name: 'Noura <i>',
  eventTitle: '',
  reference: 'SDC-26-0123',
  trackingUrl: 'https://x.test/join/status/tok',
  membershipUrl: 'https://x.test/account/membership',
  activationUrl: 'https://x.test/auth/confirm?welcome=1',
  termEnd: '30 June 2027',
  daysLeft: 7,
  activationDays: 7,
  activationDeadline: '8 Nov 2026',
  infoRequest: 'Please add a link to your work',
  reasonLabel: 'Inactivity',
  until: '1 Jan 2027',
  requester: 'Khalid',
  subject: 'A note',
  text: 'Hello from leadership',
  digest: {
    lapsed: ['A'],
    promoted: ['B'],
    endingThisWeek: 2,
    pendingLeave: 1,
    oldestLeaveDays: 3,
    renewalRequests: 1,
    newApplications: 4,
  },
};

const ALL: TemplateKey[] = [
  ...LIFECYCLE_KEYS,
  'membership.application_received',
  'membership.application_accepted',
  'membership.application_rejected',
  'membership.application_waitlisted',
];

describe('lifecycle e-mails', () => {
  it.each(ALL)('%s renders in both languages, escaped', (key) => {
    for (const lang of ['ar', 'en'] as const) {
      const mail = renderTemplate(key, lang, data);
      expect(mail.subject.length).toBeGreaterThan(3);
      expect(mail.html).toContain(`lang="${lang}"`);
      expect(mail.html).toContain(lang === 'ar' ? 'dir="rtl"' : 'dir="ltr"');
      expect(mail.html).not.toContain('<i>');
      expect(mail.text.length).toBeGreaterThan(10);
    }
  });

  it.each(ALL)('%s never attaches or links the membership card as a file', (key) => {
    const mail = renderTemplate(key, 'en', data);
    expect(mail.html).not.toMatch(/\/card\/print|\.pdf|\.pkpass|attachment/i);
  });

  it('a rejection is plain: no internal note, no button, no reason', () => {
    const mail = renderTemplate('membership.application_rejected', 'en', {
      ...data,
      note: 'INTERNAL: weak portfolio',
    });
    expect(mail.html).not.toContain('INTERNAL');
    expect(mail.text).not.toContain('INTERNAL');
    expect(mail.html).not.toMatch(/<a [^>]*class="[^"]*btn/i);
  });

  it.each(['membership.activation_lapsed', 'member.leave_declined', 'account.blocked'] as const)(
    '%s is plain (no button)',
    (key) => {
      expect(PLAIN_KEYS).toContain(key);
      expect(renderTemplate(key, 'ar', data).html).not.toContain('href="https://x.test/join');
    },
  );

  it('the term reminder says how many days are left and when the term ends', () => {
    const mail = renderTemplate('member.term_reminder', 'en', { ...data, daysLeft: 30 });
    expect(mail.subject).toContain('30 days');
    expect(mail.text).toContain('30 June 2027');
    const one = renderTemplate('member.term_reminder', 'en', { ...data, daysLeft: 1 });
    expect(one.subject).toBe('Your membership ends tomorrow');
    expect(
      renderTemplate('member.term_reminder', 'en', { ...data, daysLeft: 7 }).subject,
    ).toContain('7 days');
    expect(
      renderTemplate('member.term_reminder', 'ar', { ...data, daysLeft: 7 }).subject,
    ).toContain('7 أيام');
  });

  it('a suspension shows the category, never an internal reason', () => {
    const mail = renderTemplate('member.suspended', 'en', {
      ...data,
      note: 'INTERNAL: conduct report 14',
    });
    expect(mail.text).toContain('Inactivity');
    expect(mail.text).not.toContain('INTERNAL');
  });

  it('the activation reminder carries the deadline and the activation link', () => {
    const mail = renderTemplate('membership.activation_reminder', 'en', data);
    expect(mail.text).toContain('8 Nov 2026');
    expect(mail.html).toContain('https://x.test/auth/confirm?welcome=1');
  });

  it('the info request quotes what the reviewer asked and links the tracking page', () => {
    const mail = renderTemplate('membership.info_requested', 'ar', data);
    expect(mail.text).toContain('Please add a link to your work');
    expect(mail.html).toContain('https://x.test/join/status/tok');
  });

  it('the leadership digest lists the counts', () => {
    const mail = renderTemplate('leadership.digest', 'en', data);
    expect(mail.text).toContain('4');
    expect(mail.text).toContain('2');
  });

  it('a message from leadership uses their subject and text', () => {
    const mail = renderTemplate('member.message', 'en', data);
    expect(mail.subject).toContain('A note');
    expect(mail.text).toContain('Hello from leadership');
  });
});
