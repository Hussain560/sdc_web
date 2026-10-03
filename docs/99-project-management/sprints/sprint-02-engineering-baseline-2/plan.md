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
| **Status**          | 🔄 In progress — local scope done early; remote and staging items wait for the account owners |

## Sprint Objective

The database is reproducible from migrations, a staging environment exists, design tokens hold the frozen palette, and every page is served under `/ar` and `/en` with server-rendered direction — all with zero visual change (the Sprint 01 visual check stays green).

## User Stories

| Story ID | Title | Priority | Points | Assignee | Status |
| -------- | ----- | -------- | ------ | -------- | ------ |
| DB-001 | Complete `supabase/config.toml` (auth, storage, inbucket SMTP port) | P0 | 2 | — | ✅ Done 2026-10-02 (password policy 8+ with upper/lower/digit/symbol, locale-aware redirect URLs) |
| DB-002 | Baseline migration of the legacy schema + `migration repair` on remote | P0 | 5 | — | 🔄 Local baseline done (`20261025000000_baseline_legacy_schema.sql`, reconstructed from the repo). Remote comparison and `migration repair` ⏸ with the deferred Supabase check |
| DB-003 | Retire `seed_tables.sql`; synthetic `seed.sql` | P0 | 2 | — | ✅ Done 2026-10-02 |
| ENG-006 | Staging Supabase project, Vercel environments, `lib/env.ts` (Zod-validated env) | P0 | 5 | — | 🔄 `lib/env.ts` done and tested. Staging project and Vercel environments need the account owners |
| UI-001 | `tokens.css` for both themes — values copied exactly from the current CSS | P0 | 5 | — | ✅ Done 2026-10-02 (76 primitives replace 710 hex literals; semantic layer in `tokens.css`) |
| UI-002 | Tailwind v4 `@theme` mapped to the tokens | P0 | 2 | — | ✅ Done 2026-10-02 |
| UI-003 | `[locale]` routing with next-intl; server `lang`/`dir`; messages for the shared chrome | P0 | 5 | — | ✅ Done 2026-10-02 (Arabic unprefixed, English under `/en` per ADR-010; only metadata messages so far, the chrome strings move in UI-007) |
| UI-004 | Primitives batch 1 (Button, Badge, Card, Field, Alert, Dialog, Skeleton) for the dashboard — public pages keep their CSS | P1 | 3 | — | ✅ Done 2026-10-02 |
| DB-005 | Typed database: regenerate `database.types.ts` from the migrated schema; CI fails on drift | P1 | 2 | — | ✅ Done 2026-10-02 (CI step written) |
| UI-007 | Move the shared-chrome strings from `LanguageContext` into `messages/{ar,en}.json` and switch components to `useTranslations` (one namespace per page, no copy changes) | P1 | 3 | — | ⬜ |
| UI-008 | Tokenise the remaining colour literals: `rgba(...)` values (83) and inline hex in TSX (56), with the visual gate as proof | P2 | 3 | — | ⬜ |
| ENG-014 | `hreflang` + canonical metadata for every public page; `sitemap.ts` and `robots.ts` | P2 | 2 | — | ⬜ |

## Technical Tasks

1. **Migration baseline** — dump local + remote (from Sprint 00) → `supabase/migrations/20261025000000_baseline.sql`; `supabase migration repair --status applied` on remote; `supabase db reset` reproduces the schema.
2. **Seed** — fictional members/events/registrations in `supabase/seed.sql` (no real personal data).
3. **Staging** — new Supabase project `sdc-staging`; Vercel Preview → staging DB, Production → production DB; matrix in [environments](../../../08-infrastructure/environments.md).
4. **Tokens** — move every hex value from the 16 CSS files into primitive tokens, map them to semantic tokens ([colors](../../../10-design-system/foundations/colors.md)) and replace values in CSS **without changing computed values** (the visual check proves it).
5. **Locale routing** — `src/i18n/` + locale detection in `proxy.ts`; Arabic keeps its unprefixed URLs and English lives under `/en` (ADR-010, so no existing URL changes); remove the client-side `dir` flip (no flash).
6. **Typed DB** — run `npm run db:types` in CI and fail on drift.

Every story also follows the [standard vertical-slice tasks](../../work-breakdown-structure.md#3-standard-tasks-per-story-vertical-slice) and the [Definition of Done](../../definition-of-done.md).

## Dependencies

| Dependency | Source | Status |
| ---------- | ------ | ------ |
| Remote schema dump | Sprint 00 FND-003 | Pending |
| Rights to create the staging project | Supabase org owner | Pending |

## Acceptance Criteria

- [x] `npx supabase db reset` + seed gives a working local app.
- [ ] Staging deploys automatically from `develop`.
- [x] `/events` (Arabic, unprefixed per ADR-010) renders RTL from the server (no flash); `/en/events` LTR; visual check unchanged.
- [x] No raw hex values in new code (lint rule on `src/modules`, `src/components/ui`, dashboard routes).
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
| Config, baseline, seed | Complete `config.toml`; baseline migration and synthetic seed apply cleanly from empty (`supabase start` verified); pgTAP runs against it |
| Tokens | `src/styles/primitives.css` (generated, 76 colours) + `tokens.css` (semantic, both themes) + Tailwind `@theme`; **0 pixel difference** across 96 baselines |
| Locale routing | `app/[locale]`, `proxy.ts`, locale-aware `Link`/`useRouter`, branded 404 catch-all, the language toggle moves between `/events` and `/en/events` |
| Env | `src/lib/env.ts` (Zod) used by the Supabase client; 3 tests |
| UI primitives | Button (disabled-with-reason), Badge, Card, Field (a11y wiring), Alert, Skeleton, Dialog (native `<dialog>`) |

### Known Gaps
| Gap | Notes / follow-up |
| --- | ----------------- |
| Remote baseline comparison and `migration repair` | Deferred with the Supabase production check (owner, 2026-10-02) |
| Staging project, Vercel environments | Need the account owners (Sprint 00 FND-005) |
| Chrome strings still in `LanguageContext` | UI-007 |
| `rgba` and inline-TSX colours not tokenised | UI-008 |
