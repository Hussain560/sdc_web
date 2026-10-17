# Action Board — What To Do Now

| Field               | Value |
| ------------------- | ----- |
| **Last Updated**    | 2026-10-17 |
| **Status**          | Living document — update it at every sprint planning and review |
| **Where we are**    | Sprints 00–16 are built and merged into `develop` on both repositories. The platform (`v1.0.0` scope) and the public redesign on Design System v2 (`v1.1.0` scope) are done in code. What is left is owner decisions, production actions, and a few follow-ups. |

One page that answers *"what do we do next, and who does it?"*. Details live in the linked sprint plans, [milestones](./milestones.md) and [releases](./releases/README.md).

## 1. Now

| # | Action | Owner | Blocks | Done when |
| - | ------ | ----- | ------ | --------- |
| 0 | **Sprint 17 — members and motion.** Send [the design brief](../10-design-system/CLAUDE-DESIGN-PROMPT-MEMBERS-AND-MOTION.md) to Claude Design, approve the result, answer Q-M5…Q-M9. The data stories, the add-member wizard logic and the assign-position search fix can start now ([plan](./sprints/sprint-17-members-profiles-and-motion/plan.md)) | Project owner | Members redesign | Designs approved |
| 1 | **Approve the visual baselines for `/about` and `/events`.** Both pages were redesigned (PR #4) and their Playwright baselines still show the old look. Review the new pages, then ask for one separate `chore(visual)` change that runs `npm run e2e:update` (never mixed with feature code) | Project owner | A green visual gate | Baselines updated and merged |
| 2 | **Review the draft public copy**: About (what we offer, how we work, values, marquee topics; Q-A1) and the Home why-join and FAQ blocks (Q-H3, Q-H4). They are live with draft wording, switched by `HOME_FLAGS` in `src/modules/home/sections.ts` | Project owner + Design & Identity committee | Public launch of the redesign | Wording confirmed or replaced |
| 3 | **Decide the release number.** The redesign is already on `develop`, after the `v1.0.0-rc.1` and `-rc.2` tags. Default: cut `release/v1.0.0` from today's `develop` so the launch includes the redesign, and keep `v1.1.0` for the next batch. The alternative is to tag `v1.0.0` from the old candidate and `v1.1.0` after it | Project owner + tech lead | Release record, changelog | One path chosen and written in [releases](./releases/README.md) |
| 4 | **Production actions** (code is ready, accounts are not): production Supabase and Vercel projects, domain, e-mail domain (SPF, DKIM, DMARC), hosted Auth settings, backup secrets, `HEALTH_URLS`, two named administrators. Checklist: [cutover runbook](../08-infrastructure/cutover-runbook.md), [pre-flight](../../scripts/preflight-production.mjs) | Project owner | `v1.0.0` launch (M8) | `npm run preflight -- --online` passes against production |
| 5 | **Privacy notice wording and retention periods** ([Q-031](../90-decisions/open-questions.md)) | Project owner + leadership | Launch | Wording approved |
| 6 | **Contract migration timing.** `supabase/contract/20270410000000_drop_legacy_tables.sql` drops the `*_legacy` tables. Run it only after the production data migration is checked | Tech lead | Clean production schema | Applied and recorded in the release record |
| 7 | **Team test accounts on the hosted develop project.** `supabase/dev-env-seed.sql` (idempotent, guarded by a password placeholder) is still untracked. Decide whether to commit it as `chore(db)`. The shared password never goes into git or into this repository | Project owner | Team testing of the develop site | Committed, or kept local on purpose |

## 2. Next engineering work (no outside dependency)

| Item | What |
| ---- | ---- |
| Phone field hydration | The registration phone field logs a hydration warning because the country list uses different names on server and client (for example "Palestine" and "Palestinian Territories"). Make the list deterministic |
| Dependabot | Open update branches on `upstream`: ESLint 10, TypeScript 7, `@types/node` 26 and a minor/patch group. Review each; the two majors need their own change |
| Stale branches | Local `feat/rds-001` … `feat/rds-012` and `design/public-redesign-part1` are merged through PRs #2–#4 and can be deleted. Remote branches that are long-lived stay |
| Chrome strings | Header and footer text lives in the typed `src/components/layout/chrome-strings.ts` (both languages), not in `messages/{ar,en}.json`. Keep it that way or move it, but decide once |
| Suggested additions | [RDS-030](../10-design-system/PUBLIC-SCREENS-V2/20-suggested-additions.md) is unscheduled: pick items at the next planning |

## 3. Done

| When | What |
| ---- | ---- |
| 2026-10-02 | Sprints 00–11 built locally: tooling, tests, CI, tokens, locale routing, server-side auth, RBAC and committees, KFUCS event wizard and lifecycle, public events from the database, registrations, membership intake, members and directory, articles, attendance with QR, certificates, reports, audit log, settings |
| 2026-10-03 | Hardening (Sprint 12: accessibility, CSP and headers, privacy flows, restore drill, performance budget) and launch preparation (Sprint 13: cutover runbook and rehearsal, pre-flight, administrator guide). Guest registration (no account needed), accountless membership (ADR-013), leaders add members, collapsible sidebar, only acceptance e-mails |
| 2026-10-04 | Platform rebuild pushed. `release/v1.0.0` and candidate tags `v1.0.0-rc.1` and `-rc.2` pushed. CI split into a fast pull-request gate and a manual browser suite. Two-account pipeline: dev Supabase and dev Vercel from `develop`, production only from `production` ([git workflow](../07-engineering/git-workflow.md)) |
| 2026-10-09 | Pipeline check: pull request flow proven end to end |
| 2026-10-10 | **PR #1** design brief and reference screenshots. **PR #2** Design System v2 foundation: tokens, fonts, every component, header and footer, auth layout, component gallery (Sprint 14) |
| 2026-10-10 | **PR #3** Design System v2 on every public page: Home, event page, registration dialog with the 1.5 s feedback floor, calendar export, check-in, members with per-field consent, events list, articles, committees, About, Join, certificate, privacy, 404. Legacy header, footer and public CSS deleted; the colour-literal allowlist is empty. New registration form (name parts, occupation, international phone). Eight new migrations (Sprints 15–16) |
| 2026-10-11 | **PR #4** About and Events list redesign: count-up figures, topics marquee, values rows, spotlight event card, filter card with phone sheet, shared event card, `page-motion.css`. All four PRs merged on both repositories; feature branch deleted |
| 2026-10-17 | Hosted develop Supabase seeded with team accounts for every role and sample data (`supabase/dev-env-seed.sql`); one-page accounts sheet shared with the team |

Verification on `develop` (PR #4): `npm run check` passes with 455 unit tests, `check:tokens` and `check:contrast` (84 pairs, both themes); 22 pgTAP files; Playwright visual and authenticated suites run locally before releases.

## 4. Decisions waiting on people

| Question | Needed by | Recommended default if unanswered |
| -------- | --------- | --------------------------------- |
| Release number (item 3 above) | Release planning | Cut `release/v1.0.0` from `develop` including the redesign |
| Q-031 privacy wording and retention | Launch | Keep the review banner on the privacy page; launch only after approval |
| Q-A1, Q-H3, Q-H4 About and Home copy | Before the redesign goes live | Ship the draft wording; turn off a Home block with `HOME_FLAGS` if the owner rejects it |
| Q-025 production state (old project `sdc-members`) | Cutover | Treat as exposed; run the containment checks before the data migration |
| Q-020 certificates and threshold | Launch | Certificates stay behind the setting, off; KFUCS threshold 70 % |
| Q-041 master brand kit and SVG wordmark | Any time | Keep the current PNG logo files |

## 5. How we work

- **Every change:** branch from `develop` → Conventional Commits → pull request → `CI` green (format, lint, types, tokens, contrast, unit tests, build, pgTAP, PR title) → review → squash merge. Pull requests go to **both** repositories (`origin` = `Hussain560/sdc_web`, `upstream` = `sdc-saudi/SDC_website`). The owner pushes and merges; Claude never pushes ([git workflow](../07-engineering/git-workflow.md)).
- **Before finishing a change:** `npm run check`; for UI also `npm run e2e` (visual gate). `npm run e2e:update` only with the owner's approval and in its own commit.
- **Story readiness:** a story enters a sprint only when it meets the [Definition of Ready](./definition-of-ready.md). It is done only when it meets the [Definition of Done](./definition-of-done.md).
- **Design:** public pages follow Design System v2 ([ADR-014](../90-decisions/ADR-014-public-redesign-design-system-v2.md)); the internal dashboard keeps the frozen identity (D-009) and shares the same tokens. Semantic tokens only, no colour literal outside `primitives.css`.
- **Agents and skills:** see [AI agent skills](../07-engineering/ai-agent-skills.md).
