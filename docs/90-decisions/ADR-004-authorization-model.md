# ADR-004 — Authorization: RBAC + Committee Scope + Ownership, Enforced by RLS

| Field | Value |
| ----- | ----- |
| **Status** | Proposed |
| **Date** | 2026-10-02 |
| **Related** | [Authorization model](../06-security/authorization-model.md), [permission catalog](../06-security/permission-catalog.md), [RLS model](../05-database/rls-security-model.md), D-004, Q-003, Q-005, Q-006, Q-032 |

## Context
Authorization today is a hardcoded email array checked in the browser; data is unprotected. SDC's organization has global positions (founders, leader, advisor) and committee-scoped positions (heads, deputies, members) that change over time (terms). The KFUCS reference used one role column + one committee per user and hardcoded role arrays, which its own audit found drifting (F-53, F-10, F-51).

## Decision
1. **Permissions** (`resource.action`) are the unit of authorization; **roles** bundle permissions; **role assignments** bind a user to a role with an optional **committee scope** and a **term** (`starts_at`/`ends_at`).
2. Role assignments are also the **single source of truth for organizational positions** (public leadership display).
3. **Ownership** rules (own registration, application, profile, draft) are expressed directly in RLS.
4. Enforcement at **two layers**: server (`requirePermission`) and **database RLS** via `private.has_permission(permission, committee)` — the database is authoritative. UI visibility is UX only.
5. Permissions evaluated **fresh per request** in the database (no permission claims in JWT).
6. Guards: anti-escalation, last-admin, self-assignment prohibition, membership prerequisite for committee roles.

## Alternatives considered
| Option | Why not chosen |
| ------ | -------------- |
| Single role column + committee_id (KFUCS) | Cannot express multiple positions or term history; leads to hardcoded role arrays |
| Roles-only checks in code (`role in [...]`) | Drift; changing capabilities requires code changes |
| JWT custom claims via Auth hook | Stale permissions until token refresh; extra complexity for little gain at SDC's scale |
| Full ABAC/policy engine (e.g., OPA) | Over-engineering |

## Consequences
- One place to change what a role may do (`role_permissions` seed).
- Requires pgTAP coverage of the policy matrix and careful performance practices in RLS.
- Phase 2 builds tables, helpers, admin UI for assignments, and migrates the current reviewer and hardcoded leadership into assignments (Q-039).
