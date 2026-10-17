# Sprint 17 — Members: Rich Profiles, Admin Flows, and Motion

## Sprint Metadata

| Field                 | Value |
| --------------------- | ----- |
| **Sprint #**          | 17 |
| **Duration**          | 2 weeks |
| **Start Date**        | 2026-10-18 (indicative) |
| **End Date**          | 2026-10-31 |
| **Phase / Milestone** | Phase 7 — Public redesign follow-up / M10 |
| **Target version**    | contributes to the next minor after the launch release |
| **Capacity**          | ~30 SP — planned 36 SP (step 0 and the motion stories can slip to Sprint 18) |
| **Team**              | Tech lead + Claude; owner for design approval, copy and the open questions |
| **Status**            | ⬜ Planned — waits on step 0 (designs from Claude Design) |

## Sprint Objective

Members become the community's showcase. Each member can build a real profile: photo, headline, about, skills, projects, links and what they're open to. The public directory and the profile page then show that profile well enough for a recruiter or a visitor to understand who the person is. Leaders add a member in one guided wizard that also places them in a committee, and the member data in the dashboard is complete. The site gets one consistent motion language. Demo: a leader adds a member with a committee position in the wizard. The member signs in, uploads a photo, fills the profile and turns on visibility. The profile appears in the Home marquee, the directory (filtered by skill) and a LinkedIn-like profile page, in AR/EN × dark/light, desktop and phone.

## Why this sprint (the gaps, checked in the code on 2026-10-17)

| # | Gap | Where |
| - | --- | ----- |
| G1 | **No photo upload exists.** `members.photo_path` and `show_photo` exist (RDS-020), but nothing writes the path. The only storage bucket (`public-media`) accepts uploads only from people with `events.edit` | `supabase/migrations/20270403000000_directory_consent.sql`, `20261206000000_events.sql` |
| G2 | **Names are incomplete.** `members` has first and last name per language, no middle name. "Add member" takes one free "full name" field per language | `members` table, `AddMemberDialog.tsx` |
| G3 | **The profile is thin.** There's no headline, skills or tags, projects, extra links or "open to" field, so the profile page can only show name, track, university, bio and four links | `ProfileForm.tsx`, `ProfileView.tsx`, `member_directory` |
| G4 | **Adding a member doesn't place them anywhere.** The committee and position need a second trip to "Assign position" | `AddMemberDialog.tsx`, `create_member` RPC |
| G5 | **The dashboard members list is missing data**: no middle names, committee, position, phone, profile completeness or member detail view (owner report on `develop-sdc-web.vercel.app/dashboard/members`) | `dashboard/members/page.tsx`, `members/queries.ts` |
| G6 | **User search in "Assign position" seems broken.** Likely causes, to confirm by reproducing on the develop site: (a) `searchUsers` returns `[]` silently for actors without `users.view` (for example a committee head on their committee page); (b) the combobox has no loading, "no results" or error state, so an empty answer looks like nothing happened; (c) only profiles are searched and the shown name is `full_name_ar` even in English; (d) no keyboard navigation in the list | `access/actions.ts` `searchUsers`, `AssignRoleDialog.tsx` |
| G7 | **Motion exists only on About and the Events list** (`src/styles/page-motion.css`). Home, the event page, members, articles, committees and Join are static, and there's no shared motion vocabulary | `page-motion.css`, `HomeView.tsx` |
| G8 | **The Home members block is a static grid** of initials (no photos, because of G1) | `HomeView.tsx`, `MemberCard.tsx` |

## Step 0 — Designs (before any UI story starts)

Send [`CLAUDE-DESIGN-PROMPT-MEMBERS-AND-MOTION.md`](../../../10-design-system/CLAUDE-DESIGN-PROMPT-MEMBERS-AND-MOTION.md) to Claude Design. The owner approves the result, and the specs land as `docs/10-design-system/PUBLIC-SCREENS-V2/04-members.md` (replaced) plus a new `12-motion.md` and an internal-screen spec for the wizard. The data stories (MEM-011, MEM-012, ACC-007) can start in parallel.

## User Stories

| Story ID | Title | Priority | Points | Status |
| -------- | ----- | -------- | ------ | ------ |
| MEM-011 | Member data model v3: middle names, headline, about, skills, projects, links, "open to", consent per block | P0 | 5 | ⬜ |
| MEM-012 | Profile photo upload: bucket, policies, crop and resize, consent | P0 | 3 | ⬜ |
| MEM-013 | Member profile editor redesign (`/account/member-profile`) with completeness and live preview | P0 | 5 | ⬜ |
| MEM-014 | Add-member wizard (identity → academic → committee and position → review), one transaction | P0 | 5 | ⬜ |
| MEM-015 | Dashboard members list and member detail with complete data | P0 | 3 | ⬜ |
| ACC-007 | Assign-position dialog: working search, states, keyboard, both languages | P0 | 2 | ⬜ |
| RDS-033 | Members directory redesign (skills filter, richer cards) | P0 | 3 | ⬜ ⛔ step 0 |
| RDS-034 | Member profile page redesign (LinkedIn-like) | P0 | 3 | ⬜ ⛔ step 0 |
| RDS-035 | Home members marquee | P1 | 2 | ⬜ ⛔ step 0 |
| MOT-001 | Motion foundation: the `motion` library, shared presets, CSS layer, View Transitions, reduced-motion rules, tests | P0 | 3 | ⬜ |
| MOT-002 | Motion roll-out on Home, event page, members, articles, committees, Join, wizard and dialogs | P1 | 2 | ⬜ ⛔ step 0 |

### Acceptance criteria per story

**MEM-011 — Data model v3** (migration `<ts>_member_profile_v3.sql`, expand only)
- `members` gains `middle_name_ar`, `middle_name_en` (nullable, ≤ 100), `headline_ar`, `headline_en` (≤ 120), and `about_ar`/`about_en` (≤ 2000; the old `bio_*` becomes the short summary or is migrated, whichever the owner picks). It also gains `open_to` (subset of `internship`, `job`, `freelance`, `mentoring`, `speaking`, `collaboration`), `website_url`, `behance_url`, `dribbble_url` and `youtube_url` (https only), plus `show_headline`, `show_about`, `show_skills`, `show_projects` and `show_open_to` (defaults per Q-M5).
- New reference table `skills` (curated, ar/en names, category such as Web, AI and data, Security, Mobile, Design, Cloud) and `member_skills` (max 12 per member, order).
- New `member_projects` (title ar/en, description ≤ 500, https link, optional cover in the member's photo folder, max 6, order).
- `member_directory` exposes each new field only when its flag is on and the member is listed; it adds `skill_slugs` for filtering; it never exposes e-mail or phone.
- `profiles.full_name_*` stays in sync from the member names (one trigger), so dashboard search and e-mails use the full name.
- pgTAP: every flag off hides its column; an unlisted member is invisible; a member edits only their own skills and projects; limits enforced.

**MEM-012 — Photo upload**
- Bucket `member-photos` (public read, 2 MB, `image/jpeg`, `image/png`, `image/webp`). A member writes only `member-photos/<auth.uid()>/…`; leaders with `members.manage` may replace a photo (audited).
- The client crops to a square and resizes to 512 px (and a 128 px thumbnail) before upload; the server re-checks type and size.
- Uploading sets `photo_path`; the first upload asks the member whether to show the photo publicly (`show_photo`). Removing the photo deletes the object.
- The same photo is the account avatar in the dashboard header and account menu.

**MEM-013 — Profile editor**
- Sections: photo, names (first, middle, last × ar/en), headline, about, skills (searchable picker from `skills`), projects, links, open to, academic info, visibility. Each section saves on its own with the toast pattern.
- A completeness meter (photo, headline, about, ≥ 3 skills, one link) with the next suggested step; the live preview shows the public card and the profile header exactly as visitors will see them.
- Arabic and English inputs side by side on desktop, stacked on phone; validation messages from the server.

**MEM-014 — Add-member wizard** (replaces `AddMemberDialog`)
- Step 1 Identity: first, middle and last name in Arabic (first and last required) and in English (first and last required), e-mail, optional phone (international field). Duplicate e-mail is caught at this step.
- Step 2 Academic: status, university, major, sub-major, track.
- Step 3 Committee and position (optional): committee, role limited to what the actor may grant (committee member, deputy, head), start date; the head guard and the handover offer as in "Assign position".
- Step 4 Review, then **one** RPC that creates the account invitation, the member and the role assignment in a single transaction; any failure leaves nothing behind. The activation e-mail goes out once.
- Uses the existing `Stepper`, the 1.5 s feedback floor and `ResultDialog`.

**MEM-015 — Dashboard members**
- List columns: photo, full name (in the current language), committee and position, status, profile completeness, joined date; e-mail and phone only for viewers with `members.view_contact` (new permission key if needed, from the database, ADR-004).
- Filters (committee, status, track, completeness) and search by any name part or e-mail; paging.
- Member detail page `/dashboard/members/[id]`: every field, role history, registrations and attendance, applications, audit trail; edit with `members.manage` (audited); "send profile reminder" e-mail.

**ACC-007 — Assign position**
- Reproduce the search failure on the develop site and record the cause in the sprint notes before fixing.
- Search by any name part (ar or en) and e-mail, shows the name in the current language, includes members whose account isn't activated (marked), and on a committee page lists that committee's members first.
- Combobox follows the ARIA pattern: arrow keys, Enter, Esc; loading, "no results" and error states are visible; actors who can't search see why.
- The same picker is reused by the wizard (MEM-014).

**RDS-033 / RDS-034 / RDS-035 — Public members** (follow the approved step 0 designs)
- Directory: search, filters by skill, committee and track in the URL; cards show photo, name, headline and up to 3 skills; leadership kept; all states.
- Profile: header (photo, name, headline, committee and role, open-to badges, links), about, skills grouped by category, projects, committees and positions, articles, opt-in participation; 404 for unlisted; `ProfilePage` structured data (JSON-LD) only with public fields; Open Graph image from the photo.
- Home marquee: listed members with a public photo (fallback: initials card), two rows in opposite directions, pause on hover and focus, pause button, static grid under reduced motion, hidden with fewer than 6 members; each card links to the profile.
- No e-mail or phone in any public HTML (test). The privacy rules of RDS-020 still apply to every new field.

**MOT-001 — Motion foundation**

*Decision: use a real motion library, not CSS alone.* Add the `motion` package (the successor to Framer Motion; React 19 compatible, current release 14.x). Keep it for what CSS can't do well, and keep CSS for the rest so most pages ship no extra JavaScript.

| Need | Tool | Why |
| ---- | ---- | --- |
| Scroll reveals, list stagger, card hover lift, count-up, simple page-enter on server-rendered sections | CSS in `src/styles/motion.css` (renamed from `page-motion.css`), scroll-driven with `animation-timeline: view()` where supported | No JavaScript, works in Server Components, final state everywhere else |
| Home members marquee: drag, momentum, pause on hover/focus, speed that eases down on hover | `motion` (`useAnimationFrame`, `useMotionValue`, drag) in one client island | CSS marquees can't be dragged or eased |
| Add-member wizard: step slides that follow reading direction, animated progress | `motion` (`AnimatePresence`, shared `layoutId` for the stepper marker) | Needs exit animations and layout animation |
| Dialogs, bottom sheets, toasts, the filters sheet | `motion` (spring, `AnimatePresence`, drag-to-dismiss on the sheet) | Exit animation and gestures |
| Directory filtering and sorting (cards re-flow smoothly), skills picker chip add/remove, project reordering in the editor | `motion` (`layout`, `Reorder`) | Layout animation is its strength |
| Route changes and card → profile "morph" (the member photo and name travel to the profile header) | React `<ViewTransition>` (Next App Router guide: `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`) | Built into this Next version, no config; browsers without support simply don't animate |

Rules for the library:
- Import from `motion/react-m` with `LazyMotion` and the `domAnimation` feature set, and use `m.*` components only inside small client islands (`'use client'`); no `motion` import in Server Components or in layouts. Target: under 15 KB gzipped added to a page that uses it, and zero on pages that don't. A bundle check goes into the perf spec.
- One `MotionProvider` (client) wraps the public layout with `MotionConfig reducedMotion="user"`, so every library animation honours the user's setting. Under reduced motion: no movement, no marquee drift (a static grid), opacity-only fades at most.
- Shared presets in `src/lib/motion.ts`: durations and easings read from the CSS tokens (`--duration-fast|base|slow`, the shared ease), plus named presets (`reveal`, `stagger`, `sheet`, `dialog`, `pageEnter`, `spring.soft`). Components import presets; nobody writes ad-hoc numbers.
- Direction aware: slides and drift use logical direction (RTL mirrors).
- Transform and opacity only; no layout shift (CLS stays under the perf budget); motion never hides content from screen readers, never blocks input, and never delays the first meaningful paint (content is in the HTML; animation enhances it).
- Evaluate, then decide, one extra library only if a design needs it (for example Lenis smooth scroll): default is no.
- Tests: unit tests for the presets and the reduced-motion branch (jsdom with `matchMedia` mocked); Playwright keeps `reducedMotion: 'reduce'` so baselines stay deterministic; one e2e with motion enabled checks that the marquee moves, pauses on focus, and that content is readable without waiting for animations.

**MOT-002 — Roll-out**
- Apply the vocabulary to Home (hero entrance, section reveals, members marquee), the event page, members, articles, committees and Join, following the step 0 motion spec. About and the Events list move to the shared classes with no visual change.
- Add the library-driven pieces: wizard step transitions, dialog and sheet springs, directory layout animation, the skills picker, and the card → profile `<ViewTransition>`.
- Every animation has its reduced-motion behaviour listed in `12-motion.md` and covered by a test or a manual check in the sprint report.

## Dependencies

| Dependency | Needed for | Status |
| ---------- | ---------- | ------ |
| Approved designs (step 0) | RDS-033…035, MEM-013, MEM-014 UI, MOT-002 | ⬜ |
| Owner approves adding the `motion` package (new dependency, ~15 KB on pages that use it) | MOT-001 | ⬜ |
| Owner answers Q-M5…Q-M9 | MEM-011 defaults, RDS-035 | ⬜ |
| Owner approval of new visual baselines (separate `chore(visual)` change) | Merging the redesigned pages | ⬜ |
| The pending `/about` and `/events` baselines (action board item 1) | A clean visual gate before this sprint's baselines | ⬜ |

## Open questions

| ID | Question | Default if unanswered |
| -- | -------- | --------------------- |
| Q-M5 | Defaults of the new visibility flags for already-listed members | All new blocks off until the member turns them on |
| Q-M6 | Skills: curated list only, or members may suggest new ones? | Curated list; a "suggest a skill" request goes to the admins |
| Q-M7 | Show "open to work / internship" publicly? | Yes, opt-in per member |
| Q-M8 | May leaders edit a member's public profile, or only the member? | Only the member edits public blocks; leaders edit names and academic data (audited) |
| Q-M9 | Who appears in the Home marquee? | Listed members with a public photo, random order per day |

## Definition of Done (sprint-specific)

- `npm run check` and `npm run e2e` pass; new pgTAP tests pass; generated DB types committed.
- Every new screen verified in AR/EN × dark/light × 360 px and desktop; axe has no new violations; keyboard-only run of the wizard and the profile editor.
- Privacy test: with every flag off, a listed member's profile shows only the name.
- Docs: `04-members.md`, `12-motion.md`, the members module doc and the backlog updated in the same pull requests.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| Scope is large for one sprint | Data, wizard and search first; the motion roll-out and marquee may move to Sprint 18 |
| Photos of real people (privacy, NFR-PRIV) | Opt-in, member-owned folder, deletion on removal, no photo in e-mails |
| Motion hurts performance, bundle size or accessibility | CSS first, `motion` only in small lazy client islands with a bundle check, `MotionConfig reducedMotion="user"`, transform and opacity only, perf budget in e2e |
| Baseline churn on several pages | One `chore(visual)` change per page group, after owner review |
