# Session Pause Note

| Field            | Value                                                  |
| ---------------- | ------------------------------------------------------ |
| **Paused on**    | 2026-10-04                                             |
| **Branch**       | `release/v1.0.0` (clean working tree, nothing pending) |
| **Last commit**  | `f5aacc1` test(visual): baselines from a freshly seeded database |
| **Tag**          | `v1.0.0-rc.1` (local only)                             |
| **Pushed?**      | **No.** The first push to `develop` failed with HTTP 403 (no write access). |

## State of the machine

- Supabase containers are **stopped** (`npx supabase stop`, data backed up by the CLI). Dev servers on ports 3000, 3100 and 3300 are stopped.
- The `origin` push URL is now the real URL (it was `DISABLED-do-not-push`). To block accidental pushes again:
  `git remote set-url --push origin DISABLED-do-not-push`.

## Resume in five minutes

```bash
npx supabase start
npm run db:personas        # demo accounts (password in docs/07-engineering/local-demo-guide.md)
npm run dev                # http://localhost:3000
```

A database reset removes the demo registrants and test events. Before the visual suite always run `npx supabase db reset`
(the screenshots assume a freshly seeded database).

## Where the work stands

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

## Standing rules

Never push without the owner saying so; no `Co-Authored-By` trailer; commit body lines at most 100 characters; no `.env*` or secrets in commits;
frozen visual identity (D-009); never run `e2e:update` without approval.

Pipeline check: PR flow tested on 2026-10-09.
