import { describe, expect, it } from 'vitest';
import { fieldErrorsOf, signUpSchema, updatePasswordSchema } from '@/modules/auth/schemas';

const valid = {
  fullName: 'سارة محمد العتيبي',
  email: 'Sara@Example.Test ',
  password: 'Str0ng!pass',
  confirmPassword: 'Str0ng!pass',
};

describe('signUpSchema (AU-1, AU-2)', () => {
  it('accepts a valid sign-up and normalises e-mail and name spacing', () => {
    const r = signUpSchema('ar').safeParse({ ...valid, fullName: '  سارة   محمد  العتيبي ' });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe('sara@example.test');
      expect(r.data.fullName).toBe('سارة محمد العتيبي');
    }
  });

  it('requires at least three name words', () => {
    const r = signUpSchema('en').safeParse({ ...valid, fullName: 'Sara Alotaibi' });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrorsOf(r.error).fullName).toMatch(/full name/i);
  });

  it('gives Arabic messages for the Arabic locale', () => {
    const r = signUpSchema('ar').safeParse({ ...valid, fullName: 'سارة' });
    if (!r.success) expect(fieldErrorsOf(r.error).fullName).toMatch(/الاسم الثلاثي/);
  });

  it.each(['Sh0rt!1', 'alllowercase1!', 'ALLUPPERCASE1!', 'NoDigits!!', 'NoSymbol123A', 'Ab1!'])(
    'rejects the weak password %s',
    (password) => {
      const r = signUpSchema('en').safeParse({ ...valid, password, confirmPassword: password });
      expect(r.success).toBe(false);
    },
  );

  it('rejects a mismatching confirmation on the confirmPassword field', () => {
    const r = signUpSchema('en').safeParse({ ...valid, confirmPassword: 'Different1!' });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(fieldErrorsOf(r.error))).toContain('confirmPassword');
  });

  it('rejects an invalid e-mail', () => {
    expect(signUpSchema('en').safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a name over 100 characters', () => {
    const long = Array.from({ length: 30 }, () => 'abcde').join(' ');
    expect(signUpSchema('en').safeParse({ ...valid, fullName: long }).success).toBe(false);
  });
});

describe('updatePasswordSchema', () => {
  it('applies the same policy', () => {
    expect(
      updatePasswordSchema('en').safeParse({ password: 'weak', confirmPassword: 'weak' }).success,
    ).toBe(false);
    expect(
      updatePasswordSchema('en').safeParse({
        password: 'Str0ng!pass',
        confirmPassword: 'Str0ng!pass',
      }).success,
    ).toBe(true);
  });
});
