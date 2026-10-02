# Gap Analysis

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

Gap size: **●●●** large (new capability or full rebuild), **●●○** medium (exists but must be redesigned), **●○○** small (exists, needs hardening).

## 1. Functional capabilities

| Capability | Current | Target | Gap | Requirements |
| ---------- | ------- | ------ | --- | ------------ |
| Public home / about | Hardcoded, client-rendered | Server-rendered, content from DB/config, per-page metadata | ●●○ | FR-PUB-* |
| Account sign-up/sign-in/reset | Works (browser-only session) | SSR cookie session, server validation, no enumeration, profile row | ●●○ | FR-AUTH-* |
| Membership intake (annual join page) | **Does not exist** | Cycles that open/close, application form, review, decisions, emails | ●●● | FR-MBR-* |
| Member records & directory | Table with free-text bilingual columns, unlinked to accounts, publicly writable | Linked to account, controlled visibility, self-editable profile, taxonomy lookups | ●●● | FR-MEM-* |
| Leadership & committees | Hardcoded names on members page | Committees, positions and terms in DB; public leadership view generated from role assignments | ●●● | FR-CMT-* |
| Events | Hardcoded, duplicated, string dates | DB entity with lifecycle (draft → review → published → completed/cancelled), committee ownership | ●●● | FR-EVT-* |
| Event registration | Insert from browser, no uniqueness, open policies | One registration per user per event, windows, capacity, review, cancellation, attendance | ●●○ | FR-REG-* |
| Registration review | One global reviewer by email list | Committee-scoped reviewers via RBAC; audit trail; bulk actions | ●●○ | FR-REG-* |
| Articles / threads | Hardcoded | DB entity with draft → review → published → archived; bilingual; authors; tags | ●●● | FR-ART-* |
| Notifications | Browser-triggered unauthenticated Edge Functions, Gmail | Server-triggered, templated, logged, retryable, domain-authenticated provider | ●●● | FR-NOT-* |
| Reports & statistics | None | Community dashboard (leadership/founders), committee dashboard | ●●● | FR-RPT-* |
| Administration | None | Users, role assignments, committees, intake cycles, audit log | ●●● | FR-ADM-* |

## 2. Cross-cutting

| Area | Current | Target | Gap |
| ---- | ------- | ------ | --- |
| Authorization | Client-side email array | RBAC + committee scope + ownership, enforced by RLS and server checks | ●●● |
| Database integrity | 2 tables, no FKs/constraints/indexes | Normalized schema, FKs, CHECKs, unique keys, indexes, audit fields | ●●● |
| Migrations | None | Versioned `supabase/migrations`, applied by CI to each environment | ●●● |
| Security | Critical exposures | Threat-modelled controls ([security model](../06-security/security-model.md)) | ●●● |
| Privacy | Registrant PII public | PII classified, minimum exposure, consent text, retention rules | ●●● |
| Rendering | Client-only | Server Components by default, client islands | ●●○ |
| i18n | Client-side toggle | Locale-aware SSR (`lang`/`dir` on first byte), complete dictionaries | ●●○ |
| Design system | Visual style without tokens | Tokens, component library, documented patterns | ●●○ |
| Accessibility | Not considered | WCAG 2.1 AA target, automated checks | ●●○ |
| Testing | None | Unit + integration (incl. RLS) + E2E smoke | ●●● |
| CI/CD | None | PR checks, preview deploys, migration pipeline, tagged releases | ●●● |
| Environments | Local + unknown remote | Local → Preview/Staging → Production with documented promotion | ●●○ |
| Observability | `console.error` | Structured server logs, email log, audit log, uptime check | ●●○ |
| Documentation | Minimal README | This doc set | ●○○ (after Phase 0) |
