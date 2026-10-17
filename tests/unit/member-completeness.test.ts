import { describe, expect, it } from 'vitest';
import cases from '../fixtures/completeness-cases.json';
import { completeness, completenessOf } from '@/modules/members/completeness';

describe('member completeness', () => {
  it.each(cases)('$name', (c) => {
    const r = completeness({
      hasPhoto: c.photo,
      headline: c.headline,
      about: c.about,
      skillCount: c.skills,
      linkCount: c.links,
    });
    expect(r.percent).toBe(c.percent);
  });

  it('suggests the first missing step in the editor order', () => {
    const r = completeness({
      hasPhoto: true,
      headline: '',
      about: 'x',
      skillCount: 0,
      linkCount: 0,
    });
    expect(r.missing).toEqual(['headline', 'skills', 'links']);
    expect(r.next).toBe('headline');
  });

  it('has no next step at 100 %', () => {
    const r = completeness({
      hasPhoto: true,
      headline: 'x',
      about: 'y',
      skillCount: 3,
      linkCount: 1,
    });
    expect(r.percent).toBe(100);
    expect(r.next).toBeNull();
  });

  it('counts a headline or an about text in either language and ignores empty links', () => {
    const r = completenessOf({
      photoPath: 'u/a.webp',
      headlineAr: null,
      headlineEn: 'Designer',
      aboutAr: '',
      aboutEn: 'Hello',
      skillCount: 3,
      links: ['https://a.example', '', null],
    });
    expect(r.percent).toBe(100);
  });
});
