# Non-Functional Requirements

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## NFR-SEC — Security

| ID | Requirement | P |
| -- | ----------- | - |
| NFR-SEC-001 | Every table in an API-exposed schema has RLS enabled and explicit, reviewed policies; no `USING (true)` policy on writable operations. | M |
| NFR-SEC-002 | Authorization is enforced in the database (RLS) and/or the server; UI visibility is never the only check. | M |
| NFR-SEC-003 | The service-role key and all provider secrets exist only in server environments (never in `NEXT_PUBLIC_*`, never in the repository). | M |
| NFR-SEC-004 | All input is validated on the server with shared schemas (types, lengths, formats, `https://` URLs, enums). | M |
| NFR-SEC-005 | Output is escaped by default; user-provided Markdown is sanitized; no `dangerouslySetInnerHTML` with user data. | M |
| NFR-SEC-006 | No account enumeration via sign-up, sign-in or reset responses. | M |
| NFR-SEC-007 | Security headers: CSP, `frame-ancestors 'none'`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS (production). | S |
| NFR-SEC-008 | Uploads: allow-listed MIME types, size limits, server-generated paths, private buckets for non-public files. | M |
| NFR-SEC-009 | Rate limiting on auth (Supabase Auth limits configured) and on public write endpoints (registration, applications). | S |
| NFR-SEC-010 | Dependencies scanned in CI (npm audit / Dependabot); critical vulnerabilities block release. | S |
| NFR-SEC-011 | Edge Functions/route handlers that perform privileged actions verify the caller's JWT and permissions. | M |

## NFR-PRIV — Privacy and data protection

| ID | Requirement | P |
| -- | ----------- | - |
| NFR-PRIV-001 | Personal data is classified (public / internal / restricted) and every field has a classification ([data protection](../06-security/data-protection-and-privacy.md)). | M |
| NFR-PRIV-002 | Email and phone are never public; directory visibility is opt-in per member. | M |
| NFR-PRIV-003 | Forms collecting personal data show a privacy notice and record consent with timestamp and notice version. | M |
| NFR-PRIV-004 | Exports of personal data are restricted and audited. | M |
| NFR-PRIV-005 | Retention rules for applications, registrations and logs are defined and implemented (**OPEN Q-031**). | S |
| NFR-PRIV-006 | Production data is not copied into local/preview environments; seed data is synthetic. | M |

## NFR-PERF — Performance

| ID | Requirement | P |
| -- | ----------- | - |
| NFR-PERF-001 | Public pages meet Core Web Vitals "good" on mobile at the 75th percentile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. | S |
| NFR-PERF-002 | Public list/detail pages are statically rendered or cached and revalidated on content change (no per-request database query for anonymous traffic where avoidable). | S |
| NFR-PERF-003 | First-load JS for public pages ≤ the current ~170 kB baseline; client components only where interaction requires. | S |
| NFR-PERF-004 | Internal dashboards respond in ≤ 1 s for typical data sizes (hundreds of members, tens of events/year). | S |
| NFR-PERF-005 | Images served through `next/image` (or equivalent) with correct sizes; fonts via `next/font`. | S |

## NFR-A11Y — Accessibility

| ID | Requirement | P |
| -- | ----------- | - |
| NFR-A11Y-001 | WCAG 2.1 AA for all public pages and the main internal flows, in both directions (RTL/LTR) and both themes. | M |
| NFR-A11Y-002 | Full keyboard operation; visible focus; modals trap focus, close on Escape and restore focus. | M |
| NFR-A11Y-003 | All icon-only controls have accessible names; images have meaningful `alt` or are decorative. | M |
| NFR-A11Y-004 | Color is never the only carrier of status (badges have text). Contrast ≥ 4.5:1 for text. | M |
| NFR-A11Y-005 | Automated accessibility checks (axe) run in E2E tests for key pages. | S |

## NFR-I18N — Internationalization

| ID | Requirement | P |
| -- | ----------- | - |
| NFR-I18N-001 | Arabic (default, RTL) and English (LTR) for every user-facing string, including emails, errors, 404 and dashboards. | M |
| NFR-I18N-002 | The server renders the correct `lang` and `dir` on first response (no client-side switch flash). | M |
| NFR-I18N-003 | UI strings live in message catalogues, not inline conditionals. | M |
| NFR-I18N-004 | Dates/times stored in UTC (`timestamptz`), displayed in Asia/Riyadh, formatted per locale. | M |
| NFR-I18N-005 | Layout uses logical CSS properties (`margin-inline-start`, `inset-inline-end`) so one stylesheet serves both directions. | S |
| NFR-I18N-006 | Bilingual content fields require Arabic; English falls back to Arabic with a visible language hint when missing. | S |

## NFR-REL — Reliability and data integrity

| ID | Requirement | P |
| -- | ----------- | - |
| NFR-REL-001 | Referential integrity enforced by foreign keys; domain values by CHECK constraints; uniqueness by unique indexes. | M |
| NFR-REL-002 | Multi-step operations (accept application → create member) are atomic (single transaction / database function). | M |
| NFR-REL-003 | Production database backed up daily (Supabase plan backups and/or scheduled logical dump to private storage) with a tested restore procedure. | M |
| NFR-REL-004 | Every schema change is a migration applied identically to all environments. | M |
| NFR-REL-005 | Email failures are recoverable (logged, retryable) and never corrupt business state. | M |

## NFR-MAINT — Maintainability

| ID | Requirement | P |
| -- | ----------- | - |
| NFR-MAINT-001 | TypeScript (strict) for application code; generated database types. | M |
| NFR-MAINT-002 | ESLint + Prettier + type-check pass in CI on every PR. | M |
| NFR-MAINT-003 | Each business rule implemented in one place (see [business rules](../03-business-domain/business-rules.md) enforcement column). | M |
| NFR-MAINT-004 | Documentation updated in the same PR as behaviour changes. | M |
| NFR-MAINT-005 | No new runtime dependency without justification in the PR description. | S |

## NFR-OPS — Operations

| ID | Requirement | P |
| -- | ----------- | - |
| NFR-OPS-001 | Three environments: local, preview/staging, production ([environments](../08-infrastructure/environments.md)). | M |
| NFR-OPS-002 | Production deploys only from tagged commits on `main` that passed CI. | M |
| NFR-OPS-003 | Server errors are logged with request context (no secrets/PII in logs). | M |
| NFR-OPS-004 | An uptime check alerts maintainers if the site or database is down/paused. | S |
| NFR-OPS-005 | At least two people hold administrative access to every production service. | M |

## NFR-COST — Cost

| ID | Requirement | P |
| -- | ----------- | - |
| NFR-COST-001 | Runs on free tiers unless leadership approves spend (**OPEN Q-017**). | M |
| NFR-COST-002 | Free-tier usage (database size, egress, function invocations, email quota) reviewed monthly. | S |
