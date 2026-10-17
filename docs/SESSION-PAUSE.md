# Session Pause Note

| Field            | Value                                                  |
| ---------------- | ------------------------------------------------------ |
| **Paused on**    | 2026-10-18                                             |
| **Branch**       | `feat/sprint-17-members-and-motion` (local, nothing pushed) |
| **Last commit**  | `65d84d1` fix(home): compact member marquee cards on phones |
| **Pushed?**      | **No.** Push commands are in the handoff message; the owner decides when. |

## State of the machine

- Supabase containers are **stopped** (`npx supabase stop`). The dev server on port 3000 is stopped.
- Local data (demo accounts, leadership photos, filled sample members) lives in the stopped Supabase volume and comes back on `npx supabase start`.
- Uncommitted: `supabase/dev-env-seed.sql` (untracked, not part of Sprint 17 commits) and a whitespace-only change in `tests/unit/event-card.test.tsx`.

## Resume in five minutes

```bash
npx supabase start
npm run dev                # http://localhost:3000
```

The sprint 17 demo data is already in the local database. If you reset the database, re-run in this order:
`npm run db:personas`, `node scripts/dev-seed-leadership.mjs`, `node scripts/dev-seed-member-photos.mjs`,
`docker exec -i supabase_db_sdc_web psql -U postgres < supabase/dev-fill-fake-members.sql`,
`docker exec -i supabase_db_sdc_web psql -U postgres < supabase/dev-full-member.sql`.

## Sprint 17 status (members, profiles, motion)

| Story | Status |
| ----- | ------ |
| MOT-001 motion foundation | Done (`motion` package, `MotionProvider`, CSS vocabulary) |
| ACC-007 assign-position search | Done |
| MEM-011 data model v3, MEM-012 photos | Done |
| MEM-014 add-member wizard | Done |
| MEM-015 admin list, detail, staff edit | Done |
| MEM-013 profile editor | Done (project cover upload and phone-language toggle slipped to Sprint 18) |
| RDS-033/034 public directory and profile | Done; profile follows the approved design; the visual baselines for `/members*` are **not** updated |
| RDS-035 home marquee | Done: three rows, two directions, fade edges, phone sizing |
| MOT-002 page transitions | Done; `12-motion.md` written |
| Brand | Header and footer use the logo-kit SVGs; the X placeholder uses `public/assets/brand/sdc-mark.png` |
| Leadership on About | Moved from the members page; members page has room for filters |

Open items:
- Visual baseline updates for `/members*`, Home and About need the owner's approval (`e2e:update` only then).
- `04-members.md`, the members module doc and `notes.md` still need the final pass.
- Q-C1 (should committee heads add any member to their committee?) is open.
- Q-M5 to Q-M9 defaults are not yet written up.
- The certificate PDF still uses `navbar.png`; `sdc-logo-mark.svg` is no longer referenced.
- The Next dev server reported a Zod CSP "eval" report on login; harmless, optional follow-up.

## Standing rules

Never push without the owner saying so; no `Co-Authored-By` trailer; commit body lines at most 100 characters; no `.env*` or secrets in commits;
frozen visual identity (D-009); never run `e2e:update` without approval.

## Previous pause (release/v1.0.0, 2026-10-04)

### Where the work stood

| Area | Status |
| ---- | ------ |
| Sprints 00 to 12 | Done locally |
| Sprint 13 (launch) | Everything buildable locally is done: runbook, rehearsal script and record, pre-flight script, admin guide, release drafts. Production actions belong to the owners |
| Branches | `main` (baseline), `develop` (rebuild merged), `release/v1.0.0` (current), `chore/platform-foundation` (history) |
| Verification on the release branch | Unit tests 173 pass; pgTAP pass; visual 203 pass; auth e2e 74 of 75 in the full run, the remaining one passes alone (load flake) |

## What changed in the last stretch

Event tabs and attendance, guest registration, accountless membership, member creation, new public header with Home, collapsible sidebar,
welcome e-mail with banner and community WhatsApp link (setting), only acceptance e-mails are sent, privacy tools, CSP and headers,
accessibility fixes, restore drill, cutover rehearsal, fieldset overflow fix in the thread editor.

## Next steps (in order)

1. **Get write access** to `sdc-saudi/SDC_website`: an org owner adds `Hussain560` as a collaborator with Write, or sign in with the right account (`gh auth login`), or use a repository you own as a fallback.
2. `git push -u origin develop`, watch the six CI checks, fix first-run problems (the visual job may differ on Linux: regenerate the baselines in CI once).
3. Push `release/v1.0.0` and `v1.0.0-rc.1`; set branch protection, required checks, secrets and CODEOWNERS ([push checklist](07-engineering/push-and-release-checklist.md)).
4. Deploy the candidate to staging and run the [event lifecycle guide](07-engineering/event-lifecycle-test-guide.md).
5. Production cutover per the [runbook](08-infrastructure/cutover-runbook.md); then merge to `main` and tag `v1.0.0`.

## Open decisions and owner actions

- Privacy notice wording and retention periods (Q-031).
- Production projects, domain, e-mail domain (SPF, DKIM, DMARC), hosted Auth settings, backup secrets (`SUPABASE_DB_URL`, `BACKUP_ENCRYPTION_KEY`), `HEALTH_URLS`, two named administrators.
- Timing of the contract migration that drops the legacy tables (`supabase/contract/`).
- Optional follow-up: silence the harmless Zod "eval" CSP report (`z.config({ jitless: true })`).

