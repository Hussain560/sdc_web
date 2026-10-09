# Claude Design Brief: SDC Design System and Public Website Redesign

> **How to use:** connect the SDC repository to Claude Design (or attach it), then paste the section under **"Paste this"** as one message.
> Claude Design reads the files listed under **Read first** before producing anything. Each output is a file in the repo, reviewed through a pull request, the same as code.
>
> **Decision needed before using this brief:** the current decision D-009 freezes the visual identity for public pages. This brief is an explicit redesign request from the project owner. Record it as a new decision (`docs/90-decisions/`) that supersedes D-009 for the public pages, keeping the brand palette and logo as the starting point. Until that is recorded, the brief is not approved.

---

## Paste this

```markdown
Role: Senior product designer and design-systems lead for the Saudi Developer Community (SDC), a non-profit,
Arabic-first developer community. Your job has three parts, in this order:

  PART 1. Create the design system (tokens, typography, layout, components, patterns, accessibility rules).
  PART 2. Redesign the public website from scratch on that system, including new pages and sections.
  PART 3. Specify the implementation so engineers can build it in small reviewed pull requests.

Do not start Part 2 until Part 1 is written and checked against the rules below.

## READ FIRST (in this order, all of them)

1. docs/README.md and docs/10-design-system/README.md
2. docs/10-design-system/foundations/*: colors.md, typography.md, layout-and-shape.md, rtl-and-i18n.md, theming.md
3. docs/10-design-system/components.md, patterns.md, accessibility.md
4. docs/10-design-system/PUBLIC-SCREENS/*: the current public pages, with their blueprints, layout rules and states
5. docs/10-design-system/INTERNAL-SCREENS/80-user-flows.md (for flows only; do not redesign the dashboard)
6. docs/03-business-domain/ and docs/00-product/: who the members are, what the community does, the events model
7. docs/90-decisions/: especially D-009 (being superseded for public pages), ADR-010 (locale in URL), ADR-013 (accounts for members only)
8. src/styles/primitives.css (the brand palette: every color value lives here as --c-*), src/styles/tokens.css
   (semantic tokens used by the code: bg-surface, text-muted, accent, ...), src/styles/ui.css
9. src/components/ui/* (existing primitives), src/components/Header, Footer, HeroSection, ArticlesSection,
   MembersSection, CommunitySections, src/modules/events/components/public/*
10. public/assets/ (logos, the navbar and hero art). Use the existing logo files; do not redraw them.

## STARTING POINT: THE BRAND (keep these)

- Brand colours come from the existing palette in src/styles/primitives.css. The core is a deep green canvas (#050D09),
  a neon signal green accent (#00E676), a green-tinted surface, and a light theme with mint canvas (#F4FAF6) and dark green
  text (#123B35). Start from these values; you may refine tints and steps, but the result must stay recognisably SDC.
- Typography: IBM Plex Sans Arabic for Arabic and Rubik for Latin (both already loaded). Do not add a third family.
- Logo: the existing SDC mark and wordmark. Keep the clear space and do not recolour it outside the approved variants.
- Dark theme first; a complete light theme is required, not an afterthought.

## PART 1: DESIGN SYSTEM (deliverables)

Write these into docs/10-design-system/ (new files, or updates to the existing ones):

A. **Foundations**: colour roles (canvas, surface, raised surface, border, text, muted text, accent, accent text,
   success, warning, danger, info), with light and dark values; type scale (sizes, line heights, weights, both scripts);
   spacing scale (4px base); radius scale; elevation and borders; motion (durations, easing, reduced motion);
   iconography (lucide, stroke 1.75); focus ring.
   Every colour is a semantic token that maps to a primitive. No raw hex anywhere outside primitives.css.

B. **Layout**: the grid per breakpoint (phone 360 to desktop 1440+), container widths, section rhythm,
   gutters (16px on phones), and the rule that content never scrolls sideways.

C. **RTL and i18n**: logical properties only (inline-start, inline-end, margin-inline, padding-block-start, ...).
   Arabic is the default and is the reference layout; English mirrors it. Numbers, dates, e-mails and URLs keep their
   own direction. Text expansion: every component must hold 30% longer English text without breaking.

D. **Components**: for each component give anatomy, variants, states (default, hover, focus-visible, active, disabled,
   loading, error, empty), sizes, and the Arabic and English example. Components to cover at minimum:
   button (primary, secondary, ghost, icon, destructive; capsule), link, badge and status pill, tag chip,
   card (event, article, member, partner, feature, stat), avatar, input and textarea, select, switch, checkbox,
   radio, form field with hint and error, dialog and sheet, toast, tabs, accordion (FAQ), breadcrumb, pagination,
   stepper, empty state, skeleton, image with fallback, logo, navigation bar (desktop and mobile drawer),
   footer, language and theme switch, countdown and date chip, QR card, certificate card.

E. **Patterns**: hero, section header (title, lede, action), card grid, filterable list, detail page with side
   facts, timeline, call-to-action band, testimonial or quote, partner strip, member directory, form layout,
   confirmation and feedback (modal confirm, toast, inline error).

F. **Accessibility**: WCAG 2.2 AA on every token pair (give the contrast ratio for each text colour on each surface, both
   themes); keyboard order; visible focus; touch targets 44px; reduced motion; alt text rules; language attributes.

G. **Tokens file mapping**: a table from each semantic token to its primitive, so engineers can update
   src/styles/tokens.css and primitives.css without guessing.

## PART 2: PUBLIC WEBSITE REDESIGN (from scratch)

Redesign every public page on the system above. The current pages are a starting list, not a limit.

### Existing public pages (redesign all)
- Home (/): hero, what the community is, upcoming events, latest articles, members, partners, join call-to-action.
- About (/about): mission, values, history, how the community is run (committees and roles).
- Events list (/events): filters (type, status, date), cards, past events, empty states.
- Event detail (/events/[slug]): the most important page. Requirements below.
- Articles list (/articles) and article detail (/articles/[slug]): reading layout, author and tags, related items.
- Members (/members) and member profile (/members/[id]): directory with filters, profile page.
- Committees (/committees/[slug]): what the committee does, its lead, its events and articles.
- Join (/join): explain the membership process and the intake windows, then the application form.
- Login, forgot password, reset password, claim profile: calm, short, one task per screen.
- Certificate verification (/certificates/[id]): public, trustworthy, printable.
- Privacy notice (/privacy).
- Not found (404) and error pages: helpful, bilingual, with a route back.

### New pages and sections (propose and design; mark which are essential for launch)
- Home sections to add: "How it works" (three steps from joining to certificate), impact figures (counted from the
  database, never invented), testimonials (only with consent), "Get involved" (volunteer roles from committees),
  a calendar strip, and the FAQ.
- New pages: FAQ (/faq), Contact (/contact, with a form), Partners (/partners, with partner tiers), Gallery or
  Highlights (/highlights), Membership process (/membership, can merge with /join), Certificates explainer, and
  a Press and media kit (logo downloads, brand rules).
- For each new page give: purpose, audience, sections in order, data source (database or static content), and
  what happens when there is no data.

### Event detail page (required redesign)
The event page is where people decide to attend. Design:
- A hero with title, date and time chip, location or online badge, seats left, and one primary action.
- The registration action: a single, clear "Register" button that opens the registration dialog. Show the state
  clearly: open, closed, full (join the waiting list), registered (show the confirmation), cancelled.
- Sections in order: about the event, agenda or sessions (for multi-day events, one card per day), speakers
  (if any), goals and audience, location and map link, FAQ, related events.
- A side panel on desktop with the key facts; it becomes a sticky bottom action bar on phones.
- Multi-day events: show each day with its own check-in status when the event is running.
- Certificate note: state the attendance requirement in plain words, with the threshold from site settings.
- Every state must be designed: upcoming, running, finished, cancelled, full.

### Members section (required redesign)
- Directory: search, filter by committee and track, card grid with avatar, name, track, and committee role.
- Member profile: photo, bio, track and university (only when the member made it public), committees and roles,
  articles and events they took part in.
- Respect privacy: a member who is not listed in the directory is never shown, and no contact details are shown
  unless the member chose to show them.
- Empty and loading states for the directory.

### Visual direction
- Keep the brand. The result should feel like a serious, well-run developer community: confident typography, generous
  space, real photography or the brand illustrations, and restrained use of the neon accent (emphasis only).
- Avoid generic template looks: no stock hero with three floating cards, no gradient washes as decoration, no
  identical rounded card grids everywhere. Give each page one memorable element.
- Motion: one meaningful page-load moment on the home page, and motion that answers a user action (opening, confirming).
  Nothing that delays content.

### Content rules
- Every string exists in Arabic and English. Arabic is written in Modern Standard Arabic with a warm, plain tone.
- Do not invent statistics, names, testimonials, dates or partners. Use placeholders clearly marked as such, and list
  them in the output so the owner can replace them.
- Plain verbs, sentence case in English, no all-caps labels, no decorative "eyebrow" labels above every heading.

## PART 3: IMPLEMENTATION SPEC (deliverables)

- A sprint plan in docs/99-project-management/sprints/ (one plan file, same format as the existing sprints): stories,
  acceptance criteria, tasks in small pull requests, and the order: tokens first, then components, then pages.
- For each page: the component list, the data each page reads (which query or content file), the states, and the tests
  to add (unit tests for logic, Playwright for the flows and for visual snapshots).
- Note that visual regression baselines will change. Do not update baselines in the plan without the owner's approval.

## HARD RULES (apply to everything you produce)

1. Semantic tokens only in the implementation. No new hex values outside primitives.css.
2. Arabic-first and RTL-correct: logical CSS properties; test both directions.
3. Both themes, both languages, for every page and component.
4. WCAG 2.2 AA: contrast, focus, keyboard, labels, target sizes.
5. Use the existing primitives in src/components/ui and extend them rather than duplicating them.
6. Links and routing use `Link` and `useRouter` from `@/i18n/navigation`. English URLs live under `/en`.
7. Permissions come from the database, never from hard-coded role lists; public pages show only published content.
8. Privacy: nothing personal is shown without a consent flag; the directory respects the visibility setting.
9. No design is final until it has been checked against the current content on the staging site.
10. Output is reviewed by the owner before engineering starts. Ask questions where a choice is the owner's
    (brand changes, new content, legal wording) instead of deciding it.

## WHAT TO RETURN

1. A short summary: the design direction in five sentences, and the list of files you created or changed.
2. The design system files (Part 1).
3. The page specifications (Part 2), one file per page or group, each with a wireframe in ASCII and a state list.
4. The implementation sprint plan (Part 3).
5. A list of open questions for the owner.
```

---

## Notes for the owner (not part of the prompt)

- The prompt is long on purpose: Claude Design needs the rules, the existing files and the scope in one place. Paste it once, then continue the work in small follow-up messages.
- Outputs land in `docs/10-design-system/` and `docs/99-project-management/sprints/`. Review them as you would a code pull request, and merge them through the normal flow.
- Implementation happens after the owner approves the design system. Engineering does not start from the screens alone.
- The brand is the anchor: colours, logo and typography stay recognisably SDC. Changing the palette is a separate decision for the owner.
