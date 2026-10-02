# ADR-003 — Database Migration Strategy

| Field | Value |
| ----- | ----- |
| **Status** | Proposed |
| **Date** | 2026-10-02 |
| **Related** | [Migration strategy](../05-database/migration-strategy.md), NFR-REL-004, TD-010, R-003 |

## Context
The schema exists only as a destructive seed script; there are no migrations; the remote project's schema is unknown and possibly diverged; real data exists remotely.

## Decision
Use **Supabase CLI SQL migrations** (`supabase/migrations`) as the only way to change schema, forward-only, applied by CI to staging on merge and to production on release after a backup. Adopt the legacy remote schema via a **baseline migration** marked as applied (`migration repair`), then evolve with **expand → migrate → contract**. RLS, grants and comments are part of each table's migration. pgTAP tests accompany schema changes. Synthetic `seed.sql` for local/preview only.

## Alternatives considered
| Option | Why not chosen |
| ------ | -------------- |
| ORM migrations (Prisma/Drizzle) | Second schema source; weak support for RLS/policies/functions which are central here |
| Dashboard edits + periodic dumps | Not reviewable, not reproducible — the root cause of today's state |
| Recreate a fresh production project | Loses/complicates existing data and auth users |

## Consequences
- Reproducible environments; reviewable schema changes.
- Requires discipline: no Studio edits on shared environments (MG-10).
- Phase 0/1 work: dump remote, baseline, repair history.
