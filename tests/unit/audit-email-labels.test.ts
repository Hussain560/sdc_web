import { describe, expect, it } from 'vitest';
import {
  actionGroupLabel,
  actionLabel,
  entityLabel,
  fieldLabel,
  valueLabel,
} from '@/modules/admin/audit-labels';
import { emailEntityLabel, emailErrorLabel, templateLabel } from '@/modules/admin/email-labels';
import { LIFECYCLE_KEYS } from '@/lib/email/lifecycle-templates';

describe('audit log wording', () => {
  it('translates known actions, groups and entities in both languages', () => {
    expect(actionLabel('role.assigned', 'ar')).toBe('عُيّن في منصب');
    expect(actionLabel('member.renewed', 'en')).toBe('Membership renewed');
    expect(actionGroupLabel('member', 'ar')).toBe('الأعضاء');
    expect(actionGroupLabel('role', 'en')).toBe('Positions and permissions');
    expect(entityLabel('role_assignment', 'ar')).toBe('منصب');
  });

  it('never shows a raw code for an action nobody labelled yet', () => {
    expect(actionLabel('event.deleted_all', 'en')).not.toContain('_');
    expect(actionLabel('article.updated', 'ar')).toBe('تعديل: مقال');
    expect(actionGroupLabel('something_new', 'en')).toBe('something new');
  });

  it('shows the fields and values of a summary as words', () => {
    expect(fieldLabel('starts_at', 'ar')).toBe('يبدأ في');
    expect(fieldLabel('headline_ar', 'en')).toBe('Headline (Arabic)');
    expect(valueLabel('role_key', 'committee_member', 'ar')).toBe('عضو لجنة');
    expect(valueLabel('flag', true, 'ar')).toBe('نعم');
    expect(valueLabel('ends_at', null, 'en')).toBe('—');
    expect(valueLabel('user_id', '421d5031-d796-4974-919a-19228cb675bd', 'en')).toBe('#b675bd');
    expect(valueLabel('starts_at', '2026-09-12T09:38:15.348923+00:00', 'en')).toMatch(/2026/);
    expect(valueLabel('fields', ['headline_en', 'about_ar'], 'en')).toBe(
      'Headline (English), About (Arabic)',
    );
  });
});

describe('e-mail log wording', () => {
  it('has a name for every lifecycle template and the older ones', () => {
    for (const key of [
      ...LIFECYCLE_KEYS,
      'registration.confirmed',
      'membership.application_accepted',
    ]) {
      expect(templateLabel(key, 'ar')).not.toContain('.');
      expect(templateLabel(key, 'en')).not.toContain('.');
    }
  });

  it('translates entity types and error codes', () => {
    expect(emailEntityLabel('membership_application', 'ar')).toBe('طلب عضوية');
    expect(emailErrorLabel('PROVIDER_ERROR', 'en')).toContain('provider');
    expect(emailErrorLabel('SOME_NEW_CODE', 'en')).toBe('some new code');
  });
});
