# Principles

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Community principles

These describe how the community operates; product decisions must not contradict them.

| # | Principle | Implication for the platform |
| - | --------- | ---------------------------- |
| CP-1 | **Non-profit and free** | No paid features. Free events. Cost-conscious infrastructure. |
| CP-2 | **Arabic-first, bilingual** | Arabic is the default language and the reference copy; English must be complete, not partial. |
| CP-3 | **Volunteer-run** | Workflows must be simple, recoverable and documented; people rotate roles. |
| CP-4 | **Fair and transparent participation** | Membership through an announced, time-boxed intake open to all eligible applicants; decisions are recorded. |
| CP-5 | **Knowledge sharing** | Content is publicly readable unless there is a reason not to be. |
| CP-6 | **Respect for members' privacy** | Members choose what appears publicly; contact details are never public by default. |

## 2. Product principles

| # | Principle | In practice |
| - | --------- | ----------- |
| PP-1 | **The database is the source of truth for dynamic data** | Events, articles, members, committees, leadership and roles live in PostgreSQL — never in source files. |
| PP-2 | **Authorization is enforced where it cannot be bypassed** | Row Level Security and server-side checks. Hiding a button is a UX concern, not security. |
| PP-3 | **Server-first rendering** | Public pages render on the server with real metadata (SEO, social sharing); client components only where interaction requires them. |
| PP-4 | **Simple over clever** | One Next.js application + Supabase. No microservices, queues or extra databases without a demonstrated need. |
| PP-5 | **Every rule has one home** | A business rule is implemented once (database constraint, RLS policy or one server module) and referenced, never re-typed in several places. KFUCS's drifting role arrays are the cautionary example (see [98-reference](../98-reference/reference-projects.md)). |
| PP-6 | **State changes are explicit and auditable** | Lifecycle transitions go through named operations that validate the transition and write an audit entry. |
| PP-7 | **Accessible by default** | WCAG 2.1 AA for public pages; keyboard and screen-reader support in both directions (RTL/LTR). |
| PP-8 | **Documented before built** | Requirements, rules and data model are documented and reviewed before implementation (this foundation). |

## 3. Engineering principles

Summarized from [07-engineering](../07-engineering/README.md):

- Every change is a reviewed pull request that passes CI.
- Every schema change is a migration; no manual production edits.
- Every release is tagged with a semantic version and release notes.
- Secrets never enter the repository or the browser bundle.
