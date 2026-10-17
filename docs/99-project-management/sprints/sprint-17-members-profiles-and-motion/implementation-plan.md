# Sprint 17 — Implementation plan (approved 2026-10-17)

Companion to [plan.md](./plan.md). The designs are in [designs/](./designs/README.md). Branch: `feat/sprint-17-members-and-motion`. Progress and decisions are logged in [notes.md](./notes.md).

Rules for this sprint: semantic tokens only (no new hex); both themes; Arabic first and RTL with logical properties; typed bilingual copy modules (the repo does not use `messages/*.json` for UI text); `Link` and `useRouter` from `@/i18n/navigation`; permissions from database keys (ADR-004); no e-mail or phone in any public HTML; sample content in the designs is invented and never ships; commit after each story and run `npm run check`; no `e2e:update` without approval; never push; no Co-Authored-By.

## Order of work

| # | Story | Main work |
| - | ----- | --------- |
| 0 | Setup | Designs and this plan in the sprint folder; local Supabase and web running |
| 1 | MEM-011 | Migrations 1–3 (below), pgTAP, regenerated DB types, `completeness.ts`, schemas |
| 2 | MEM-012 | `member-photos` bucket and policies, `ImageCropper`, upload action, consent step |
| 3 | MOT-001 | `motion` package, `MotionProvider`, `src/lib/motion.ts`, `motion.css` (renamed from `page-motion.css`), About and Events moved onto the shared classes, bundle check |
| 4 | ACC-007 | Reproduce the search failure locally, write the cause in the notes, fix; `Combobox`, `search_assignable_users` RPC |
| 5 | MEM-014, MEM-015 | Wizard, `create_member` v2, admin list and detail RPCs, dashboard list and detail, key `members.view_contact` |
| 6 | MEM-013 | Editor in the design's sections, `SkillPicker`, projects editor, completeness meter, live preview |
| 7 | RDS-033/034/035, MOT-002 | Directory, profile, Home marquee, motion roll-out, `PageTransition` |

## Migrations (expand only)

1. `member_profile_v3`: `middle_name_ar/en`, `headline_ar/en`, `about_ar/en` (backfilled from `bio_*`, limit 2000), `open_to`, `website_url`, `behance_url`, `dribbble_url`, `youtube_url`, private `phone`; flags `show_headline`, `show_about`, `show_skills`, `show_projects`, `show_open_to`; tables `skills`, `member_skills`, `member_projects`; trigger that keeps `profiles.full_name_*` in step with the member names.
2. `member_directory_v3`: rebuilt `member_directory` (each field gated by its flag, `skill_slugs`, committee and role), `member_public_participation`, `current_positions` gains the consented photo and member id.
3. `member_profile_rpc`: `update_my_member_profile` v3, `set_my_skills`, project add, edit, delete and reorder.
4. `member_photos` and `member_admin` (later stories): bucket and policies, `members.view_contact`, `admin_list_members`, `admin_member_detail`, `search_assignable_users`, `create_member` v2.

## Where the designs and the data model disagree (decisions taken)

| # | Mismatch | Decision |
| - | -------- | -------- |
| 1 | Design has headline and about; the data has `bio_*` (1000) | Migrate `bio_*` into `about_*` (2000), keep `bio_*` for one release, the view reads `about_*` |
| 2 | Today's view always exposes bio, major and academic status | Gate bio by `show_about`, major and status by `show_university` |
| 3 | Q-M5: new blocks OFF, but listed members with a bio would lose it | `show_about = true` only for members already listed with a bio; everything new starts off |
| 4 | Design has no links toggle; column `show_links` exists | A saved link counts as consent; keep the column |
| 5 | Leadership cards need a photo; `current_positions` has none | Photo only if the person is listed and `show_photo` is on |
| 6 | Completeness must be one function but lists need SQL filtering | TS `completeness.ts` plus a SQL mirror, tested against the same fixtures in vitest and pgTAP |
| 7 | No member phone; last sign-in is not readable by the browser | Private `members.phone` (never in a public view); last sign-in through a permission-checked RPC |
| 8 | "Atomic" wizard, but the account lives in Supabase Auth | Create account, run one RPC, delete the new account on failure, send the e-mail last |
| 9 | "Participated" role has no data | Presenter and attended only, from event presenters and attendance |
| 10 | `listDirectory()` loads every member per request | Move filters, skills and paging into the query |
| 11 | Header and footer are mounted per page | `PageTransition` wrapper on each page's `<main>`, header and footer named `view-transition-name: header` and `footer` |
| 12 | No `ds-*` classes; `messages/*.json` holds only `meta` | Use Tailwind semantic classes, `t-*` utilities and typed copy modules |

## New primitives

`Combobox`, `ImageCropper` (canvas, no new dependency), `SkillPicker` (uses `Reorder`), a segmented completeness meter, `MotionProvider`, the marquee island. Reused: Stepper, ResultDialog, Dialog (sheet mode), Avatar, Switch, Tabs, StatusPill, EmptyState, Progress, Chips, TagChip.

## Open questions and defaults in use

Q-M4 committee and role shown for listed members with no separate toggle. Q-M5 as decision 3 above. Q-M6 curated skills, suggestions go to admins. Q-M7 "open to" is public and opt-in. Q-M8 only the member edits public blocks; leaders edit names and academic data (audited). Q-M9 listed members with a public photo first, daily shuffle, hidden under 6. Profile-reminder e-mail: the button stays hidden until the owner approves a new e-mail type (only acceptance e-mails are sent today). Photos: public bucket with random file names; `show_photo` gates exposure.
