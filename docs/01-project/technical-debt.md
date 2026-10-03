# Technical Debt Register

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

Each item references evidence in the [current-system audit](./current-system-audit.md) and names the roadmap phase that retires it. Severity: **C** critical, **H** high, **M** medium, **L** low. Phases: see [roadmap](../99-project-management/roadmap.md).

## Security debt

| ID | Debt | Severity | Retired in |
| -- | ---- | -------- | ---------- |
| TD-001 | `members` writable by `anon` (`FOR ALL USING (true)`) | C | Phase 0 containment (if production affected) → Phase 1 |
| TD-002 | `event_registrations` readable and updatable by anyone | C | Phase 0 containment → Phase 1 |
| TD-003 | Email Edge Functions are an unauthenticated open relay with HTML injection | C | Phase 0 containment → Phase 3 (email redesign) |
| TD-004 | Committee authorization is a client-side email array (and leaks a personal email) | H | Phase 2 |
| TD-005 | `check-email-exists` enables account enumeration and scans all users | M | Phase 2 (removed) |
| TD-006 | Default table grants (incl. TRUNCATE) to `anon`/`authenticated` never revoked | M | Phase 1 |
| TD-007 | No security headers (CSP, frame-ancestors, referrer policy) | M | Phase 5 |
| TD-008 | Validation (name, password) only in the browser | M | Phase 2 |

## Data and database debt

| ID | Debt | Severity | Retired in |
| -- | ---- | -------- | ---------- |
| TD-010 | No migrations; schema defined by a destructive seed script | H | Phase 1 |
| TD-011 | No foreign keys; `event_registrations.event_id` points to hardcoded ids | H | Phase 1 (+ data migration Phase 3) |
| TD-012 | No unique `(event_id, user_id)` → duplicate registrations possible | H | Phase 1 |
| TD-013 | Status as unconstrained `varchar` | M | Phase 1 |
| TD-014 | `members` not linked to `auth.users`; no `profiles` table | H | Phase 1–2 |
| TD-015 | Taxonomy (university, major, status, track) as duplicated free text in two languages | M | Phase 3 |
| TD-016 | `config.toml` missing auth/db/storage configuration | M | Phase 1 |
| TD-017 | Remote project state unknown; possible drift from local | H | Phase 0 (inspect) → Phase 1 (baseline migration) |

## Application debt

| ID | Debt | Severity | Retired in |
| -- | ---- | -------- | ---------- |
| TD-020 | Events hardcoded and duplicated (summary ×2, detail ×1, fictional ×1 unused) | H | Phase 3 |
| TD-021 | Articles hardcoded and duplicated (list ×2, detail ×1, JSON unused) | H | Phase 3 |
| TD-022 | Leadership and committee heads hardcoded; `MEMBER_IDS_SHOWN_ABOVE` | H | Phase 2–3 |
| TD-023 | Registration flow implemented three times | M | Phase 3 |
| TD-024 | All pages are Client Components; no server data, no per-page metadata | M | Phase 1 (pattern) → Phase 3 (pages) |
| TD-025 | Browser-only Supabase session (no SSR cookies / middleware) | H | Phase 2 |
| TD-026 | Member-vs-visitor detection by full-name string match | M | Phase 3 |
| TD-027 | Unknown detail ids fall back to another item instead of 404 | M | Phase 3 |
| TD-028 | Dates and statuses stored as display strings | H | Phase 3 |
| TD-029 | Header search routes to a non-existent `/search` | L | Phase 3 (pending **OPEN Q-023**) |
| TD-030 | Login ignores `?redirect=` | L | Phase 2 |
| TD-031 | Dead code: `events.json`, `articlesData.json`, `Breadcrumb.jsx`, contact modal, `/members/all` | L | **Partly retired 2026-10-02** (files removed; contact modal and `/members/all` redirect kept) |
| TD-032 | i18n: client-side `dir/lang`, inline ternaries, Arabic-only 404 | M | Phase 1 (approach) → Phase 3 |

## Styling / design debt

| ID | Debt | Severity | Retired in |
| -- | ---- | -------- | ---------- |
| TD-040 | Global CSS class collisions across files | M | Phase 1 (approach), progressive |
| TD-041 | No design tokens; light theme as per-class hex overrides | M | Phase 1 (tokens) → progressive |
| TD-042 | Tailwind installed and imported but non-functional | L | **Retired 2026-10-02** (configured; [ADR-009](../90-decisions/ADR-009-styling-and-design-tokens.md)) |
| TD-043 | 80 inline styles, 64 `!important`, 8 ad-hoc breakpoints | L | Progressive |
| TD-044 | Accessibility gaps (labels, focus, modals, contrast unverified) | M | Phase 3–5 |
| TD-045 | `<img>` without `next/image`; filenames with spaces; external placeholder images | L | Phase 3 |

## Tooling and process debt

| ID | Debt | Severity | Retired in |
| -- | ---- | -------- | ---------- |
| TD-050 | Not a Git repository locally; canonical repository unknown | H | Phase 0 |
| TD-051 | ESLint not installed; lint script broken | M | **Retired 2026-10-02** (`npm run lint`, 0 errors) |
| TD-052 | No TypeScript despite dependency | M | **Retired 2026-10-02** ([ADR-008](../90-decisions/ADR-008-typescript-adoption.md)) |
| TD-053 | No tests | H | Phase 1 (harness) → every phase |
| TD-054 | No CI/CD | H | Phase 1 |
| TD-055 | No Node version pin (`.nvmrc`/`engines`) | L | **Retired 2026-10-02** |
| TD-056 | `AGENTS.md` describes a Next.js version that is not installed | L | **Retired 2026-10-02** (Next 16 installed; its bundled docs now exist) |
| TD-057 | Email via personal-style Gmail SMTP with app password | H | Phase 3 ([ADR-006](../90-decisions/ADR-006-email-provider.md)) |
