import { describe, expect, it } from 'vitest';
import { updatePasswordSchema } from '@/modules/auth/schemas';

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
