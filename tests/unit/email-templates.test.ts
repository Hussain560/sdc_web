import { describe, expect, it } from 'vitest';
import { renderTemplate, type TemplateKey } from '@/lib/email/templates';

const base = {
  name: 'Sara <b>',
  eventTitle: 'Workshop & "More"',
  registrationsUrl: 'https://x.test/account/registrations',
};
const KEYS: TemplateKey[] = [
  'registration.received',
  'registration.confirmed',
  'registration.rejected',
  'registration.waitlisted',
  'registration.cancelled_by_organizer',
  'event.cancelled',
  'event.changed',
  'review.pending',
  'committee.assigned',
];

describe('e-mail templates', () => {
  it.each(KEYS)('%s renders in both languages with escaped values', (key) => {
    for (const lang of ['ar', 'en'] as const) {
      const mail = renderTemplate(key, lang, base);
      expect(mail.subject.length).toBeGreaterThan(5);
      expect(mail.html).toContain(`lang="${lang}"`);
      expect(mail.html).toContain(lang === 'ar' ? 'dir="rtl"' : 'dir="ltr"');
      expect(mail.html).not.toContain('<b>');
      expect(mail.html).toContain('Sara &lt;b&gt;');
      expect(mail.text).toContain('Sara <b>');
    }
  });

  it('uses the Arabic wording when asked', () => {
    expect(renderTemplate('registration.confirmed', 'ar', base).subject).toContain('تم قبول');
    expect(renderTemplate('registration.confirmed', 'en', base).subject).toContain('in:');
  });

  it('puts the group link only where it is passed (confirmed), as the button target', () => {
    const link = 'https://chat.example.test/g';
    const confirmed = renderTemplate('registration.confirmed', 'en', { ...base, groupLink: link });
    expect(confirmed.html).toContain(`href="${link}"`);
    const received = renderTemplate('registration.received', 'en', base);
    expect(received.html).not.toContain(link);
    expect(received.html).toContain('href="https://x.test/account/registrations"');
  });

  it('includes the organiser reason for a cancelled registration', () => {
    const mail = renderTemplate('registration.cancelled_by_organizer', 'en', {
      ...base,
      note: 'Room unavailable',
    });
    expect(mail.html).toContain('Room unavailable');
  });

  it('review.pending points the publisher at the submitted article', () => {
    const mail = renderTemplate('review.pending', 'en', {
      ...base,
      reviewUrl: 'https://x.test/en/dashboard/articles/abc',
    });
    expect(mail.subject).toContain('waiting for your review');
    expect(mail.html).toContain('href="https://x.test/en/dashboard/articles/abc"');
    expect(renderTemplate('review.pending', 'ar', base).subject).toContain('بانتظار مراجعتك');
  });

  it('committee.assigned names the position and opens the dashboard', () => {
    const mail = renderTemplate('committee.assigned', 'en', {
      ...base,
      eventTitle: 'Committee head · AI',
      dashboardUrl: 'https://x.test/en/dashboard',
    });
    expect(mail.subject).toContain('Committee head · AI');
    expect(mail.html).toContain('href="https://x.test/en/dashboard"');
  });
});

describe('welcome mail', () => {
  const data = { name: 'Sara', eventTitle: '', activationUrl: 'https://x.test/activate' };
  it('shows the WhatsApp group only when a link is set', () => {
    const without = renderTemplate('membership.application_accepted', 'ar', data);
    expect(without.html).not.toContain('whatsapp');
    const withLink = renderTemplate('member.created', 'en', {
      ...data,
      whatsappUrl: 'https://chat.whatsapp.com/abc',
    });
    expect(withLink.html).toContain('href="https://chat.whatsapp.com/abc"');
    expect(withLink.text).toContain('https://chat.whatsapp.com/abc');
    expect(withLink.html).toContain('welcome-banner.png');
  });
});
