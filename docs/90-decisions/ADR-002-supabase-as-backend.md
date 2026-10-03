# ADR-002 — Supabase as the Backend Platform

| Field | Value |
| ----- | ----- |
| **Status** | Accepted (stakeholder baseline D-002, D-003) |
| **Date** | 2026-10-02 |
| **Deciders** | Stakeholders |
| **Related** | [05-database](../05-database/README.md), [authentication](../06-security/authentication.md), ADR-003, ADR-004 |

## Context
The project already uses Supabase (PostgreSQL 17, GoTrue Auth, Storage, Edge Functions) with a local Docker stack and a linked remote project. The stakeholder brief fixes Supabase PostgreSQL as the primary database.

## Decision
Use Supabase for **PostgreSQL (with RLS), Auth, and Storage**. Use it through `@supabase/ssr` on the server. **Edge Functions are not used by default** (see [server logic](../04-architecture/server-logic-and-data-access.md#1-where-does-logic-go-decision-matrix)); existing functions are retired. Realtime is not used unless a requirement appears.

## Alternatives considered
| Option | Why not chosen |
| ------ | -------------- |
| Neon/other Postgres + Auth.js | Re-implements what Supabase already provides and is already in use |
| Firebase | Not relational; poor fit for RLS-style authorization and reporting |

## Reasoning
Relational integrity, RLS for defense in depth, built-in Auth with SSR support, Storage, generous free tier, local parity via CLI, and portability (open-source Postgres).

## Consequences
- Business rules live in SQL migrations and are portable.
- The team must be competent in SQL/RLS; pgTAP tests are required.
- Free-tier constraints (project pausing, backups) must be handled operationally ([operations](../08-infrastructure/operations.md)).
