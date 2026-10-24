# Sprint 18 — Where we stand and what is next

> Written 2026-10-24, after the owner's review rounds. Read with the [plan](./plan.md) and the
> [implementation log](./IMPLEMENTATION-LOG.md).

## 1. Is the membership lifecycle complete?

**Feature-complete: yes. Closed and perfect: not yet.**

Every story of the sprint (MBR-007…013, MEM-016…020, ACC-008, ACC-009, NOT-004) is built, and so is a long list of
changes the owner asked for after seeing the screens (plan → "Delivered beyond the plan"). A person can apply, be
reviewed and decided with confirmation and undo, receive an e-mail within seconds, activate with a 7-day link, set up
their profile in five steps, hold a digital card, be renewed, suspended, ended or blocked, and every one of those moments
leaves an audit trail, an e-mail (once) and a notice the person understands.

What stops us from calling it closed is **proof and polish**, not missing features:

| Gap | Why it matters | Size |
| --- | -------------- | ---- |
| No automated browser journey of the lifecycle | The whole walk is only checked by hand and by database tests | M |
| `npm run e2e` is red (100 visual tests) | The baselines were stale before the sprint; we cannot tell a real regression from old noise | M |
| No accessibility / keyboard sweep of the new screens | The sprint's own Definition of Done asks for it | M |
| No database test for the two late migrations | `…1200` (info request from the waiting list) and `…1300` (finite ban) were checked by hand only | S |
| Two edited Playwright specs were never run | `my-data` and `privacy` now open the merged "عضويتي" page | S |

## 2. Test and quality status (honest)

| Check | Last result | Note |
| ----- | ----------- | ---- |
| `npm run check` (format, lint, types, tokens, contrast, unit tests) | green | type-check and lint were run after every change in the review rounds; the full `check` was last run as a whole before them |
| `npx supabase test db` | 36 files, 1932 assertions, green on a clean reset | seeds left in the DB make tests 05 and 26 fail: always test on a clean reset |
| `npm run e2e` | 259 passed, 100 failed, 129 skipped | every failure is a screenshot or contrast check on pages the sprint did not restyle; **`e2e:update` was never run** (owner rule) |
| New Playwright journeys | none written | see the plan below |
| Browser pass | done by hand on the screens changed in each round | mostly dark theme, desktop and 375 px; not a systematic AR/EN × dark/light × 360 px sweep |
| Accessibility (axe, keyboard-only) | not run on the new screens | |

## 3. What remains — by priority

### Must do before we merge (P0)

1. **Re-baseline the visual tests** from a freshly seeded database (separate `chore(visual)` change, needs the owner's
   approval; never `e2e:update` without it). Until then `npm run e2e` cannot be a gate.
2. **Write the lifecycle end-to-end test**: apply → info requested → resubmit → accept (confirm) → activation link →
   password → five-step set-up → card → expire (moved clock) → renew → suspend → notice → reinstate → leave request →
   end; plus a blocked sign-in. Use the seeds and Mailpit.
3. **pgTAP for the late migrations**: an info request from the waiting list; blocking sets a finite ban and sign-in is
   refused with the blocked notice (the service answers "user banned"); unblocking clears it.
4. **Run the two edited specs** (`tests/auth/my-data.spec.ts`, `tests/auth/privacy.spec.ts`) and the whole auth suite once.
5. **Run `npm run check` as a whole** and fix anything the review rounds left (unused imports, the unused `WelcomeTour.tsx`).

### Should do (P1)

6. **Accessibility pass** on the new screens: axe on `/join`, `/join/status`, `/activate`, `/welcome`, `/account/membership`,
   `/card`, the applications list, the review page and the members record; one keyboard-only run of the join form and the
   review page; check the new dialogs (focus, Escape, labels).
7. **Systematic visual comparison** with the boards: 1440 / 390 / 360 px × AR/EN × light/dark, listed per screen.
8. **Owner decisions**: password policy (design: 10 characters, a letter and a number, not a common password; today: 8
   with four character classes, also set in the auth settings); whether the activation badge
   should show the cycle name and "valid until" like the design.
9. **The activation page's other states** from the design ("expired link", "new link sent" with a resend countdown):
   the expired page works and sends a new link, but it is not styled as the board.
10. **Hosted checks**: the e-mail transport (today Mailpit), `SITE_URL`, `CRON_SECRET` and the Vercel cron
    (`/api/cron/membership-daily` is already in `vercel.json`); the privacy policy page should name the new data (gender,
    study year) and the "my data" export already includes them (it reads the whole member row).
11. **Security hygiene**: delete `temp.txt` (keys for a hosted project) and rotate those keys.

### Nice to have (P2)

12. Replace `sdc-mark.svg` (a 1.1 MB PNG inside an SVG) with a real vector.
13. Options editor for question hints (`option_hints`) in the cycle form (today set by seed or SQL).
14. "How long ago" on the "another reviewer holds it" note and an "ask them to release it" action (the design shows both;
    we have no claim time in the page data and no notification path).
15. Remove the `ResponsiveTables` after-hydration labelling in favour of per-table cards where a table is important.
16. The ideas still on the list: two-reviewer rule for rejections, interview state, editable decision e-mail texts,
    re-apply cooldown, QR check-in at events, appeal link in the termination e-mail.

## 4. Proposed Sprint 19 — "Prove it and release it" (about 20 SP)

| Item | SP |
| ---- | -- |
| Re-baseline visuals (approved) and make `npm run e2e` a real gate again | 3 |
| Lifecycle end-to-end test and the per-role journeys (applicant, reviewer, leadership, member, notices) | 8 |
| pgTAP for `…1200` and `…1300`; run and fix the edited specs | 2 |
| Accessibility sweep and the systematic visual comparison, with fixes | 5 |
| Clean-up (unused tour, real vector logo, `temp.txt`) and the owner's decisions (password policy) | 2 |

Then merge `feat/sprint-18-membership-lifecycle` (165 commits; the owner decides when, nothing is pushed), run the
hosted checks of item 10 on the first deploy and watch the first daily job.

## 5. Where things are

| What | Where |
| ---- | ----- |
| Business process | [lifecycle.md](./lifecycle.md) |
| Plan, stories, what was added and removed | [plan.md](./plan.md) |
| Build record and decisions | [IMPLEMENTATION-LOG.md](./IMPLEMENTATION-LOG.md) |
| How to try everything (accounts, data, steps) | [TESTING-GUIDE.md](./TESTING-GUIDE.md) |
| Design boards | [designs/](./designs/) |
| Demo data | `npm run db:lifecycle` (seeds in `supabase/dev-*.sql`); password of every seeded account `Dev!Passw0rd1` |
