# Sprint 00 — Notes (living log)

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |

## Done before the sprint started (2026-10-01 → 2026-10-02)

| Item | Result | Evidence |
| ---- | ------ | -------- |
| Foundation documentation | 164+ docs under `docs/` | [docs README](../../../README.md) |
| Next.js 14.2 → 16.3.8, React 18 → 19.3, TypeScript 5.9 strict | Build ✅, typecheck 0 errors, lint 0 errors; public pages visually identical (computed-style diff on 14 page/theme combinations) | [audit §11](../../../01-project/current-system-audit.md#11-addendum--platform-upgrade-2026-10-02-same-day) |
| Internal screen blueprints (24 files) | Shell, sidebar, conditional rendering, skeletons, 16 screens, flows | [INTERNAL-SCREENS](../../../10-design-system/INTERNAL-SCREENS/README.md) |
| Event model and wizard aligned with KFUCS | ADR-012 accepted; entities, lifecycle, screens 13/16 rewritten | [ADR-012](../../../90-decisions/ADR-012-event-model-and-wizard-from-kfucs.md) |
| Public screen blueprints (14 files) | Every current page captured at 1440/375 px; target states; visitor flows | [PUBLIC-SCREENS](../../../10-design-system/PUBLIC-SCREENS/README.md) |
| Agent skills | find-skills, frontend-design, web-design-guidelines, vercel-react-best-practices, supabase, accessibility; frozen-identity guardrail D-009 | [AI agent skills](../../../07-engineering/ai-agent-skills.md) |
| Repository reconciliation (Q-024) | `sdc-saudi/SDC_website` has 3 commits (2026-09-07). The local copy is a **strict superset**: there is nothing in the repo that is missing locally (only line-ending differences). The local copy adds the light theme (`ThemeContext`), the password policy, light-mode assets and `seed_tables.sql` | `git diff --stat` in the session |
| Local Git | Branch `chore/platform-foundation` on top of `origin/main`, with 4 commits: (1) sync of the working copy received as a zip, (2) platform upgrade, (3) docs, (4) agent skills. **Not pushed.** | `git log --oneline` |

## Progress during the sprint

| Date | Story | Update |
| ---- | ----- | ------ |
| 2026-10-02 | FND-007 | Repository audit: `.env.local` ignored and never committed; no secrets tracked |
| 2026-10-02 | FND-001 / FND-005 | Review checklist and access-inventory template written |
| 2026-10-02 | Sprint 01–02 | Started early because the local scope has no external dependency — see their plans |
| 2026-10-02 | Policy | Owner: no GitHub push; no `Co-Authored-By` trailer on commits |

## Decisions taken in this sprint

| ID | Decision |
| -- | -------- |
| D-008 | Events follow KFUCS (wizard, data, logic) |
| D-009 | Visual identity frozen |
| D-010 | Canonical repository `sdc-saudi/SDC_website` |
| D-011 | English URLs live under `/en`, Arabic keeps unprefixed URLs (ADR-010 accepted); this supersedes the `/ar` wording in the first sprint drafts |
| D-012 | Local checks (`npm run check`, `npm run e2e`, `npm run db:test`) are the quality gate until GitHub Actions can run |
