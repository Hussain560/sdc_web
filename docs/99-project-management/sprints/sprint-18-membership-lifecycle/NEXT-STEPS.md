# Sprint 18 — Where we stand and what is next

> Updated 2026-10-24 (second pass, after the "prove it" round). Read with the [plan](./plan.md) and the
> [implementation log](./IMPLEMENTATION-LOG.md).

## 1. Is the membership lifecycle complete?

**Feature-complete: yes. Proven end to end: yes, with the exceptions below. Closed: not yet** — the visual baselines
and a clean-database run of the whole suite are still open.

Every story (MBR-007…013, MEM-016…020, ACC-008, ACC-009, NOT-004) is built, plus the changes the owner asked for in the
review rounds. The lifecycle is now covered by an automated browser journey that runs on the real stack (database,
auth, Mailpit): apply → received mail → accept after the confirmation → acceptance mail with the 7-day link →
password → "your account is ready" → the five-step set-up → the card → the term ends (daily job) → renew → suspend →
the member's notice → reinstate → block → the blocked notice. It passes.

## 2. Test and quality status (honest, 2026-10-24)

| Check | Result | Note |
| ----- | ------ | ---- |
| `npm run check` (format, lint, types, tokens, contrast, unit tests) | ✅ green: 0 lint errors, 629 unit tests | run as one command |
| pgTAP | ✅ `33_late_fixes` (9) and `29_member_lifecycle` (79, the ban assertion updated) pass | **the full 36-file run on a clean reset is still to repeat** (the owner's rule: no `db reset` unless asked; the last full clean run was 36 files / 1932 assertions, before migrations `…1200` and `…1300`) |
| Lifecycle journey (`tests/auth/membership-lifecycle.spec.ts`) | ✅ 2 tests pass | new |
| Accessibility (`tests/auth/a11y-membership.spec.ts`) | ✅ 8 scans pass | new: public journey pages and the signed-in membership screens, AR/EN × dark/light |
| Auth suite, first full run | 68 passed, 21 failed | most failures were **stale expectations** (landing page `/account` → `/account/profile`, sidebar items, the accept dialog, mail wording, error labels) |
| After updating those specs | ✅ auth-flows, rbac (all but one), members (2 of 3), members-create, emails, my-data, membership, lifecycle, a11y pass | re-run per spec |
| Still failing, **not caused by this sprint as far as we can tell, not yet verified on a clean database** | members "legacy claim", rbac "/members shows a founder" (a cached public page), registrations ×3, reports-admin "settings" | they depend on the legacy seed data and on cached public pages; the demo data in the dev database differs from a clean reset |
| Visual suite (`npm run e2e`) | 🔶 not re-baselined | needs a clean, freshly seeded database; see §3 |

What the new tests found (and what we fixed):

- **Onboarding could lose its "finished" flag**: the finishing screen showed before the save completed, so leaving at
  once could cancel it and send the member back into the set-up. The last step now waits for the save.
- **`/welcome`**: a focusable logo inside a decorative panel (axe: serious) → the panel is inert.
- **`/card`**: small text at reduced opacity failed contrast → full opacity.
- **Streaming pages** (every route with a `loading.tsx`) keep a hidden copy of the page in the document for a few
  hundred milliseconds until React reveals it; test helpers now wait for the reveal. Harmless for people, but strict
  locators and anchors can see two copies if they run too early.

## 3. What remains — by priority

### Must do before we merge (P0)

1. **Clean-database run of everything**: `npx supabase db reset`, then `npx supabase test db` (expect 37 files), then
   `npm run e2e:auth`. This also tells us whether the five "still failing" specs are really environment.
2. **Re-baseline the visual tests** from that fresh database (separate `chore(visual)` change). Never `e2e:update` on the
   demo database: the baselines would contain the demo members and events.

### Should do (P1)

3. **Owner decisions**: password policy (design says 10 characters and no common passwords; we enforce 8 with four
   character classes, also in the auth settings — recommendation: keep) and whether the activation badge should show the
   cycle name and "valid until" like the design.
4. **The activation page's other states** from the design ("expired link", "new link sent" with a resend countdown): the
   expired page works and sends a new link, but it is not styled as the board.
5. **A systematic visual comparison** with the boards at 1440 / 390 / 360 px, AR/EN, light/dark (axe is done; this is the
   pixel review).
6. **Hosted checks**: the e-mail transport (today Mailpit), `SITE_URL`, `CRON_SECRET` and the Vercel cron
   (`/api/cron/membership-daily` is already in `vercel.json`); the privacy policy page should name the new data (gender,
   study year; the "my data" export already includes them).
7. **Security hygiene**: `temp.txt` (keys for a hosted project) is still in the project folder, untracked and excluded
   from git. Delete it and rotate those keys — it is the owner's file, so we left it alone.

### Nice to have (P2)

8. Replace `sdc-mark.svg` (a 1.1 MB PNG inside an SVG) with a real vector — needs the source artwork.
9. Options editor for question hints (`option_hints`) in the cycle form (today set by seed or SQL).
10. "How long ago" on the "another reviewer holds it" note and an "ask them to release it" action (the design shows both;
    we have no claim time in the page data and no notification path).
11. The ideas still on the list: two-reviewer rule for rejections, interview state, editable decision e-mail texts,
    re-apply cooldown, QR check-in at events, appeal link in the termination e-mail. (A vice-leader role was decided
    against, Q-L7.)

Done in this pass and no longer open: the unused tour component was deleted, dead code removed, the stale Playwright
specs updated, the lifecycle journey and the accessibility sweep written and passing.

## 4. Proposed Sprint 19 — "Prove it and release it" (about 12 SP now)

| Item | SP |
| ---- | -- |
| Clean-database run of pgTAP and the auth suite; fix what it shows | 3 |
| Re-baseline visuals (approved) and make `npm run e2e` a real gate again | 3 |
| Pixel comparison with the boards (1440 / 390 / 360, AR/EN, light/dark) and fixes | 3 |
| Activation page states (expired, resent) and the owner's two decisions | 2 |
| Hosted checks and `temp.txt` | 1 |

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
| Demo data | `npm run db:lifecycle` on a clean database (seeds in `supabase/dev-*.sql`); password of every seeded account `Dev!Passw0rd1` |
| Browser tests | `tests/auth/membership-lifecycle.spec.ts`, `tests/auth/a11y-membership.spec.ts` (run with `npm run e2e:auth`) |

Note for running the auth suite: several specs clear the intake cycles and applications of the database they run on
(published cycles may not overlap), and failed runs can leave test accounts behind. Run them on a database you can
re-seed.
