/**
 * Shared motion presets for the `motion` package (Sprint 17, MOT-001). Every animated component imports these;
 * nobody writes durations or easings by hand. The numbers mirror the CSS tokens in `src/styles/tokens.css`
 * (--duration-*, --ease-*), and a unit test keeps the two in step. Pure data: no import of `motion` here, so a
 * page that only needs a preset's numbers never loads the library.
 */
export type Bezier = [number, number, number, number];

export const ease = {
  out: [0.2, 0, 0, 1] as Bezier,
  in: [0.4, 0, 1, 1] as Bezier,
  standard: [0.2, 0, 0.2, 1] as Bezier,
};

/** Seconds, as `motion` expects them. */
export const dur = { instant: 0.1, fast: 0.16, base: 0.24, slow: 0.4, counter: 1.2 };

export const spring = {
  soft: { type: 'spring' as const, stiffness: 380, damping: 34 },
  snappy: { type: 'spring' as const, stiffness: 520, damping: 38 },
};

/** Stagger: 40 ms per item, 8 items at most (so the longest wait is 320 ms). */
export const stagger = { step: 0.04, max: 8 };
export const staggerDelay = (index: number) =>
  Math.min(Math.max(index, 0), stagger.max - 1) * stagger.step;

/** Direction of travel for the reading direction: "next" comes from the left in Arabic and from the right in English. */
export const reading = (rtl: boolean) => (rtl ? -1 : 1);

export const presets = {
  /** M2 in JavaScript form (for islands): fade and rise once. */
  reveal: {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: dur.slow, ease: ease.out },
  },
  /** M7 dialogs. */
  dialog: {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, transition: { duration: dur.fast, ease: ease.in } },
    transition: { duration: dur.base, ease: ease.out },
  },
  /** M8 bottom sheets: a soft spring; closing by drag is decided by the sheet (30 % of its height or 500 px/s). */
  sheet: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: spring.soft,
  },
  /** M12 wizard steps: the content enters from the side of progress. `dir` is 1 for next and -1 for back. */
  step: (dir: 1 | -1, rtl: boolean) => ({
    initial: { opacity: 0, x: 24 * dir * reading(rtl) },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 * dir * reading(rtl) },
    transition: { duration: dur.base, ease: ease.out },
  }),
  /** M9 grid re-flow and M13 chips: layout animation. */
  layout: { layout: true as const, transition: { duration: dur.base, ease: ease.standard } },
  /** M13 a chip appears or goes away. */
  chip: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9, transition: { duration: dur.fast } },
    transition: spring.soft,
  },
  /** M15 toasts rise from the bottom of the screen. */
  toast: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, transition: { duration: dur.fast } },
    transition: { duration: dur.base, ease: ease.out },
  },
  /** M9 a card that stays, enters or leaves the directory grid. */
  card: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96, transition: { duration: dur.fast } },
    transition: { duration: dur.base, ease: ease.standard },
  },
};

/** The marquee: two rows move in opposite directions (seconds per lap), slow to a stop on hover or focus. */
export const marquee = {
  lapSeconds: [70, 85] as const,
  stopMs: 600,
  resumeAfterTouchMs: 3000,
  staticCount: 8,
};
