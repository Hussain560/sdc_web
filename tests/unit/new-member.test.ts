import { describe, expect, it } from 'vitest';
import {
  emptyNewMember,
  firstIncompleteStep,
  fullName,
  startsAtIso,
  toCreatePayload,
  validateStep,
  type NewMemberValues,
} from '@/modules/members/new-member';

const complete = (over: Partial<NewMemberValues> = {}): NewMemberValues => ({
  ...emptyNewMember(),
  firstNameAr: 'خالد',
  middleNameAr: 'يوسف',
  lastNameAr: 'الهاجري',
  firstNameEn: 'Khalid',
  middleNameEn: 'Yousef',
  lastNameEn: 'Alhajri',
  email: 'khalid.h@example.com',
  phone: '559876543',
  academicStatus: 'student',
  ...over,
});

describe('add-member wizard rules', () => {
  it('needs first and last name in both languages, but not the middle name', () => {
    const e = validateStep('identity', { ...emptyNewMember(), email: 'a@b.co' }, 'en');
    expect(Object.keys(e).sort()).toEqual([
      'firstNameAr',
      'firstNameEn',
      'lastNameAr',
      'lastNameEn',
    ]);
    expect(
      validateStep('identity', complete({ middleNameAr: '', middleNameEn: '' }), 'en'),
    ).toEqual({});
  });

  it('answers in the language of the page', () => {
    expect(validateStep('identity', emptyNewMember(), 'ar').firstNameAr).toBe(
      'اكتب الاسم الأول بالعربية.',
    );
    expect(validateStep('identity', emptyNewMember(), 'en').firstNameAr).toBe(
      'Enter the first name in Arabic.',
    );
  });

  it('checks the e-mail and the phone for the chosen country', () => {
    expect(validateStep('identity', complete({ email: 'not-an-email' }), 'en').email).toBeTruthy();
    expect(validateStep('identity', complete({ phone: '12' }), 'en').phone).toBeTruthy();
    expect(validateStep('identity', complete({ phone: '' }), 'en').phone).toBeUndefined();
    expect(validateStep('identity', complete({ phone: '559876543' }), 'en')).toEqual({});
  });

  it('bounds every name part at 100 characters', () => {
    expect(
      validateStep('identity', complete({ middleNameEn: 'x'.repeat(101) }), 'en').middleNameEn,
    ).toBeTruthy();
  });

  it('needs the academic status', () => {
    expect(
      validateStep('academic', complete({ academicStatus: '' }), 'en').academicStatus,
    ).toBeTruthy();
    expect(validateStep('academic', complete(), 'en')).toEqual({});
  });

  it('the position is optional, but a committee needs a role and a role needs a committee', () => {
    expect(validateStep('position', complete(), 'en')).toEqual({});
    expect(validateStep('position', complete({ committeeId: 'c1' }), 'en').roleKey).toBeTruthy();
    expect(
      validateStep('position', complete({ roleKey: 'committee_member' }), 'en').committeeId,
    ).toBeTruthy();
    expect(
      validateStep('position', complete({ committeeId: 'c1', roleKey: 'committee_member' }), 'en'),
    ).toEqual({});
    expect(
      validateStep(
        'position',
        complete({ committeeId: 'c1', roleKey: 'committee_member', startsAt: '31/12/2026' }),
        'en',
      ).startsAt,
    ).toBeTruthy();
  });

  it('skips the position step for someone who cannot assign positions', () => {
    expect(
      validateStep('position', complete({ committeeId: 'c1' }), 'en', { canAssign: false }),
    ).toEqual({});
  });

  it('finds the first step that still has a problem', () => {
    expect(firstIncompleteStep(complete(), 'en', { canAssign: true })).toBeNull();
    expect(firstIncompleteStep(complete({ academicStatus: '' }), 'en', { canAssign: true })).toBe(
      'academic',
    );
    expect(firstIncompleteStep(complete({ email: 'x' }), 'en', { canAssign: true })).toBe(
      'identity',
    );
  });
});

describe('the payload', () => {
  it('uses the international phone number and trims the names', () => {
    const p = toCreatePayload(complete({ firstNameAr: '  خالد  ' }), { canAssign: true });
    expect(p.first_name_ar).toBe('خالد');
    expect(p.phone).toBe('+966559876543');
    expect(p.academic_status).toBe('student');
    expect('role_key' in p).toBe(false);
  });

  it('sends the position at Saudi midnight, with the handover choice', () => {
    const p = toCreatePayload(
      complete({
        committeeId: 'c1',
        roleKey: 'committee_head',
        startsAt: '2026-10-17',
        handover: true,
        keepAsDeputy: true,
      }),
      { canAssign: true },
    ) as Record<string, unknown>;
    expect(p.role_key).toBe('committee_head');
    expect(p.starts_at).toBe('2026-10-16T21:00:00.000Z');
    expect(p.handover).toBe(true);
    expect(p.keep_as_deputy).toBe(true);
  });

  it('keeps the old head only when there is a handover', () => {
    const p = toCreatePayload(
      complete({ committeeId: 'c1', roleKey: 'committee_member', keepAsDeputy: true }),
      { canAssign: true },
    ) as Record<string, unknown>;
    expect(p.keep_as_deputy).toBe(false);
  });

  it('leaves the position out when the person cannot assign it', () => {
    const p = toCreatePayload(complete({ committeeId: 'c1', roleKey: 'committee_member' }), {
      canAssign: false,
    });
    expect('role_key' in p).toBe(false);
  });

  it('startsAtIso is midnight in Riyadh', () => {
    expect(startsAtIso('2026-01-01')).toBe('2025-12-31T21:00:00.000Z');
  });

  it('joins the name parts and skips the empty ones', () => {
    expect(fullName('خالد', '', 'الهاجري')).toBe('خالد الهاجري');
    expect(fullName('Khalid', ' Yousef ', 'Alhajri')).toBe('Khalid Yousef Alhajri');
  });
});
