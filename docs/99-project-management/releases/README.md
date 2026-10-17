# Releases

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-17 |
| **Status**       | Living      |

Release records live here as `vX.Y.Z.md`, created from [`_template.md`](./_template.md) by the release owner. Strategy: [versioning and releases](../../07-engineering/versioning-and-releases.md). Version plan: [§2 of that document](../../07-engineering/versioning-and-releases.md#2-version-plan-aligned-with-the-roadmap).

## Release index

| Version | Milestone | Date | Record |
| ------- | --------- | ---- | ------ |
| v1.1.0 | M9 | not scheduled | [draft](v1.1.0.md) — public redesign, built, not tagged |
| v1.0.0 | M8 | planned 2027-04-10 | [draft](v1.0.0.md) — candidates `v1.0.0-rc.1` and `v1.0.0-rc.2` exist on both repositories; `v1.0.0` not tagged |

No stable version is tagged yet. `main` on both remotes is still the baseline commit; the platform lives on `develop` and `release/v1.0.0`. The owner decides how `v1.0.0` and `v1.1.0` are cut (see the [action board](../action-board.md), item 3).

## Unreleased on `develop` (since `v1.0.0-rc.2`)

| Type | Change |
| ---- | ------ |
| feat | Design System v2: tokens, self-hosted fonts, every component, floating header and footer, split auth layout, developer-only gallery at `/design-gallery` (PR #2) |
| feat | Public pages on v2: Home, event page with registration dialog (1.5 s feedback floor) and calendar export, check-in, members with per-field consent, events list, articles, committees, About, Join, certificate, privacy, 404 (PR #3) |
| feat | New registration form: name parts, occupation, international phone |
| feat | About and Events list second pass: figures, marquee, values rows, spotlight card, filter card, scroll motion (PR #4) |
| feat(db) | Migrations `20270401…` to `20270408…`: public stats, event public v2, directory consent, member consent RPC, check-in hardening, guest name parts and occupation |
| refactor | Legacy Header, Footer and all public CSS deleted; the colour-literal allowlist is empty |
| ci | `check:tokens` and `check:contrast` added to `npm run check` and CI |
| docs | ADR-014, Design System v2 documents, public page specs, sprints 14–16 |
| chore(db) | `supabase/dev-env-seed.sql` (untracked): team accounts and sample data for the hosted develop project |

Verification at PR #4: `npm run check` passes (455 unit tests, 84 contrast pairs); pgTAP files 00–18. The visual baselines for `/about` and `/events` are outdated until the owner approves an update.
