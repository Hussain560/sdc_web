# Sprint 18 — Where we stand and what is next

> Updated 2026-10-24 (second pass, after the "prove it" round). Read with the [plan](./plan.md) and the
> [implementation log](./IMPLEMENTATION-LOG.md).

## 1. Is the membership lifecycle complete?

**Feature-complete and proven: yes.** Every story (MBR-007…013, MEM-016…020, ACC-008, ACC-009, NOT-004) is built, plus the
changes the owner asked for in the review rounds. On a clean database: the whole database suite passes, the public
visual suite is re-baselined and green, and an automated browser journey walks the entire lifecycle on the real stack
(database, auth, Mailpit): apply → received mail → accept after the confirmation → acceptance mail with the 7-day link →
password → "your account is ready" → the five-step set-up → the card → the term ends (daily job) → renew → suspend → the
member's notice → reinstate → block → the blocked notice.

**What keeps it from being called perfect** is the pixel review against the boards and a handful of older test specs
from earlier sprints that fail on selectors that no longer exist (they are not about membership).

## 2. Test and quality status (2026-10-24, after a clean `db reset`)

| Check | Result |
| ----- | ------ |
| `npm run check` (format, lint, types, tokens, contrast, unit tests) | ✅ green: 0 lint errors, 629 unit tests |
| `npx supabase test db` | ✅ **37 files, 1941 assertions, all pass** (includes the new `33_late_fixes`) |
| Public visual suite (`npx playwright test`) | ✅ re-baselined from the clean database with the owner's approval (`chore(visual)` commit): 359 passed, 0 failed, 129 skipped as before |
| Lifecycle journey (`tests/auth/membership-lifecycle.spec.ts`) | ✅ 2 tests pass |
| Accessibility (`tests/auth/a11y-membership.spec.ts`) | ✅ 8 axe scans pass (public and signed-in membership screens, AR/EN × dark/light) |
| Auth suite on the clean database | 83 passed, 6 failed (see below; one of the six was fixed afterwards) |

The six auth specs that fail on a clean database — **also when run alone on a fresh reset, so not test-order noise** —
test features of earlier sprints and use selectors that no longer exist; none touches the membership lifecycle:

| Spec | Why it fails |
| ---- | ------------ |
| `registrations` ×3 | looks for the old registration button class `.sdc-btn-confirm` and the legacy event name "Google AI Studio Workshop" |
| `reports-admin` settings | the footer now has three Instagram links; fixed by taking the first (not yet re-run) |
| `rbac` "/members shows a founder" | expects a public leadership page to change at once; public pages are cached |
| `members` "legacy claim" | needs a legacy member the seed no longer provides |

They are candidates for a small clean-up task (see §3).

What the new tests found (and what we fixed): the onboarding could lose its "finished" flag (the last step now waits for
the save); `/welcome` had a focusable logo in a hidden panel (axe, now inert); `/card` text at reduced opacity failed
contrast; the events tab counts failed contrast (public page, fixed). Streaming pages keep a hidden copy of the page for
a few hundred milliseconds until React reveals it; test helpers now wait for the reveal.

## 3. What remains — by priority

### Should do (P1)

1. **Pixel comparison with the boards** at 1440 / 390 / 360 px, AR/EN, light/dark (axe is done; this is the visual review).
2. **Older specs** (the five above): rewrite the selectors or retire them with the features they test.
3. **Owner decisions**: password policy (design says 10 characters and no common passwords; we enforce 8 with four
   character classes, also in the auth settings — kept for now) and whether the activation badge should show the cycle
   name and "valid until" like the design.
4. **The activation page's other states** from the design ("expired link", "new link sent" with a resend countdown): the
   expired page works and sends a new link, but it is not styled as the board.
5. **Hosted checks**: the e-mail transport (today Mailpit), `SITE_URL`, `CRON_SECRET` and the Vercel cron
   (`/api/cron/membership-daily` is already in `vercel.json`); the privacy policy page should name the new data (gender,
   study year; the "my data" export already includes them).
6. **Rotate the keys** that were in `temp.txt` (the file was deleted on 2026-10-24 at the owner's request; the keys are
   still valid until rotated).

### Nice to have (P2)

7. Replace `sdc-mark.svg` (a 1.1 MB PNG inside an SVG) with a real vector — the owner will provide the artwork later.
8. Options editor for question hints (`option_hints`) in the cycle form (today set by seed or SQL).
9. "How long ago" on the "another reviewer holds it" note and an "ask them to release it" action (the design shows both;
   we have no claim time in the page data and no notification path).
10. The ideas still on the list: two-reviewer rule for rejections, interview state, editable decision e-mail texts,
    re-apply cooldown, QR check-in at events, appeal link in the termination e-mail. (A vice-leader role was decided
    against, Q-L7.)

Done and no longer open: the clean-database run of pgTAP, the visual re-baseline, the lifecycle journey, the accessibility
sweep, the unused tour component, dead code, `temp.txt`.

## 4. Proposed Sprint 19 — "Review and release" (about 9 SP)

| Item | SP |
| ---- | -- |
| Pixel comparison with the boards (1440 / 390 / 360, AR/EN, light/dark) and fixes | 3 |
| Activation page states (expired, resent) and the owner's decisions | 2 |
| Rewrite or retire the five older specs | 2 |
| Hosted checks and key rotation | 2 |

Then merge `feat/sprint-18-membership-lifecycle` (the owner decides when; nothing is pushed), run the hosted checks on
the first deploy and watch the first daily job.

## 5. Where things are

| What | Where |
| ---- | ----- |
| Business process | [lifecycle.md](./lifecycle.md) |
| Plan, stories, what was added and removed | [plan.md](./plan.md) |
| Build record and decisions | [IMPLEMENTATION-LOG.md](./IMPLEMENTATION-LOG.md) |
| How to try everything (accounts, data, steps) | [TESTING-GUIDE.md](./TESTING-GUIDE.md) |
| Design boards | [designs/](./designs/) |
| Demo data | `npm run db:lifecycle` on a clean database (right after `npx supabase db reset`) (seeds in `supabase/dev-*.sql`); password of every seeded account `Dev!Passw0rd1` |
| Browser tests | `tests/auth/membership-lifecycle.spec.ts`, `tests/auth/a11y-membership.spec.ts` (run with `npm run e2e:auth`) |

Note for running the auth suite: several specs clear the intake cycles and applications of the database they run on
(published cycles may not overlap), and failed runs can leave test accounts behind. Run them on a database you can
re-seed.
