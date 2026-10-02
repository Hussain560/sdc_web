# ADR-007 — CI/CD with GitHub Actions and Tag-Based Production Deploys

| Field | Value |
| ----- | ----- |
| **Status** | Proposed |
| **Date** | 2026-10-02 |
| **Related** | [CI/CD](../08-infrastructure/ci-cd.md), [deployment](../08-infrastructure/deployment.md), [versioning](../07-engineering/versioning-and-releases.md) |

## Context
No CI exists. Vercel's Git integration can deploy every push, but production must only receive tagged releases (Innosoft tag standard) and database migrations must be applied before the app version that needs them.

## Decision
- **GitHub Actions** runs all checks on PRs (lint, typecheck, unit, DB tests with local Supabase, build, conditional E2E, audit, commitlint) as required status checks.
- **Vercel Git integration** for previews and staging (`develop`).
- **Production deploys** run from a GitHub Actions workflow on release tags with environment approval: backup → `supabase db push` → `vercel deploy --prebuilt --prod` → smoke tests. Vercel auto-deploy for `main` is disabled.
- **release-please** automates version bumps, changelog and tags from Conventional Commits.

## Alternatives considered
| Option | Why not chosen |
| ------ | -------------- |
| Vercel auto-deploy on `main` + separate migration job | Race between migration and deploy; deploys untagged commits |
| GitLab CI (Innosoft templates) | SDC baseline is GitHub |
| Manual deploys | Error-prone, not auditable |

## Consequences
- Deterministic, auditable releases; migrations precede code.
- Requires Vercel token and Supabase access token as GitHub environment secrets.
- Slightly slower production path (acceptable).
