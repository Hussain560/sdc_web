# Claude Design Brief: SDC Design System and Public Website Redesign

> **How to use:** connect the SDC repository to Claude Design (or attach it), give it browser access to the three reference sites
> listed below, then paste the section under **"Paste this"** as one message. Claude Design reads the files under **Read first**
> and browses the references before it designs anything. Each output is a file in the repo, reviewed through a pull request.
>
> **Decision needed before using this brief:** decision D-009 freezes the visual identity for public pages. This brief is an explicit
> redesign request from the project owner. Record it as a new decision in `docs/90-decisions/` that supersedes D-009 for public pages.
> Keep the SDC palette and logo as the starting point. Until that decision exists, the brief is not approved.

---

## Paste this

```markdown
Role: Senior product designer and design-systems lead for the Saudi Developer Community (SDC), a non-profit,
Arabic-first developer community. Work in three parts, in order:

  PART 1. The design system: foundations, components, patterns, accessibility.
  PART 2. The public website redesign on that system, including the event page, the members section and the auth pages.
  PART 3. The implementation plan, so engineers can build it in small reviewed pull requests.

Do not start Part 2 until Part 1 is written and checked against the rules below.

## REFERENCE SITES: BROWSE THEM FIRST

Before designing anything, open these sites in a browser and study them. Look at the public pages, the mobile layout,
and how the sections, text and type behave. Use them for feel and structure, not as copies.

- https://tuwaiq.edu.sa/ (the academy: home, programs, news and events, about, the sign-in page)
- https://club.tuwaiq.edu.sa/ (the student club: home, events list and event pages, "why join" sections, clubs listing,
  FAQ accordion, the sign-in page). This is the closest reference for SDC.
- https://satr.tuwaiq.edu.sa/ (the learning platform: the sign-in page, the hero, the stats and the course cards)

For each site, write down in your output:
1. The section order of the home page, and what each section is for.
2. Type: the sizes of the hero title, section titles, lede and body text, and the weights. Note how the Arabic and the
   Latin text are paired. Note line-height and the measure (line length).
3. Spacing: the rhythm between sections, the card padding, the page gutters.
4. Shape and surface: corner radii, borders, shadows, background bands, how cards and buttons look.
5. Motion: what moves and when. Note any section reveal, hover or counter animation.
6. The sign-in page: layout, whether it has the site header and footer, how the form is built.
7. The event page: how the facts, the description and the action are arranged, and how the registration step looks.
8. What works well and what you would not copy.

Do not copy logos, photographs, illustrations, names or copy from these sites. Their brand belongs to their owners.
Create SDC's own visual language inspired by these patterns.

## READ FIRST (in this order)

1. docs/README.md and docs/10-design-system/README.md
2. docs/10-design-system/foundations/*: colors, typography, layout-and-shape, rtl-and-i18n, theming
3. docs/10-design-system/components.md, patterns.md, accessibility.md
4. docs/10-design-system/PUBLIC-SCREENS/* (the current public pages, their states and content rules)
5. docs/10-design-system/INTERNAL-SCREENS/80-user-flows.md (flows only; do not redesign the dashboard)
6. docs/03-business-domain/ and docs/00-product/ (members, community purpose, events model)
7. docs/90-decisions/: D-009 (superseded for public pages by the new decision), ADR-010 (locale in URL),
   ADR-013 (accounts for members only; there is no public self sign-up)
8. src/styles/primitives.css (every brand colour is here as --c-*), src/styles/tokens.css (semantic tokens used by the code),
   src/styles/ui.css, src/styles/a11y.css
9. src/components/ui/* (existing primitives) and the current public components:
   Header, Footer, HeroSection, ArticlesSection, MembersSection, CommunitySections, src/modules/events/components/public/*,
   src/modules/registrations/components/GuestRegisterDialog.tsx (the registration dialog, its validation and anti-spam)
10. public/assets/ (existing logos and art). Use the existing logo files and do not redraw them.

## BRAND (keep these)

- Palette: the deep green canvas (#050D09), the signal green accent (#00E676), a green-tinted surface, and the light theme with
  a mint canvas (#F4FAF6) and dark green text (#123B35). Start from these values; you may refine tints and steps, but the result
  must stay recognisably SDC.
- Type: IBM Plex Sans Arabic for Arabic and Rubik for Latin (both already loaded). Do not add a third family.
- Logo: the existing SDC mark and wordmark, with clear space. No recolouring outside the approved variants.
- Dark theme first. The light theme is complete, not an afterthought.

## PART 1: DESIGN SYSTEM (deliverables)

Write into docs/10-design-system/ (new files, or updates to the existing ones):

A. **Foundations**: colour roles (canvas, surface, raised surface, border, text, muted text, accent, accent text, success,
   warning, danger, info) with light and dark values; type scale for both scripts; spacing (4px base); radius; elevation;
   motion (durations, easing, reduced motion); iconography (lucide, stroke 1.75); focus ring.
   Every colour is a semantic token mapped to a primitive. No raw hex outside primitives.css.
B. **Layout**: the grid per breakpoint (phone 360 to desktop 1440+), container widths, section rhythm, gutters
   (16px on phones), and the rule that content never scrolls sideways.
C. **RTL and i18n**: logical properties only. Arabic is the reference layout; English mirrors it. Numbers, dates, e-mails and
   URLs keep their own direction. Every component must still work with 30% longer English text.
D. **Components**: anatomy, variants, states (default, hover, focus-visible, active, disabled, loading, error, empty, success),
   sizes, and Arabic and English examples. Cover at least: button (primary, secondary, ghost, icon, destructive), link, badge,
   status pill, tag chip, card variants, avatar, input, textarea, select, checkbox, radio, switch, form field with hint and error,
   dialog, bottom sheet, toast, tabs, accordion, breadcrumb, pagination, stepper, empty state, skeleton, image with fallback,
   logo, navigation bar (desktop and mobile), footer, language and theme switch, date and time chip, QR card, certificate card.
E. **Patterns**: hero, section header, card grid, filterable list, detail page with side facts, timeline, call-to-action band,
   stats row, quote, partner strip, directory, form layout, confirmation and feedback.
F. **Accessibility**: WCAG 2.2 AA on every token pair (give the contrast ratio per text colour per surface, both themes); keyboard
   order; visible focus; 44px touch targets; reduced motion; alt text rules; language attributes.
G. **Token mapping**: a table from each semantic token to its primitive, so engineers can update tokens.css and primitives.css
   without guessing.

## PART 2: PUBLIC WEBSITE REDESIGN

Redesign the public site on the system above, using the reference sites as inspiration for structure, type and feel.

### Scope
Every existing public route is in scope: the home page, about, the events list, the event page, articles and article pages,
members and member profiles, committees, join, the sign-in and password pages, the certificate verification page, privacy,
and the not-found page.

Design the home page, the event page and the members section as the three flagship experiences. Propose any additional sections
or pages you think the community needs. Explain each proposal in one or two sentences. Do not limit yourself to a fixed list.

### Home page
Use the club and academy sites as the reference for rhythm and drama: a large, confident hero with a strong headline and one
primary action; a row of key figures; a "why join" section with a few clear benefits; events and news; a strip of partners;
a call to action; a short FAQ. Make the sections feel like one story. Use the figures, partners and any testimonials only from
real data or clearly marked placeholders.

### Event page (whole redesign, the most important page)
- A hero that leads with the title, the date and time, the location or "online", seats left, and one primary action.
- Registration is a single button that opens a dialog. The dialog must follow this flow:
  1. The person fills in the fields and presses "Register".
  2. The button and the dialog switch to a loading state immediately. Show a visible progress state that lasts at least
     1.5 seconds even when the server answers faster. This is deliberate: it gives the person feedback and slows down scripted
     repeat submissions. Keep the form locked during this time.
  3. When the server answers, show a result dialog in the same style as the KFUCS registration feedback: a clear icon, a title that
     says what happened (registered, on the waiting list, already registered, event full, too many attempts, or try again),
     one sentence of explanation, and one next action (for example "Done" or "Add to my calendar").
  4. Refusals (duplicate, too fast, throttled) show the matching result, not a generic error.
- Show every event state: upcoming with registration open, registration closes soon, full with waiting list, registered
  (show the confirmation), cancelled, finished, running with check-in.
- Sections: about the event, agenda (multi-day events show one card per day with its own time and place), speakers if any,
  goals and audience, location and map link, what to bring, FAQ, related events.
- A side panel on desktop with the key facts. On phones it becomes a sticky bottom action bar.
- The certificate rule is stated in plain words, with the attendance threshold from site settings.

### Members section (whole redesign)
- Directory: search, filters by committee and track, a card grid with avatar, name, track and role.
- Member profile: photo, bio, track and university (only when the member made it public), committees and roles,
  the articles and events the member took part in.
- Privacy comes first: a member who is not listed is never shown, and no contact detail is shown unless the member chose it.
- Designed loading, empty and no-results states.

### Auth pages: a separate layout without the header and footer
Sign-in, forgot password, reset password and profile claim use their own route layout, with no site header and no footer.
The layout is a focused, two-part screen like the sign-in page of the academy site: the form on one side and a brand panel
(image or pattern) on the other. On a phone the brand panel collapses to a header strip.
- There is no public self sign-up (ADR-013). Where the academy site shows "create account", SDC shows a clear path to
  apply for membership (`/join`) instead. Design that link.
- The form has labelled fields, a visible password toggle, a "remember me" option, and one primary action.
- Errors are specific and plain. Success states are clear.

### Other pages
About, articles (list and reading page), committees, certificate verification (public, printable, trustworthy), join
(the membership process and the intake windows, then the application), privacy and not-found: design each one with the same
system. Keep text short and useful.

### Suggested additions (propose, do not limit yourself)
Propose additional sections or pages if they help the community. Examples to consider: a membership journey, a
"how we work" or governance section, a highlights or gallery page, a press and brand kit, committee pages with their lead
and events, a FAQ page, a partner tier page. Mark each proposal as essential for launch or later.

## MEDIA AND IMAGES

Claude Design must not invent photographs, logos or testimonials. Where the design needs an image, illustration, photo or
video, list each one in the output with: its purpose, the page and section, the size and crop, the mood, and whether it is
essential for launch or a placeholder. The owner will supply the media, so keep the list complete and specific.

## CONTENT RULES

- Every string exists in Arabic and English. Arabic is in Modern Standard Arabic with a warm, plain tone.
- No invented statistics, names, testimonials, dates or partners. Use labelled placeholders and list them in the output.
- Plain verbs, sentence case in English, no all-caps labels, no decorative eyebrow labels above every heading.

## PART 3: IMPLEMENTATION PLAN (deliverables)

- A sprint plan in docs/99-project-management/sprints/ (same format as the existing plans): stories, acceptance criteria, and small
  pull requests in this order: tokens, components, the auth layout, the home page, the event page and its registration dialog,
  the members section, the remaining pages.
- For each page: the components used, the data it reads (which query or content source), every state, and the tests to add
  (unit tests for logic, Playwright for flows and visual snapshots).
- The registration dialog's timing and feedback must be tested: the loading state lasts at least 1.5 seconds, and each result
  shows the right dialog.
- Visual regression baselines will change. Do not update them without the owner's approval.

## HARD RULES

1. Semantic tokens in the implementation. No new hex outside primitives.css.
2. Arabic-first and RTL-correct: logical CSS properties; test both directions.
3. Both themes and both languages for every page and component.
4. WCAG 2.2 AA: contrast, focus, keyboard, labels, target sizes, reduced motion.
5. Extend the existing primitives in src/components/ui; do not duplicate them.
6. Routing with `Link` and `useRouter` from `@/i18n/navigation`. English URLs live under `/en`.
7. Permissions come from the database, never from hard-coded role lists. Public pages show only published content.
8. Privacy: nothing personal is shown without a consent flag; the directory respects visibility.
9. Do not copy the reference sites' logos, images, names or copy.
10. Ask the owner where a choice is theirs (brand changes, new content, legal wording), instead of deciding it.

## WHAT TO RETURN

1. A short summary: the design direction in five sentences, and the files you created or changed.
2. A "reference notes" file: what you learned from the three sites (section order, type sizes, spacing, feel, the sign-in and
   event page patterns), and what SDC will take from each.
3. The design system files (Part 1).
4. The page specifications (Part 2), one file per page or group, each with an ASCII wireframe, the state list, and the
   registration dialog flow for the event page.
5. The media list (every image, illustration, photo and video needed, with purpose, size and priority).
6. The implementation sprint plan (Part 3).
7. Your suggested additions, and a list of open questions for the owner.
```

---

## Notes for the owner (not part of the prompt)

- Give Claude Design access to the three reference sites. It should browse them in the browser, not only read this text.
- The sign-up question: the academy site has a "create account" link. SDC has no public self sign-up (ADR-013), so the brief sends
  visitors to `/join`. If you want a public account option later, it is a separate decision.
- The registration dialog's 1.5-second minimum is a deliberate design choice that also slows down spam. The server-side checks
  (honeypot, time limit, e-mail and IP throttles) stay in place.
- Outputs land in `docs/10-design-system/` and `docs/99-project-management/sprints/`. Review them as you would a code pull request.
