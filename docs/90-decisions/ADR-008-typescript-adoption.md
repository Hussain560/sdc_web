# ADR-008 — Adopt TypeScript (Strict)

| Field | Value |
| ----- | ----- |
| **Status** | Accepted — implemented 2026-10-02 (all app code converted; `strict` + `noUncheckedIndexedAccess`; 0 errors) |
| **Date** | 2026-10-02 |
| **Related** | NFR-MAINT-001, TD-052, [coding standards](../07-engineering/coding-standards.md) |

## Context
The app is JavaScript (~25 files); `typescript` is a dev dependency but unused; no `tsconfig`. The rebuild introduces a typed data layer (generated Supabase types), Zod schemas and many server modules.

## Decision
Adopt TypeScript with `strict: true` for all application code. New files are `.ts/.tsx`; existing `.js` files are converted when rewritten (most pages are rewritten in Phases 2–3 anyway). Generated database types are committed and checked in CI.

## Alternatives considered
| Option | Why not chosen |
| ------ | -------------- |
| Stay on JavaScript + JSDoc | Weak guarantees for the data/permission layer; no generated-type benefits |
| Big-bang conversion first | Wasted effort on code that will be rewritten |

## Implementation note (2026-10-02)
TypeScript **5.9** is used, not 7.0 (the latest release): `typescript-eslint`, required by `eslint-config-next`, supports TypeScript `>=4.8.4 <6.1.0`. Revisit when `typescript-eslint` supports TS 7. Database types are generated with `npm run db:types` into `src/lib/supabase/database.types.ts`.

## Consequences
- Type errors caught in CI; safer refactors by rotating volunteers.
- Small learning curve for contributors new to TypeScript.
