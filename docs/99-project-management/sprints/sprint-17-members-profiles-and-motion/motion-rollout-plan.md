# Motion and scroll roll-out plan (MOT-002)

Source of truth for the numbers: `docs/10-design-system/PUBLIC-SCREENS-V2/12-motion.md` and the Claude design
`designs/text/motion-language.txt` (16 patterns, M1 to M16). The foundation (MOT-001) is in place:
`src/styles/motion.css`, `src/lib/motion.ts`, `MotionProvider`, `PageMain` (route transitions). This plan is only about
**applying** the patterns to the pages.

## Skill choice

None of the owner's enabled skills covers motion. Candidates found, in the order of fit for this stack (CSS scroll-driven
animation + `motion` 14 + React `ViewTransition`, no GSAP):

| Candidate | Source | Why |
|---|---|---|
| `web-animation-design`, `emil-design-engineering` (plugin `audit-suite`) | Anthropic plugin directory | Judgment: when to animate, durations, easing, restraint. Fits "calm motion, felt not noticed" |
| `motion-framer` | `freshtechbro/claudedesignskills` (skills.sh, 5.7K installs) | API reference for `motion` (layout, `AnimatePresence`, drag, springs) |
| `scroll-animations` | `dylantarre/animation-principles` (1.1K installs) | Scroll-driven patterns, a second opinion on M2 |
| `gsap-framer-scroll-animation` | `github/awesome-copilot` | Not recommended: pulls GSAP, which the spec excludes (15 KB budget) |

Third-party skills are untrusted instructions; read one before installing, and the project's own spec always wins over
a skill when they disagree (frozen identity D-009, `12-motion.md` numbers).

## Where we are (audit of `src`)

| Pattern | Done | Missing |
|---|---|---|
| M1 page enter (`m-enter`) | Members, Profile | Home, Events, Event page, Articles, Committees, Join |
| M2 scroll reveal (`m-reveal`) | About | Home sections, Event page, Articles, Committees, Join, Profile sections |
| M3 stagger (`m-in`) | Event cards, directory cards, leadership, profile | Article cards, committee cards, home upcoming events |
| M4 lift (`m-lift`, `m-zoom`) | About, event cards | Directory, article, committee and home cards |
| M5 marquee | Home (3 rows) | none |
| M6 count-up (`m-count`) | About | Home community numbers, profile stats |
| M7 dialogs (`motion`) | not found outside the wizard | All dialogs |
| M8 bottom sheet | not found | Mobile filters, skills picker, preview, assign position |
| M9 grid reflow (`layout`) | not found | Directory filters and search |
| M10 photo/name morph | Directory to Profile | none |
| M11 route crossfade | `PageMain` on every public page | Dashboard layout (by design calmer) |
| M12 wizard steps | `AddMemberWizard` | check reading direction in RTL |
| M13 skill chip, `Reorder` | not found | Profile editor |
| M14 completeness fill | not found | Profile editor |
| M15 toast | not found | Save confirmations |
| M16 live pulse | `m-live` class exists | One "on now" event only |

## Work packages

Each package is its own commit; transform and opacity only, reduced motion verified, no layout shift.

1. **WP1 Public pages, CSS only (no new JS)**: M1 on every page's first screen (title, description, buttons, at most
   five children), M2 on section titles and big cards, M3 and M4 on every card grid, M6 on Home and profile numbers,
   M16 on one live event. Home order from the design: hero M1, community numbers M6, sections M2, upcoming events M3
   and M4, marquee M5.
2. **WP2 Directory (members)**: M9 re-flow on filter or search change (`layout` plus `AnimatePresence popLayout`), M3
   only on first render and "load more". Result count stays in `aria-live`.
3. **WP3 Overlays**: M7 dialogs, M8 bottom sheets with drag to dismiss (30 % or 500 px/s), M15 toast (4 s, pauses on
   hover or focus). One shared component each, so pages do not write their own.
4. **WP4 Editor**: M13 skill chips with `Reorder` (keyboard alternative Alt + arrows), M14 completeness fill and the
   100 % signal flash, M12 direction check.
5. **WP5 Dashboard (calm)**: dialogs, wizard, toasts and editor only. No scroll reveal, no count-up.
6. **WP6 Tests and docs**: unit tests for presets and the reduced-motion branch, one Playwright test with motion on
   (marquee moves, pauses on focus, content readable at once), bundle check under 15 KB on pages that use `motion`,
   `12-motion.md` usage table updated, visual baselines refreshed only with owner approval.

## Rules that do not move

- Reduced motion removes all movement (CSS media query, `MotionConfig reducedMotion="user"`); browsers without
  `animation-timeline: view()` show the final state.
- Content is in the HTML first; animation never delays it, never hides it from screen readers.
- Arabic first: "next" enters from the left in Arabic and from the right in English.
- No new colors, fonts or radii (D-009); numbers come from the tokens, nobody writes ad-hoc durations.

## Decisions needed from the owner

1. Which skill to install (recommended: `audit-suite` for judgment, plus `motion-framer` for API reference).
2. Should WP1 ship before the baselines are refreshed? New entrance motion does not change still screenshots under
   `reducedMotion: 'reduce'`, so baselines should stay unchanged; confirm.
3. Scroll effects beyond the spec (parallax, pinned sections) are not in the design; approve them separately or skip.
