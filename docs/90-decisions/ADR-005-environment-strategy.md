# ADR-005 — Environment Strategy

| Field | Value |
| ----- | ----- |
| **Status** | Proposed |
| **Date** | 2026-10-02 |
| **Related** | [Environments](../08-infrastructure/environments.md), Q-025, Q-027 |

## Context
Today: local stack + one remote project of unknown role; hosting unknown. Supabase Free allows two active projects; branching is paid. Vercel provides preview deployments per PR.

## Decision
Four environments with **two hosted Supabase projects**: **Local** (CLI/Docker), **Preview** (Vercel per PR, using the staging database), **Staging** (`develop` branch + `sdc-staging` project), **Production** (`main`/tags + `sdc-production` project). Schema changes are validated in CI against an ephemeral local stack, applied automatically to staging on merge, and to production only on a tagged, approved release.

## Alternatives considered
| Option | Why not chosen |
| ------ | -------------- |
| Production only (+ local) | No safe place to validate migrations with realistic deployment |
| Supabase Branching per PR | Paid feature; not needed at this scale |
| Separate preview database per PR | Exceeds free project limits |

## Consequences
- Previews may break when a PR depends on unmerged migrations (accepted).
- Staging may pause on the free tier when idle → keep-alive check.
- Requires confirming whether `sdc-members` is production (Q-025).
