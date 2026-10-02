# Sprint 02 — Engineering Baseline II — Environments, Migrations, Tokens, Locale Routing

## Sprint Metadata

| Field               | Value |
| ------------------- | ----- |
| **Sprint #**        | 02 |
| **Duration**        | 2 weeks |
| **Start Date**      | 2026-10-25 |
| **End Date**        | 2026-11-07 |
| **Phase / Milestone** | Phase 1 — Engineering & Platform Baseline / M1 |
| **Target version**  | `v0.2.0` (M1 exit) |
| **Capacity**        | ~28 SP — planned 29 SP |
| **Team**            | Tech lead + volunteer developers (assigned at sprint planning) |
| **Status**          | ⬜ Planned — dates indicative; re-forecast after Sprint 02 velocity |

## Sprint Objective

The database is reproducible from migrations, a staging environment exists, design tokens hold the frozen palette, and every page is served under `/ar` and `/en` with server-rendered direction — all with zero visual change (the Sprint 01 visual check stays green).

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| DB-001 | Complete `supabase/config.toml` (auth, storage, inbucket SMTP port) | P0 | 2 | — | ⬜ |
| DB-002 | Baseline migration of the legacy schema + `migration repair` on remote | P0 | 5 | — | ⬜ |
| DB-003 | Retire `seed_tables.sql`; synthetic `seed.sql` | P0 | 2 | — | ⬜ |
| ENG-006 | Staging Supabase project, Vercel environments, `lib/env.ts` (Zod-validated env) | P0 | 5 | — | ⬜ |
| UI-001 | `tokens.css` for both themes — values copied exactly from the current CSS | P0 | 5 | — | ⬜ |
| UI-002 | Tailwind v4 `@theme` mapped to the tokens | P0 | 2 | — | ⬜ |
| UI-003 | `[locale]` routing with next-intl; server `lang`/`dir`; messages for the shared chrome | P0 | 5 | — | ⬜ |
| UI-004 | Primitives batch 1 (Button, Badge, Card, Field, Alert, Dialog, Skeleton) for the dashboard — public pages keep their CSS | P1 | 3 | — | ⬜ |

## Technical Tasks

1. **Migration baseline** — dump local + remote (from Sprint 00) → `supabase/migrations/20261025000000_baseline.sql`; `supabase migration repair --status applied` on remote; `supabase db reset` reproduces the schema.
2. **Seed** — fictional members/events/registrations in `supabase/seed.sql` (no real personal data).
3. **Staging** — new Supabase project `sdc-staging`; Vercel Preview → staging DB, Production → production DB; matrix in [environments](../../../08-infrastructure/environments.md).
4. **Tokens** — move every hex value from the 16 CSS files into primitive tokens, map them to semantic tokens ([colors](../../../10-design-system/foundations/colors.md)) and replace values in CSS **without changing computed values** (the visual check proves it).
5. **Locale routing** — `src/i18n/` + locale detection in `proxy.ts`; `/` → `/ar`; old URLs redirect; remove the client-side `dir` flip (no flash).
6. **Typed DB** — run `npm run db:types` in CI and fail on drift.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Remote schema dump | Sprint 00 FND-003 | Pending |
| Rights to create the staging project | Supabase org owner | Pending |

## Acceptance Criteria

- [ ] `npx supabase db reset` + seed gives a working local app.
- [ ] Staging deploys automatically from `develop`.
- [ ] `/ar/events` renders RTL from the server (no flash); `/en/events` LTR; visual check unchanged.
- [ ] No raw hex values in new code (lint rule).
- [ ] CI green, including the public-page visual check; all stories meet the [Definition of Done](../../definition-of-done.md)
- [ ] Deployed to staging; demo script executed

## Sprint Review Checklist (demo script)

- [ ] Switch language: the URL changes and there is no layout flash.
- [ ] Show `supabase migration list` with local = remote.
- [ ] Arabic RTL and English LTR, dark and light
- [ ] At least one permission-denied case shown
- [ ] Release-notes lines collected

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Remote schema differs from local | Medium | High | Baseline from the **remote** dump; verify local reset against it |
| Token refactor changes a colour | Medium | Medium | Visual check is a required CI gate |

## References & Specifications

- ADR-003 (migrations), ADR-005 (environments), ADR-009 (tokens), ADR-010 (i18n)
- [Migration strategy](../../../05-database/migration-strategy.md)
- [Theming](../../../10-design-system/foundations/theming.md), [RTL and i18n](../../../10-design-system/foundations/rtl-and-i18n.md)

---

## Implementation Status (updated at sprint end)

### Completed
| Item | Details |
| ---- | ------- |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
