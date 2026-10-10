# 90 — Decisions

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft      |

## 1. Contents

| Document | Purpose |
| -------- | ------- |
| This README | Decision log (D-nnn) and ADR index |
| [open-questions.md](./open-questions.md) | Central, prioritized list of unresolved questions (Q-nnn) and working assumptions (A-nnn) |
| [_template.md](./_template.md) | ADR template |
| `ADR-NNN-*.md` | Architecture Decision Records |

Process: [documentation standards §2](../07-engineering/documentation-standards.md#2-architecture-decision-records).

## 2. Decision log

Business, scope and process decisions that do not need a full ADR.

| ID | Decision | Source | Date | Affects |
| -- | -------- | ------ | ---- | ------- |
| D-001 | Joining the community is done **only** through a dedicated membership page that opens and closes for a limited window (about once a year); account registration (`/register`) does not create membership. | Stakeholder (project owner, in the foundation request) | 2026-10-02 | Membership module, [ADR-011](./ADR-011-membership-intake-separate-from-accounts.md) |
| D-002 | Infrastructure baseline is Vercel + Supabase + a free/low-cost transactional email provider + GitHub. | Stakeholder brief | 2026-10-02 | 08-infrastructure, ADR-002, ADR-005, ADR-006 |
| D-003 | Supabase PostgreSQL remains the primary database. | Stakeholder brief | 2026-10-02 | 05-database |
| D-004 | Hardcoded committee authorization is replaced by a database-backed authorization model. | Stakeholder brief | 2026-10-02 | ADR-004 |
| D-005 | Documentation is the source of truth; no core-application implementation before the foundation is reviewed. | Stakeholder brief | 2026-10-02 | All |
| D-006 | Local development uses the Supabase CLI stack in Docker with Mailpit for email. | Stakeholder brief + current setup | 2026-10-02 | 08-infrastructure |
| D-007 | SDC is a non-profit community platform: no SaaS, pricing, billing, or multi-tenancy concepts. | Stakeholder brief | 2026-10-02 | 00-product |
| D-008 | Event creation and the event/registration/attendance data and logic follow KFUCS (4-step wizard, sessions, certificates model). | Stakeholder (2026-10-02 follow-up) | 2026-10-02 | Events, Registrations — [ADR-012](./ADR-012-event-model-and-wizard-from-kfucs.md) |
| D-009 | **Superseded for public pages by [ADR-014](./ADR-014-public-redesign-design-system-v2.md) (Accepted, 2026-10-10).** The visual identity (colors, fonts, shapes, dark-first) is frozen; design skills and redesigns may refine layout and consistency but must not change tokens. | Stakeholder (2026-10-02 follow-up) | 2026-10-02 | 10-design-system, [AI agent skills](../07-engineering/ai-agent-skills.md) |
| D-010 | The canonical Git repository is `github.com/sdc-saudi/SDC_website`; the local working copy is newer and becomes the next commits on a branch. | Stakeholder (Q-024) | 2026-10-02 | 07-engineering |
| D-011 | Accounts exist only for members and staff. Visitors register for events, check in and receive certificates as guests, and apply for membership with a form; the account is created and activated by e-mail when the application is accepted. | Stakeholder (2026-10-03) | 2026-10-03 | Registrations, Attendance, Membership — [ADR-013](./ADR-013-accounts-for-members-only.md) |

## 3. ADR index

| ADR | Title | Status |
| --- | ----- | ------ |
| [ADR-001](./ADR-001-application-architecture.md) | Application architecture: server-first Next.js modular monolith | Accepted (upgrade done) |
| [ADR-002](./ADR-002-supabase-as-backend.md) | Supabase as the backend platform | Accepted |
| [ADR-003](./ADR-003-database-migration-strategy.md) | Database migration strategy | Proposed |
| [ADR-004](./ADR-004-authorization-model.md) | Authorization: RBAC + committee scope + ownership, enforced by RLS | Proposed |
| [ADR-005](./ADR-005-environment-strategy.md) | Environment strategy | Proposed |
| [ADR-006](./ADR-006-email-provider.md) | Transactional email provider | Proposed |
| [ADR-007](./ADR-007-ci-cd-strategy.md) | CI/CD with GitHub Actions and tag-based production deploys | Proposed |
| [ADR-008](./ADR-008-typescript-adoption.md) | Adopt TypeScript (strict) | Accepted (implemented) |
| [ADR-009](./ADR-009-styling-and-design-tokens.md) | Styling: design tokens + Tailwind v4, progressive migration | Proposed (Tailwind configured) |
| [ADR-010](./ADR-010-i18n-routing.md) | Locale in the URL with next-intl | Accepted |
| [ADR-011](./ADR-011-membership-intake-separate-from-accounts.md) | Membership via intake cycles, separate from accounts | Accepted |
| [ADR-012](./ADR-012-event-model-and-wizard-from-kfucs.md) | Adopt the KFUCS event model and 4-step creation wizard | Accepted |
| [ADR-013](./ADR-013-accounts-for-members-only.md) | Accounts for members only; everyone else is a guest | Accepted |
| [ADR-014](./ADR-014-public-redesign-design-system-v2.md) | Public redesign on Design System v2 (supersedes D-009 for public pages) | Accepted |
