# Sprint 01 — Engineering Baseline I — Tooling, Tests, CI

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 01 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2026-10-11 |
| **End Date**        | 2026-10-24 |
| **Phase / Milestone** | Phase 1 — Engineering & Platform Baseline / M1 |
| **Target version**  | contributes to `v0.2.0` |
| **Capacity**        | ~26 SP — planned 25 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

Every change is checked automatically before it reaches `develop`: formatting, lint, typecheck, unit tests, database policy tests and a **visual-regression check of every public page**, so the frozen look (D-009) cannot drift by accident.

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| ENG-009 | Prettier + Husky + lint-staged + commitlint | P0 | 3 | — | ⬜ |
| ENG-004 | Vitest + Testing Library + Playwright + pgTAP scaffolding | P0 | 5 | — | ⬜ |
| ENG-008 | Visual-regression baseline: every public page × ar/en × dark/light × 1440/375 | P0 | 5 | — | ⬜ |
| ENG-005 | GitHub Actions `ci.yml` (required checks), Dependabot, release-please | P0 | 5 | — | ⬜ |
| DB-004 | pgTAP regression tests for the critical findings (anon cannot write `members` / read registrations) — marked `todo` until containment/RBAC lands | P0 | 3 | — | ⬜ |
| UI-005 | `next/font` for IBM Plex Sans Arabic + Rubik with identical metrics (only if the visual check passes) | P1 | 3 | — | ⬜ |
| ENG-007 | Finish dead-code removal (contact modal stays — public page unchanged) | P1 | 1 | — | ⬜ |

## Technical Tasks

1. **Formatting** — `.prettierrc` (single quotes, 2 spaces, `printWidth` 100); format the codebase in one isolated `style:` commit and list its hash in `.git-blame-ignore-revs`.
2. **Hooks** — Husky `pre-commit` (lint-staged: eslint --fix, prettier) and `commit-msg` (commitlint, Conventional Commits).
3. **Vitest** — `vitest.config.ts` (jsdom); first tests for `LanguageContext.t()`, the theme toggle and date helpers.
4. **Playwright** — `playwright.config.ts` with projects `desktop-ar`, `desktop-en`, `mobile-ar` × dark/light; one smoke test per public route.
5. **Visual baseline** — `toHaveScreenshot()` per public page with masked dynamic areas (copyright year, members skeleton); baselines committed; threshold 0.1 %. Spec: [PUBLIC-SCREENS](../../../10-design-system/PUBLIC-SCREENS/README.md).
6. **pgTAP** — `supabase/tests/00_smoke.sql`; run with `supabase test db` locally and in CI.
7. **CI** — `.github/workflows/ci.yml`: `npm ci` (cached), `lint`, `typecheck`, `test`, `build`, `e2e` (against `next start`), `db-test`; required on `develop` and `main`; release-please for SemVer tags.
8. **Docs** — update [ci-cd](../../../08-infrastructure/ci-cd.md), [testing strategy](../../../09-quality/testing-strategy.md) and backlog statuses.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Repository on GitHub with Actions enabled | Sprint 00 FND-006 | Pending |
| Supabase CLI in CI (Docker) | GitHub runners | Available |

## Acceptance Criteria

- [ ] A PR with a lint error, type error, failing test or a 1px change on a public page is blocked by CI.
- [ ] `npm run test`, `npm run e2e` and `npx supabase test db` run locally and in CI.
- [ ] Commit messages that are not Conventional Commits are rejected locally.
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Open a PR that changes a public colour → the visual check fails with a diff image.
- [ ] Show the CI summary with all required checks.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Font loading change shifts layout | Medium | Medium | Ship `next/font` only if the visual check passes; otherwise defer UI-005 |
| Flaky screenshots (fonts, animation) | Medium | Medium | Disable animations in test mode, wait for fonts, mask dynamic regions |

## References & Specifications

- ADR-007 (CI/CD), ADR-008 (TypeScript)
- [Testing strategy](../../../09-quality/testing-strategy.md)
- [CI/CD](../../../08-infrastructure/ci-cd.md)

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
