# Design Brief — SDC Internal Dashboard (ready to paste)

> **How to use:** give a designer (or Claude Design) the SDC repository, the folder `docs/10-design-system/` (tokens and components) and **this folder**, then paste the brief below. It asks only for the internal screens — public pages stay as they are.

---

## Paste this

```markdown
Role: Senior product designer for the Saudi Developer Community (SDC) — a non-profit,
Arabic-first developer community. Design the INTERNAL DASHBOARD only.

SOURCES (attached):
- docs/10-design-system/README.md and foundations/* — the ONLY source of colors, type,
  spacing, radii, elevation, motion. components.md (Part 2) and patterns.md (§6–§8).
- docs/10-design-system/INTERNAL-SCREENS/ — ASCII blueprints + layout rules + states for
  every screen. 00-data-model-reference.md defines fields, badge palettes and allowed actions.
- The current public site (app/, src/components) — match its look: dark green-on-black
  identity, capsule buttons, softly rounded cards with thin green-tinted borders.

NON-NEGOTIABLE RULES:
1. Dark theme is the default (canvas #050D09, surface #0D0E12, signal accent #00E676);
   every screen also ships a light variant (canvas #F4FAF6, surface #FFFFFF, text #123B35,
   accent text #0B8F55 — use a darker green for small text to meet WCAG AA).
2. Arabic RTL first; every screen mirrors to English LTR using logical properties.
   Sidebar sits at the inline-start (right in Arabic). Emails/URLs/ids stay LTR.
3. Type: IBM Plex Sans Arabic (Arabic) + Rubik (Latin); tabular numbers for counts/dates.
4. Buttons and badges are capsules; cards radius 20px; inputs 12px; dialogs 16px.
5. Icons: lucide (stroke 1.75). No emoji in the UI (blueprints use emoji as shorthand).
6. Neon green only for emphasis/active/primary — never large surfaces or body text.
7. Status = badge with TEXT + tone (neutral/accent/success/warning/danger/info).
8. Loading = structured skeletons matching final layout (shimmer 1.4s); no page spinners.
9. Permission-driven UI: actions the user can never use are absent; actions blocked by
   state are disabled WITH a visible reason. Show the same screen in "view only" mode for
   founders/advisor (no action bars + a "عرض فقط" badge).

SCOPE (build exactly these):
01 Shell — L-frame: 272px sidebar (brand block, grouped nav with group labels, collapsible
   parents, 4px active indicator bar at inline-start, count badges, committee switcher,
   "Public site" link at the bottom), 72px sticky private header (accent bar + page title +
   scope/position line; language, theme, review-queue bell, user menu), content max 1280.
   Tablet: 72px icon rail. Mobile: drawer.
02 Sidebar variants for: plain user, committee member, committee head, community leader,
   founder, system admin (see 02-sidebar-navigation.md §2).
03 403 and 404 views inside the shell.
04 Skeleton set: list page, detail page, overview, form/drawer, reports.
10 Dashboard overview — leader, committee head, plain user variants.
11 Account — My registrations, My membership (3 states), My profile.
12 Events list · 13 Event creation wizard (4 steps like KFUCS: Identity · Logistics · Content · Review, live preview card) · 16 Attendance sessions (QR, finalize) · 14 Event detail with lifecycle
   timeline, approve / request changes / cancel dialogs · 15 Registrations review with
   summary tiles, capacity meter, bulk bar, registrant drawer, email status · 16 Attendance.
17 Intake cycles (hero card + table + drawer with question builder) · 18 Applications
   review (table + reading drawer with prev/next + bulk decisions).
19 Members list + member detail + status dialog + legacy claim block.
20 Committees cards + committee detail (positions with terms) + assign/end-term drawers.
21 Articles list + bilingual Markdown editor + review view.
22 Reports — community and committee (tiles with deltas, bar/line chart, funnel, table).
23 Users + Roles & positions + assign drawer with permission preview.
24 Audit log, Email log (quota meter), Reference data, Site settings.
25 /join — new public page in the EXISTING public style: closed, scheduled, open
   (signed out), 5-step application stepper, applied/decision states.

For each screen deliver: dark RTL (primary), light RTL, dark LTR, mobile RTL, loading
skeleton, empty state, and the key dialog/drawer.
```
