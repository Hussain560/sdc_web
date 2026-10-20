# 12 · Motion (Sprint 17, MOT-001/002)

One vocabulary, three layers. Durations and easings come from `tokens.css`; nothing animates anything but `transform` and `opacity`.

| Layer | Tool | Used for |
|---|---|---|
| CSS | `src/styles/motion.css` | page enter `m-enter`, scroll reveal `m-reveal`, list stagger `m-in`, card lift `m-lift`, count-up `m-count`, live pulse `m-live` |
| Route | React `<ViewTransition>` (`PageMain`) | page crossfade (`m-page`), photo and name morph card → profile (`morph`), header and footer stay still |
| Islands | `motion` 14 (`MotionProvider`, `animation` or `max`) | home marquee, dialog and sheet springs, drag; one island per page, never a layout |

Scroll feel (MOT-002, owner request: pages should feel alive while scrolling; CSS only, scroll-driven timelines, final state where unsupported):

| Class | Effect | Used on |
|---|---|---|
| `m-progress` | 3 px signal bar fills with page scroll (`scroll(root)`), starts at the reading side | every public page, in `SiteHeader` |
| `m-reveal` + `--i` | fade and rise as the block enters; `--i` shifts the start so items of one row follow each other | every `SectionHeader`, `CtaBand`, home stats and cards, article, committee and join cards |
| `m-parallax` + `--m-par` | decorative layer drifts against the scroll | home hero mark and glow |
| `m-slide` | eases in from the side the reader comes from (`--m-x`, `--m-dir`) | available for feature blocks |
| `Words` | hero title words rise one after another (`m-in`), spaces stay plain text | home hero |
| `StatsRow` | numbers under 1000 count up (`m-count`), real figure kept for screen readers | home stats |

The sticky header works because `html, body` use `overflow-x: clip` (not `hidden`, which turns body into a scroll container).

Rules: reduced motion removes all movement (CSS media query, `MotionConfig reducedMotion="user"`, view-transition animations off); the marquee becomes a still grid of eight and has a pause button; browsers without the View Transitions API navigate as before.

Marquee (RDS-035): two rows, 70 s and 85 s per loop, opposite directions; speed eases to zero in about 600 ms on hover or focus; drag with momentum; touch stops it and it resumes after 3 s; the duplicate copy is `inert` and `aria-hidden`; members with a public photo first, shuffled once per UTC day; fewer than 6 listed members keeps the plain grid.
