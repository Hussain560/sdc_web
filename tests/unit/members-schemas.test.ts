import { describe, expect, it } from 'vitest';
import { emptyProfile, toProfilePayload, validateProfile } from '@/modules/members/schemas';
import { renderTemplate, type TemplateKey } from '@/lib/email/templates';

describe('member profile form', () => {
  const valid = () => ({ ...emptyProfile(), firstNameAr: 'سارة', lastNameAr: 'العتيبي' });

  it('accepts a minimal profile', () => {
    expect(validateProfile(valid(), 'en')).toEqual({});
  });

  it('requires the Arabic first name and bounds the text', () => {
    expect(validateProfile({ ...valid(), firstNameAr: ' ' }, 'ar').firstNameAr).toBeTruthy();
    expect(validateProfile({ ...valid(), bioAr: 'x'.repeat(1001) }, 'en').bioAr).toBeTruthy();
    expect(
      validateProfile({ ...valid(), firstNameEn: 'x'.repeat(101) }, 'en').firstNameAr,
    ).toBeTruthy();
  });

  it('ME-3: links must be https and short', () => {
    const e = validateProfile(
      {
        ...valid(),
        githubUrl: 'http://x.test',
        xUrl: 'https://x.com/a',
        linkedinUrl: `https://${'a'.repeat(500)}.com`,
      },
      'en',
    );
    expect(Object.keys(e).sort()).toEqual(['githubUrl', 'linkedinUrl']);
  });

  it('maps to the database payload without status or dates (ME-2)', () => {
    const p = toProfilePayload({ ...valid(), isDirectoryVisible: true, universityId: '3' });
    expect(p).toMatchObject({
      first_name_ar: 'سارة',
      university_id: '3',
      is_directory_visible: true,
    });
    expect(Object.keys(p)).not.toContain('status');
    expect(Object.keys(p)).not.toContain('joined_at');
  });
});

describe('membership and claim templates', () => {
  const KEYS: TemplateKey[] = [
    'membership.application_accepted',
    'membership.application_rejected',
    'membership.application_waitlisted',
    'member.claim_invite',
  ];
  const data = {
    name: 'Sara <b>',
    eventTitle: 'Intake 2027',
    membershipUrl: 'https://x.test/m',
    eventUrl: 'https://x.test/e',
    claimUrl: 'https://x.test/claim/abc',
  };

  it.each(KEYS)('%s renders in both languages and escapes values', (key) => {
    for (const lang of ['ar', 'en'] as const) {
      const mail = renderTemplate(key, lang, data);
      expect(mail.subject.length).toBeGreaterThan(5);
      expect(mail.html).toContain(lang === 'ar' ? 'dir="rtl"' : 'dir="ltr"');
      expect(mail.html).toContain('Sara &lt;b&gt;');
      expect(mail.html).not.toContain('<b>');
    }
  });

  it('the claim invite carries the link and says it is valid for 7 days', () => {
    const en = renderTemplate('member.claim_invite', 'en', data);
    expect(en.html).toContain('href="https://x.test/claim/abc"');
    expect(en.text).toContain('7 days');
    expect(renderTemplate('member.claim_invite', 'ar', data).text).toContain('7 أيام');
  });

  it('the decision mails never include an internal note', () => {
    for (const key of KEYS.slice(0, 3)) {
      const mail = renderTemplate(key, 'en', { ...data, note: undefined });
      expect(mail.html.toLowerCase()).not.toContain('internal');
    }
  });
});
