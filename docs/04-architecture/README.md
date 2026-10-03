# 04 — Architecture

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## Documents

| Document | Contents |
| -------- | -------- |
| [current-architecture.md](./current-architecture.md) | As-is: browser-centric app talking directly to Supabase |
| [target-architecture.md](./target-architecture.md) | To-be: system context, containers, layers, responsibilities, request flows |
| [frontend-architecture.md](./frontend-architecture.md) | Routing, server/client boundaries, i18n, theming, state, project structure |
| [server-logic-and-data-access.md](./server-logic-and-data-access.md) | Where logic lives (RLS, DB functions, Server Actions, Route Handlers, Edge Functions), validation, errors, logging |
| [email-architecture.md](./email-architecture.md) | Transactional email design: provider abstraction, outbox/log, retries, templates, local Mailpit |

Authentication and authorization designs live in [06-security](../06-security/README.md); database design in [05-database](../05-database/README.md); deployment in [08-infrastructure](../08-infrastructure/README.md).

## Architecture decisions

| ADR | Title | Status |
| --- | ----- | ------ |
| [ADR-001](../90-decisions/ADR-001-application-architecture.md) | Application architecture: Next.js modular monolith, server-first | Accepted (upgrade done) |
| [ADR-002](../90-decisions/ADR-002-supabase-as-backend.md) | Supabase as backend platform | Accepted (stakeholder baseline) |
| [ADR-006](../90-decisions/ADR-006-email-provider.md) | Transactional email provider | Proposed |
| [ADR-008](../90-decisions/ADR-008-typescript-adoption.md) | TypeScript adoption | Accepted (implemented) |
| [ADR-009](../90-decisions/ADR-009-styling-and-design-tokens.md) | Styling and design tokens | Proposed (Tailwind configured) |
| [ADR-010](../90-decisions/ADR-010-i18n-routing.md) | Locale routing | Proposed |
