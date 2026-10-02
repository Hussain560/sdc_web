# ADR-001 — Application Architecture: Server-First Next.js Modular Monolith

| Field | Value |
| ----- | ----- |
| **Status** | Accepted — framework upgrade implemented 2026-10-02 (Next.js 16.3.8, React 19.3); server-first module structure still to be built (Phase 1–2) |
| **Date** | 2026-10-02 |
| **Deciders** | Tech lead, product owner (Q-001) |
| **Related** | [Target architecture](../04-architecture/target-architecture.md), ADR-002, ADR-008, NFR-PERF-*, NFR-SEC-002 |

## Context
The current app is Next.js 14.2 (App Router) where every page is a Client Component that either renders hardcoded data or queries Supabase from the browser; the browser is the trust boundary. The team is small and volunteer-based; the infrastructure baseline is Vercel + Supabase (D-002). The repository's `AGENTS.md` refers to a newer Next.js major than the one installed.

## Decision
Build SDC as **one Next.js application** using the App Router in a **server-first** style, organized into **domain modules** (`src/modules/*`), with Supabase as backend (ADR-002):

- Server Components for reads; Server Actions for app mutations; Route Handlers only for machine endpoints (webhooks, cron, exports).
- Business integrity and row-level authorization in PostgreSQL (constraints, RLS, transactional functions); orchestration and side effects in server modules.
- Client Components only for interactivity.
- **Upgrade to the latest stable Next.js major** (and matching React) at the start of Phase 1, before server-side patterns are introduced, and regenerate `AGENTS.md` accordingly.
- Node.js runtime on Vercel (no Edge runtime).

## Alternatives considered
| Option | Pros | Cons | Why not chosen |
| ------ | ---- | ---- | -------------- |
| Keep client-only SPA style + harden RLS | Smallest change | No SEO/OG for content, browser-side orchestration of emails, harder authorization at app level | Fails NFR-PERF/SEO and keeps side effects in the browser |
| Separate backend API (NestJS/Express) + Next.js frontend | Clear API layer | Two deployables, duplicated auth, more infra; disproportionate | PP-4 (simple over clever) |
| Supabase Edge Functions as the business layer | Close to DB | Deno split toolchain, cold starts, harder testing, less Next integration | Server Actions + SQL functions cover the needs |
| Stay on Next.js 14 | No upgrade work | Older major; scaffold docs mismatch; newer caching/proxy conventions unavailable | Upgrade is cheapest now, while pages are simple (R-012) |

## Reasoning
One deployable, one language (TypeScript), one auth context; the database guarantees integrity regardless of app bugs; fits free tiers and volunteer maintenance.

## Consequences
- Positive: SSR content and metadata; server-side authorization; testable modules; fewer moving parts.
- Negative: Every existing page is rewritten from client data-fetching to server reads (visual CSS kept).
- Follow-up: Phase 1 upgrade + module skeleton; ESLint boundary rules; `server-only` enforcement.
