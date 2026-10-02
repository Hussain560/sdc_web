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
});
