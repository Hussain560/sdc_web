# Releases

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

Release records live here as `vX.Y.Z.md`, created from [`_template.md`](./_template.md) by the release owner. Strategy: [versioning and releases](../../07-engineering/versioning-and-releases.md). Version plan: [§2 of that document](../../07-engineering/versioning-and-releases.md#2-version-plan-aligned-with-the-roadmap).

## Release index

| Version | Milestone | Date | Record |
| ------- | --------- | ---- | ------ |
| — | — | — | No releases yet. The first tag (`v0.1.0`) is created only after the strategy is approved and Phase 0 exits. |

## Unreleased (since the 2026-10-02 baseline)

Will be grouped into the first tags once the Git repository is reconciled (Q-024).

| Type | Change |
| ---- | ------ |
| docs | Foundation documentation set (`docs/`), including internal screen blueprints |
| build | Next.js 14.2 → 16.3.8, React 18 → 19.3, Supabase JS 2.117, lucide 1.49, Supabase CLI 2.119 |
| refactor | JavaScript → TypeScript 5.9 (`strict`), typed contexts and Supabase client with generated DB types |
| build | ESLint 9 + `eslint-config-next` 16 working; Tailwind v4 configured; `.nvmrc`, `engines`, `.env.example`, `tsconfig.json` |
| docs | ADR-012: events follow the KFUCS model and 4-step wizard; public screen blueprints; sprint plans 00–13; action board |
| chore | Agent skills (`.agents/skills`, `skills-lock.json`) and project rules in `AGENTS.md` (frozen identity, D-009) |
| chore | Removed unused `events.json`, `articlesData.json`, `Breadcrumb` component |

Verification: production build passes; `typecheck` 0 errors; `lint` 0 errors; public pages visually identical (computed-style comparison, 14 page/theme combinations).
