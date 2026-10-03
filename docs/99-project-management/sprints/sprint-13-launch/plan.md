# Sprint 13 — Production Readiness & Launch

## Sprint Metadata

| Field                 | Value |
| --------------------- | ----- |
| **Sprint #**          | 13 |
| **Duration**          | 2 weeks |
| **Start Date**        | 2027-03-28 |
| **End Date**          | 2027-04-10 |
| **Phase / Milestone** | Phase 6 — Production Readiness & Launch / M8 |
| **Target version**    | `v1.0.0` |
| **Capacity**          | ~20 SP — planned 16 SP |
| **Team**              | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**            | 🔄 Local preparation in progress (2026-10-03) — production actions need the owners (see Known Gaps) |

## Sprint Objective

The rebuilt platform is **ready to become production**: the cutover is scripted, timed and rehearsed on a copy; the contract migration that drops the legacy tables is written and proven on the copy (and kept out of the normal migration path until the cutover); the production configuration, domain, e-mail domain and monitoring are specified and verifiable; two system administrators can run the platform from the runbooks; and the launch announcement and release notes are ready in Arabic and English.

> Honest scope note: DNS, the production Supabase/Vercel projects, the e-mail provider account and the people to train belong to the owners (Q-017, Q-024, Q-025, Q-027, Q-010, Q-039). This sprint delivers everything that can be built and rehearsed locally, plus exact, checkable instructions for the rest. `v1.0.0` is **not tagged** until the production cutover is actually executed.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| LCH-001 | Production cutover runbook and rehearsal (timed, with rollback) | P0 | 5 | — | ⬜ |
| LCH-002 | Contract migration (drop legacy tables), proven on a rehearsal copy | P0 | 3 | — | ⬜ |
| LCH-003 | Production env, domain, e-mail domain verification, monitoring/keep-alive | P0 | 3 | — | ⬜ |
| LCH-004 | Handover: administrator guide, runbooks, access inventory | P0 | 3 | — | ⬜ |
| LCH-005 | Launch announcement (ar/en), release notes, release record | P1 | 2 | — | ⬜ |

### Acceptance criteria per story

**LCH-001** — A written runbook lists every step with owner, command, expected result and rollback; the rehearsal script runs the whole sequence on a throwaway copy (backup → migrations → contract → smoke), records the duration of each step in the rehearsal record, and ends with a successful rollback test (restore from the backup).

**LCH-002** — `supabase/contract/…_drop_legacy_tables.sql` removes the `*_legacy` tables and nothing else; it is **not** in `supabase/migrations/` so a normal `db push` cannot run it by accident; it was applied to the rehearsal copy and the pgTAP suite plus the e2e smoke passed afterwards; a fresh backup precedes it in the runbook.

**LCH-003** — `.env.example` and [environment-variables](../../../08-infrastructure/environment-variables.md) list every variable the app reads; `/api/health` and the keep-alive/backup workflows exist; a pre-flight script checks the production configuration (variables present, `site_url`, redirect URLs, sign-up disabled, OTP expiry, cron secret) and fails with a readable list; SPF/DKIM/DMARC steps are written for the owner.

**LCH-004** — An administrator guide (Arabic and English) covers daily tasks (cycles, applications, members, events, certificates, settings, audit, e-mail log), an access inventory template lists every service with two owners, and the incident and recovery runbooks are linked.

**LCH-005** — Announcement text and release notes exist in both languages; the `v1.0.0` release record is drafted from the template with the checklist, ready to be signed.

## Technical Tasks

| Id | Task | Story |
| -- | ---- | ----- |
| S13-T01 | `docs/08-infrastructure/cutover-runbook.md` (freeze, backup, migrate, deploy, smoke, announce, rollback) | LCH-001 |
| S13-T02 | `scripts/cutover-rehearsal.mjs`: copy of the local database → backup → apply pending migrations → contract → smoke → restore test; prints and records timings | LCH-001 |
| S13-T03 | Rehearsal record in `docs/99-project-management/releases/rehearsal-1.md` | LCH-001 |
| S13-T04 | Audit every reference to a legacy table in code, views and policies; contract migration under `supabase/contract/` | LCH-002 |
| S13-T05 | Apply the contract to the rehearsal copy; run pgTAP and e2e against it | LCH-002 |
| S13-T06 | `scripts/preflight-production.mjs`; `.env.example` completed; environment docs aligned | LCH-003 |
| S13-T07 | E-mail domain checklist (SPF/DKIM/DMARC), Auth settings (`site_url`, redirects, SMTP, sign-ups off, OTP expiry), cron secrets | LCH-003 |
| S13-T08 | Administrator guide ar/en; access inventory template; runbook index | LCH-004 |
| S13-T09 | Launch announcement ar/en; release notes; `releases/v1.0.0.md` draft; CHANGELOG | LCH-005 |
| S13-T10 | Final pass: manual QA checklist run locally, docs statuses (roadmap, milestones, backlog, README), memory | all |

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| All Must requirements done | Sprints 01–12 | ✅ done locally |
| Production Supabase project and Vercel project, domain, e-mail provider | Owners (Q-017, Q-025, Q-027, Q-010) | ⛔ owner action |
| Two system administrators identified | Leadership (Q-039) | ⛔ owner action |
| Privacy text approved | Leadership (Q-031) | Pending |

## Acceptance Criteria

- [ ] Release checklist complete in the release record; two system admins named; backup verified after cutover (**executed by the owners**).
- [ ] Rollback plan tested in the rehearsal (restore from the pre-cutover backup).
- [ ] Contract migration proven on the rehearsal copy; not present in `supabase/migrations/`.
- [ ] Pre-flight script passes against the local configuration and lists exactly what production still needs.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md).
- [ ] Deployed to staging; demo script executed (**owner action**).

## Sprint Review Checklist (demo script)

- [ ] Live production walkthrough with leadership (after the cutover).
- [ ] Arabic RTL and English LTR, dark and light.
- [ ] At least one permission-denied case shown.
- [ ] Guest registration → QR check-in → certificate e-mail, then an application accepted → activation e-mail → sign-in.
- [ ] Release-notes lines collected.

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Data migration surprises (legacy rows that do not map) | Medium | High | Two rehearsals; row-count reconciliation in the script; rollback snapshot before cutover |
| Dropping legacy tables too early | Low | High | Contract kept outside `migrations/`; runs one release after the switch, after a fresh backup, by a named person |
| Activation / sign-in e-mails land in spam on the new domain | Medium | High | SPF, DKIM, DMARC verified before launch; test sends to three providers; daily-limit monitor (e-mail log) |
| Free-tier pause of the staging/production database | Medium | Medium | Keep-alive workflow; uptime alert (NFR-OPS-004) |
| Only one person holds production access | Medium | High | Access inventory with two owners per service (NFR-OPS-005) is a launch gate |

## References & Specifications

Read for this sprint (paths relative to `docs/`):

| Area | Documents |
| ---- | --------- |
| Infrastructure | [deployment](../../../08-infrastructure/deployment.md) (order of operations, rollback, domains) · [operations](../../../08-infrastructure/operations.md) (backups, runbook, monitoring, jobs, free-tier limits, logs) · [environments](../../../08-infrastructure/environments.md) · [environment-variables](../../../08-infrastructure/environment-variables.md) · [ci-cd](../../../08-infrastructure/ci-cd.md) · [local-development](../../../08-infrastructure/local-development.md) |
| Release process | [versioning-and-releases](../../../07-engineering/versioning-and-releases.md) (SemVer, release checklist, rollback, rules) · [releases](../../releases/README.md) · [milestones](../../milestones.md) · [definition-of-done](../../definition-of-done.md) |
| Data | [migration-strategy](../../../05-database/migration-strategy.md) (expand/contract, MG-8, step 7 contract) · [rls-security-model](../../../05-database/rls-security-model.md) |
| Quality | [manual-qa-checklist](../../../09-quality/manual-qa-checklist.md) · [testing-strategy](../../../09-quality/testing-strategy.md) |
| Security | [security-model](../../../06-security/security-model.md) (§8 secrets, §9 e-mail security, §15 incident response) · [data-protection-and-privacy](../../../06-security/data-protection-and-privacy.md) |
| Decisions | [ADR-005 environments](../../../90-decisions/ADR-005-environment-strategy.md) · [ADR-007 CI/CD](../../../90-decisions/ADR-007-ci-cd-strategy.md) · [ADR-013 accounts for members only](../../../90-decisions/ADR-013-accounts-for-members-only.md) · [open questions](../../../90-decisions/open-questions.md) Q-010, Q-017, Q-024, Q-025, Q-027, Q-031, Q-039 |

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
