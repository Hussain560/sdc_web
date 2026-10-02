import { describe, expect, it } from 'vitest';
import { sanitizeRedirect } from '@/modules/auth/redirect';

describe('sanitizeRedirect (AU-4)', () => {
  it.each([
    ['/events/3', '/events/3'],
    ['/events/3?tab=info#top', '/events/3?tab=info#top'],
    ['/en/events/3', '/events/3'],
    ['/ar/members', '/members'],
    ['/en', '/'],
    ['/account/profile', '/account/profile'],
    ['/reset-password', '/reset-password'],
  ])('keeps the same-site path %s', (input, expected) => {
    expect(sanitizeRedirect(input)).toBe(expected);
  });

  it.each([
    'https://evil.example',
    'http://evil.example/x',
    '//evil.example',
    '///evil.example',
    '/\\evil.example',
    '\\\\evil.example',
    'javascript:alert(1)',
    'data:text/html,<script>1</script>',
    '/\t/evil.example',
    '/\nSet-Cookie: x=1',
    'events/3',
    '',
    '   ',
    '/login',
    '/en/login?x=1',
    '/' + 'a'.repeat(600),
  ])('rejects hostile or looping value %j', (input) => {
    expect(sanitizeRedirect(input)).toBe('/');
  });

  it('rejects non-strings and honours the fallback', () => {
    expect(sanitizeRedirect(undefined)).toBe('/');
    expect(sanitizeRedirect(42, '/account')).toBe('/account');
    expect(sanitizeRedirect('//x', '/account')).toBe('/account');
  });
});
