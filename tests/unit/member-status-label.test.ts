import { describe, expect, it } from 'vitest';
import { memberStatusLabel } from '@/modules/members/schemas';

describe('memberStatusLabel', () => {
  it('knows the four lifecycle states', () => {
    expect(memberStatusLabel('active').tone).toBe('accent');
    expect(memberStatusLabel('suspended').tone).toBe('warning');
    expect(memberStatusLabel('expired').en).toBe('Term ended');
    expect(memberStatusLabel('ended').tone).toBe('neutral');
  });

  it('never throws for a status from outside the lifecycle: it shows the value, neutral', () => {
    expect(memberStatusLabel('inactive')).toEqual({
      ar: 'inactive',
      en: 'inactive',
      tone: 'neutral',
    });
    expect(memberStatusLabel(null).tone).toBe('neutral');
    expect(memberStatusLabel(undefined).en).toBe('—');
  });
});
