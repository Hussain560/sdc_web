/**
 * Profile completeness: ONE definition, used by the editor, the dashboard list and the member detail page.
 * Five checks of 20 % each (Sprint 17 design): a photo, a headline, an about text, three or more skills, one or more
 * links. The database mirrors it in `private.member_completeness()` so lists can filter and total it; both are tested
 * against the same cases in `tests/fixtures/completeness-cases.json`.
 */
export const COMPLETENESS_CHECKS = ['photo', 'headline', 'about', 'skills', 'links'] as const;
export type CompletenessCheck = (typeof COMPLETENESS_CHECKS)[number];

/** What each check needs (3 skills, 1 link). */
export const MIN_SKILLS = 3;
export const MIN_LINKS = 1;

export type CompletenessInput = {
  hasPhoto: boolean;
  headline: string | null | undefined;
  about: string | null | undefined;
  skillCount: number;
  linkCount: number;
};

export type Completeness = {
  /** 0, 20, 40, 60, 80 or 100. */
  percent: number;
  done: Record<CompletenessCheck, boolean>;
  /** The checks still open, in the order the editor suggests them. */
  missing: CompletenessCheck[];
  /** The next suggested step, or null at 100 %. */
  next: CompletenessCheck | null;
};

const filled = (v: string | null | undefined) => !!v && v.trim().length > 0;

export function completeness(input: CompletenessInput): Completeness {
  const done: Record<CompletenessCheck, boolean> = {
    photo: input.hasPhoto,
    headline: filled(input.headline),
    about: filled(input.about),
    skills: input.skillCount >= MIN_SKILLS,
    links: input.linkCount >= MIN_LINKS,
  };
  const missing = COMPLETENESS_CHECKS.filter((c) => !done[c]);
  const percent = (COMPLETENESS_CHECKS.length - missing.length) * 20;
  return { percent, done, missing, next: missing[0] ?? null };
}

/** The headline of a member in either language counts, the about text likewise. */
export function completenessOf(m: {
  photoPath?: string | null;
  headlineAr?: string | null;
  headlineEn?: string | null;
  aboutAr?: string | null;
  aboutEn?: string | null;
  skillCount: number;
  links: Array<string | null | undefined>;
}): Completeness {
  return completeness({
    hasPhoto: !!m.photoPath,
    headline: m.headlineAr || m.headlineEn,
    about: m.aboutAr || m.aboutEn,
    skillCount: m.skillCount,
    linkCount: m.links.filter(filled).length,
  });
}
