# Sprint 18 — Implementation log

> Written while the work happens (unattended run). Branch: `feat/sprint-18-membership-lifecycle`. Nothing is pushed.
> Legend: ⬜ todo · 🔶 in progress · ✅ done · ✔️ verified (tests or screenshots)

## Summary

**Built:** the whole membership lifecycle on a new database layer (14 migrations from `20270411000000` to `…1300`, pgTAP files 27–32 (36 files and 1932 assertions in the last full clean run) plus updated 03/08/19/21/25),
server actions, 18 AR/EN e-mail templates with an undo outbox and a daily idempotent job (`/api/cron/membership-daily`),
the public journey (join states, 5-step form with draft, tracking page, activation, verification page, blocked notice),
the dashboard (cycles with rubric and funnel, applications with bulk actions, review with scoring and shortcuts, waiting list,
members with term/suspend/end/renew/block, leave requests, member timeline with notes), the member area (my membership with
card and QR, full-screen/print card, renewal and leave requests, welcome tour, status notices) and the navigation group
"العضوية" with live counts. After the sprint: tables become labelled cards on phones (one shared pattern), skeletons for the
new routes and the account area, and the new screens use the existing motion classes (`m-enter`, `m-pop`, `m-reveal`).

**Verified:** `npm run check` (format, lint, tsc, tokens, contrast, 600+ unit tests) green; `npx supabase test db` green;
browser pass on the real pages (applications, my membership, card, verification, 17 routes without server errors,
no horizontal scroll at 375 px on every measured dashboard/account route).

**The owner must decide / know:**
1. Playwright baselines of the public pages were already out of date before this sprint (the `about` baseline shows the old
   page). 100 visual tests fail for that reason; `e2e:update` was NOT run. Re-baseline from a freshly seeded database when
   you approve (see the e2e documentation).
2. `temp.txt` in the project root holds keys for a hosted Supabase project; it is untracked and now excluded locally
   (`.git/info/exclude`). Consider deleting it and rotating those keys.
3. Open questions Q-L1…Q-L10 below were answered with the listed defaults.
4. Not done: new Playwright journeys and baselines, a systematic comparison of every board at 1440/390/360 in light and dark, and a full keyboard/AA pass. See "What is left or risky" and [NEXT-STEPS.md](./NEXT-STEPS.md).
5. After the first run the owner reviewed the screens and asked for the changes in "Round 2 and 3" below; the sprint is feature-complete but **not closed** (tests and the quality sweep are open).

## Implementation map

Existing code that is extended (not duplicated): `src/modules/membership` (accounts, actions, review-actions, queries,
schemas, messages, components), `src/modules/members` (admin-queries, actions, MemberActions), `src/modules/notifications`
(notify, membership, retry), `src/lib/email/templates.ts`, the cron routes under `app/api/cron`, `getAccess`/`getUser`
(`src/lib/auth`), `private.write_audit`, `private.has_permission`.

| Story | DB (migration / function) | Server | UI | Design boards |
| ----- | ------------------------- | ------ | -- | ------------- |
| MBR-007 applications v2 | `20270411…applications_v2`: name parts, `reference` (SDC-YY-NNNN), `tracking_token_hash`, `info_requested`/`lapsed`, `application_events`, token functions | zod schemas, `applyForMembership` v2, tracking actions | — | form, tracking |
| MBR-008 join form | `apply_for_membership` v2 (parts, reference, token) | schemas, draft autosave | `/join` states, 5-step form, result | join (4 states), form, result, phone boards |
| MBR-009 tracking | `track_application`, `resubmit_application_by_token`, `withdraw_application_by_token`, `request_tracking_link` | actions (rate limit) | `/join/status/[token]` | tracking (all states) |
| MBR-010 list | `membership_review_queue` v2 (score, reviewer) | queries with filters/sort | list, bulk bar, phone cards | list, phone |
| MBR-011 review | `request_application_info`, events | actions | review page, shortcuts, undo, next | review |
| MBR-012 rubric | `cycles.rubric`, `application_scores`, `save_application_score` | actions | rubric editor, scoring panel | cycle form, review |
| MBR-013 waitlist | `lapse`, `waitlist_candidates`, `system_accept_applications`, `restore_application` | cron job | waitlist & activation view | waitlist |
| MEM-016 term | `members.term_*`, `cycles.term_ends_at`, `run_membership_daily`, `renew_members`, reminders | cron route | cycles form, members list | members |
| MEM-017 states | states v2, `leave requests`, transition functions | actions | my membership, leave queue | my membership, members |
| MEM-018 bulk | `suspend/reinstate/end/renew_members`, `decide_leave_requests` | actions | members list, dialogs | members, dialogs |
| MEM-019 timeline | `member_events`, `admin_member_timeline` | queries | member detail | member timeline |
| MEM-020 card | `member_no`, `card_token`, `verify_member_card`, `rotate_card_token` | actions | card, full screen, verify, print | card boards |
| ACC-008 block | `profiles.blocked_*`, `users.block`, `block/unblock_accounts` | login handling, session check | notices, dialogs | notices, dialogs |
| ACC-009 activation | `activation_reminders`, onboarding columns/functions | cron, actions | activation, onboarding | activation, onboarding |
| NOT-004 e-mails | `email_outbox` (not-before) for undo | templates ×18 + digest | previews | e-mails board |

Build order followed: database (A) → server (B) → e-mails (C) → public UI (D) → dashboard UI (E) → navigation (F) → the
internal-system responsiveness/skeleton/motion pass requested at the end.

## Decisions taken on ambiguity

| # | Decision | Why |
| - | -------- | --- |
| D1 | Applicants stay accountless (existing owner decision). The tracking token is stored as a SHA-256 hash; when a "received" mail has to be re-sent the token is rotated (the old link was never delivered). | Hash at rest, no personal data in the URL, retry route still works. |
| D2 | `term_ends_at` is a `date` (Riyadh calendar day). A member expires the day after it. | The designs show dates, not times. |
| D3 | Suspension ends the member's committee positions (existing BR-MBR-011 behaviour); reinstating does not restore them. | Pausing positions would need changes in `has_permission`; logged as a deviation from lifecycle §4. |
| D4 | The undo of a decision works through an outbox with a not-before time (`email_outbox`); the status change is real, the e-mail waits 6 s, undo reverts the decision and cancels the outbox row. | Design tension 3. |
| D5 | The activation of an account is detected from `auth.users` (password set or first sign-in) by the daily job and at sign-in. | Accounts are created by the system, no event exists when a password is set. |

## Deviations from the design

_(filled as they happen)_

## Open questions and the default used

| ID | Default used |
| -- | ------------ |
| Q-L1 | term end = cycle's `term_ends_at`, otherwise 12 months from acceptance |
| Q-L2 | "Request renewal" notifies leadership; leadership renews |
| Q-L3 | no grace period: hidden on the day after expiry |
| Q-L4 | e-mail verified after acceptance only; the review step shows the address large with "not my e-mail" |
| Q-L5 | rejected applicants may apply again; the reviewer sees the earlier application |
| Q-L6 | suspended members keep certificates and past registrations |
| Q-L7 | no vice-leader role added — **closed by the owner (2026-10-24): no vice role, nothing to build** |
| Q-L8 | 7 days |
| Q-L9 | best score when the cycle has a rubric, otherwise order of submission; offered freed place is held for 24 hours before the next promotion (see tension 1) |
| Q-L10 | name, member number, status and term end |

## Checklist per story

| Story | Status | Notes |
| ----- | ------ | ----- |
| MBR-007 | ✔️ | migration + pgTAP 27 |
| MBR-008 | ✅ | 5-step form, draft in the browser, result with reference and calendar file |
| MBR-009 | ✅ | `/join/status/[token]`, edit asked parts, withdraw, resend activation |
| MBR-010 | ✅ | list, filters, bulk bar naming people, results dialog, phone cards |
| MBR-011 | ✅ | review page, score, decision, undo toast, shortcuts, info request |
| MBR-012 | ✅ | rubric editor, scoring (visible to reviewers only) |
| MBR-013 | ✔️ database / ✅ UI | daily job pgTAP 30; waiting list page with digest preview |
| MEM-016 | ✅ | term end, reminders 30/7/1 (subject text covered by unit tests), expiry job |
| MEM-017 | ✅ | states, leave requests (member asks, leadership decides, no self-decision) |
| MEM-018 | ✅ | bulk suspend/reinstate/end/renew with per-row results |
| MEM-019 | ✅ | timeline tab and internal notes |
| MEM-020 | ✅ | card with QR, full screen, print, rotate code, public verification |
| ACC-008 | ✅ | block/unblock, sign-in refusal, blocked notice, status dialog |
| ACC-009 | ✅ | welcome tour, first-sign-in activation sync, redirect to the tour |
| NOT-004 | ✔️ | 18 templates + digest, AR/EN, plain rejection/declined/lapsed/blocked; 54 unit tests |
| Internal responsiveness / skeletons / cards / motion | ✅ | `ResponsiveTables`, skeleton cards, loading files, motion classes |

## Verification commands run

- `npx supabase db reset` — the 52 migrations apply from scratch (ok).
- `npx supabase test db` — 34 files, 1843+ assertions, PASS (new files 27–30: 43 + 44 + 79 + 44).
- `npm run check` — green (format, lint 0 errors, tsc, token and contrast checks, vitest all passing).
- `npm run e2e` — 259 passed, 100 failed, 129 skipped. Every failure is a screenshot or contrast check on pages this sprint
  did not restyle (baselines were stale before the sprint). No snapshot was updated.
- Browser: signed in as the local leader; applications, my membership (card + QR), verification page, 17 routes fetched
  without server errors; phone width 375 px: no page-level horizontal scroll on the dashboard and account routes measured.

## Deviations from the design

- Suspension ends committee positions (D3) rather than pausing them.
- Tables use one generic phone-card pattern (labels from the column headers) instead of a hand-made card list per table.

## Round 2 and 3 — owner review of the running screens (2026-10-22 → 24)

The first run (above) delivered every story. The owner then walked the screens with the demo data and asked for the
changes below; each is one or more commits on the same branch. The table in the plan ("Delivered beyond the plan",
X1–X16) is the readable list; the technical part is here.

| Area | What changed |
| ---- | ------------ |
| Database | Migrations `20270411000900` staff profile edit · `…1000` gender and study year (functions and review view patched) · `…1100` activation tokens (`issue_activation_token`, `resolve_activation_token`, service role only) · `…1200` info request from the waiting list · `…1300` finite auth ban (and the accounts blocked before) |
| pgTAP | 25 (72 assertions), new 31 gender and study year (19), new 32 activation tokens (15). Last full run on a clean reset: **36 files, 1932 assertions, passing** — before `…1200` and `…1300` |
| Server | `activationLinkFor` / `prepareActivationLinks` / `flushIfDue` (notifications), `releaseDecisionMails`, `requestActivationByEmail`, `saveOnboardingStep` only revalidates when finishing, privacy count in `getNavCounts` |
| Public UI | join form (gender, study year, radio cards), tracking page, `/activate/[token]`, activation form with strength bar, `/welcome` (five steps), `/card` full screen |
| Dashboard UI | applications (whole selection cell toggles), review page (confirm, result dialog, reviewer states), waiting list (confirm), member record (full edit wizard, assign position fixed to the member), audit and e-mail logs in words, sidebar privacy badge |
| Member UI | "عضويتي" (wide / compact / full-screen card, merged positions and data), account tabs reduced |
| Brand | `sdc-mark.svg` everywhere; the old PNGs removed |
| Tests touched | unit test for the event card (SVG path); two Playwright specs now open the merged page (**not run**) |

Lessons worth keeping: the global `img, video {max-width:100%; height:auto}` rule beats Tailwind height classes, so
media sized with classes needs a wrapper or inline style; the auth service cannot read `banned_until = infinity`;
only one `next dev` may write `.next/dev` (two servers corrupted the manifest).

## What is left or risky

The full, prioritised list with the Sprint 19 plan is in [NEXT-STEPS.md](./NEXT-STEPS.md). In short:

- **Tests**: no new Playwright journeys (applicant, reviewer, leadership, member, notices) and no lifecycle end-to-end
  test; no pgTAP for migrations `…1200` and `…1300`; 100 visual tests fail because the baselines were already stale.
- **Quality sweep**: no systematic AR/EN × dark/light × 360 px comparison, no axe run and no keyboard-only run on the new screens.
- **Open owner decisions**: the password policy (design says 10 characters and no common passwords; recommendation: keep today's rule) and deleting `temp.txt` and rotating its keys. Q-L7 is closed: no vice-leader role.
- **Clean-up**: `WelcomeTour.tsx` is unused; `sdc-mark.svg` is a 1.1 MB image wrapped in an SVG (a true vector would be lighter);
  `ResponsiveTables` labels cells after hydration; the seeds are local-only.
- **Release**: the branch has 165 commits and has never been pushed or merged (owner rule); merging needs the baseline
  approval and a hosted check of the e-mail transport and `SITE_URL`.

## Decision change after Q-M8 (owner request)

Sprint 17 kept the public blocks of a profile with the member alone. The owner asked that leadership can edit the whole
member data. Migration `20270411000900_staff_profile_edit.sql` extends `admin_update_member` (headline, about, open to,
links) and adds `admin_set_member_skills`, `admin_member_projects`, `admin_save_member_project`,
`admin_delete_member_project`, all `members.manage` and audited. The visibility switches and the photo are still the
member's. UI: the four-step "Edit data" wizard on the member record. pgTAP 25 covers it (72 assertions).
