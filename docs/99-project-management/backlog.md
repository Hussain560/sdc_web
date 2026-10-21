# Product Backlog (Initial)

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-17 |
| **Status**       | Living — every story carries its delivery status. Stories are not mirrored in GitHub Issues; pull requests and this file are the record |

Story ids: `<EPIC>-<nnn>`. The text after "—" in each row is the delivery state as of 2026-10-17. Sprint assignment: see each [sprint plan](./sprints/README.md#2-sprint-roadmap). Priority: P0 (must for the phase), P1 (should), P2 (could). Stories marked ⛔ are blocked by an open question and cannot enter a sprint ([DoR](./definition-of-ready.md)).

## Epics

| Epic | Title | Phase | Requirements |
| ---- | ----- | ----- | ------------ |
| EP-FND | Foundation & project control | 0 | — |
| EP-ENG | Engineering baseline (tooling, CI, environments) | 1 | NFR-MAINT-*, NFR-OPS-* |
| EP-DB | Database baseline & migrations | 1–6 | NFR-REL-* |
| EP-UI | Design tokens, primitives, i18n routing | 1–5 | NFR-I18N-*, NFR-A11Y-* |
| EP-AUTH | Authentication & account | 2 | FR-AUTH-* |
| EP-ACC | Access control (RBAC) & administration | 2, 4 | FR-ADM-*, FR-CMT-002 |
| EP-CMT | Committees & positions | 2, 4 | FR-CMT-* |
| EP-EVT | Events | 3A | FR-EVT-* |
| EP-REG | Registrations & attendance | 3A, 4 | FR-REG-* |
| EP-MBR | Membership intake | 3B | FR-MBR-* |
| EP-MEM | Members & directory | 3B, 4 | FR-MEM-* |
| EP-ART | Articles | 3C | FR-ART-* |
| EP-NOT | Notifications | 2–3C | FR-NOT-* |
| EP-RPT | Reports | 4 | FR-RPT-* |
| EP-PUB | Public site | 3–4 | FR-PUB-* |
| EP-SEC | Security & privacy hardening | 0, 5 | NFR-SEC-*, NFR-PRIV-* |
| EP-LCH | Launch | 6 | — |
| EP-RDS | Public redesign on Design System v2 | 7 | ADR-014 |

## Stories

### EP-FND — Foundation (Phase 0)
| ID | Story | P |
| -- | ----- | - |
| FND-001 | Review and approve the documentation set | P0 — 🔄 Owner review open |
| FND-002 | Answer P1 open questions | P0 — 🔄 Owner and leadership answers open |
| FND-003 | Inspect remote Supabase project read-only; record schema, policies, grants, data volumes (Q-025) | P0 — ⛔ Deferred by the owner (Q-025); production state not inspected |
| FND-004 | Create/confirm GitHub org + repository; import code; protect `main`/`develop` (Q-024) | P0 — ✅ Done 2026-10-04: both repositories hold `main`, `develop` and `release/v1.0.0`; branch protection is the owner’s setting |
| FND-005 | Access inventory: owners of GitHub, Vercel, Supabase, email, domain; shared password manager | P0 — 🔄 Owner (risk R-013) |
| SEC-001 | Containment migration for open RLS + email functions (only if FND-003 confirms exposure) | P0 — ⛔ Waits on FND-003; the regression tests (DB-004) already guard the local schema |
| FND-006 | Put the local working copy on a branch of `sdc-saudi/SDC_website`, push, open PR to `main` (Q-024, D-010) | P0 — ✅ Done 2026-10-04: pushed; every change since is a pull request on both repositories |
| FND-007 | Agent skills + frozen-identity guardrail (D-009) | P1 — ✅ done 2026-10-02 ([AI agent skills](../07-engineering/ai-agent-skills.md)) |

### EP-ENG / EP-DB / EP-UI — Baseline (Phase 1)
| ID | Story | P |
| -- | ----- | - |
| ENG-001 | Upgrade Next.js/React to latest stable; regenerate `AGENTS.md` | P0 — ✅ done 2026-10-02 (Next 16.3.8 / React 19.3) |
| ENG-002 | TypeScript strict config; convert shared libs | P0 — ✅ done 2026-10-02 (all app code) |
| ENG-003 | ESLint flat config + Prettier + Husky/lint-staged; `.nvmrc` + `engines` | P0 — ✅ Done (ESLint, Prettier, Husky, lint-staged, commitlint, `.nvmrc`, `engines`) |
| ENG-004 | Vitest + Testing Library + Playwright + pgTAP scaffolding | P0 — ✅ Done (Sprint 01) |
| ENG-005 | GitHub Actions `ci.yml` with required checks; commitlint; Dependabot | P0 — ✅ Done 2026-10-04: `ci.yml` (quality, build, pgTAP, PR title) runs on GitHub; the browser suites are a manual workflow. Also release-please, database deploy, backup and keep-alive workflows |
| ENG-006 | Staging Supabase project; Vercel environments; `.env.example`; `lib/env.ts` | P0 — 🔄 Dev done (Vercel `develop` site, Supabase `sdc-dev`, `lib/env.ts`); production projects are owner actions |
| ENG-007 | Remove dead code (`events.json`, `articlesData.json`, `Breadcrumb.jsx`, contact modal) | P1 — ✅ Done (dead data files removed; the redesign also deleted the legacy Header, Footer and public CSS) |
| DB-001 | Complete `supabase/config.toml` (auth, storage, inbucket SMTP port) | P0 — ✅ Done (Sprint 02) |
| DB-002 | Baseline migration of legacy schema + `migration repair` on remote | P0 — ✅ Local baseline; the dev project receives migrations through CI; the production repair belongs to the cutover runbook |
| DB-003 | Retire `seed_tables.sql`; synthetic `seed.sql` | P0 — ✅ Done (Sprint 02) |
| DB-004 | pgTAP regression: anon cannot write `members` / read registrations | P0 — ✅ Done (Sprint 01) |
| UI-001 | `tokens.css` (colors, type, spacing, radii, shadows, motion) both themes | P0 — ✅ Done (Sprint 02) |
| UI-002 | Configure Tailwind v4 mapped to tokens | P0 — ✅ Done (Sprint 02) |
| UI-003 | `[locale]` routing with next-intl; server `lang`/`dir`; message catalogues for shared chrome | P0 — ✅ Done (Sprint 02) |
| UI-004 | Primitives batch 1: Button, IconButton, Badge, Card, Field/Input, Alert, Dialog | P1 — ✅ Done (Sprint 02) |
| UI-005 | `next/font` and `next/image` adoption in layout/header/footer | P1 — ✅ Done 2026-10-10 (RDS-002: `next/font`, one font stack) |

| UI-006 | Internal dashboard screen blueprints (shell, sidebar, conditional rendering, skeletons, screens, flows) | P0 — ✅ done 2026-10-02 ([INTERNAL-SCREENS](../10-design-system/INTERNAL-SCREENS/README.md)) |
| UI-007 | Public screen blueprints of every current page (frozen look) + target states + visitor flows | P0 — ✅ done 2026-10-02 ([PUBLIC-SCREENS](../10-design-system/PUBLIC-SCREENS/README.md)) |
| ENG-008 | Visual-regression baseline: Playwright screenshots of every public page (ar/en × dark/light × 1440/375) as a required CI check | P0 — ✅ Done (Sprint 01) |
| ENG-009 | Prettier + Husky + lint-staged + commitlint (now possible: Git exists) | P0 — ✅ Done (Sprint 01) |

### EP-AUTH / EP-ACC / EP-CMT — Identity & access (Phase 2)
| ID | Story | P |
| -- | ----- | - |
| AUTH-001 | As a visitor, I can sign up with server-validated name/password and receive a branded confirmation email | P0 — ✅ Done (Sprint 03) |
| AUTH-002 | As a user, I sign in and return to the page I came from | P0 — ✅ Done (Sprint 03) |
| AUTH-003 | As a user, I can reset my password without revealing whether an email exists | P0 — ✅ Done (Sprint 03) |
| AUTH-004 | As a user, I can edit my name and language preference | P1 — ✅ Done (Sprint 03) |
| AUTH-005 | Profiles table + sign-up trigger + backfill for existing users | P0 — ✅ Done (Sprint 03) |
| ACC-001 | Roles, permissions, role_permissions, role_assignments + `has_permission` + RLS + seeds ⛔ Q-003 | P0 — ✅ Done (Sprint 04) |
| ACC-002 | As a system admin, I can assign and end roles with terms; anti-escalation and last-admin guards | P0 — ✅ Done (Sprint 04) |
| ACC-003 | Dashboard shell with permission-filtered navigation | P0 — ✅ Done (Sprint 04) |
| ACC-004 | Bootstrap admins and map the current reviewer to a role ⛔ Q-039 | P0 — 🔄 Bootstrap function + personas done; real admins ⛔ Q-039 |
| CMT-001 | Committees table + seed ⛔ Q-004 | P0 — ✅ Done (Sprint 04) |
| CMT-002 | Public leadership view generated from active public positions ⛔ Q-014 | P0 — ✅ Done (Sprint 04) |
| NOT-001 | Auth emails through provider custom SMTP; bilingual templates ⛔ Q-010, Q-017 | P0 — 🔄 Templates + Mailpit done; provider SMTP ⛔ Q-010/Q-017 |
| SEC-006 | Delete the `check-email-exists` Edge Function (e-mail existence oracle) | P0 — ✅ Done (Sprint 03) |

### EP-EVT / EP-REG / EP-NOT — Events (Phase 3A)
| ID | Story | P |
| -- | ----- | - |
| EVT-001 | As a committee member, I can draft an event in the 4-step wizard (Identity → Logistics → Content → Review) with live preview and refresh-safe draft (ADR-012) | P0 — ✅ Done (Sprint 05) |
| EVT-006 | Schedule types (single day / range / specific dates) with `event_dates`; presenters (accounts or guests); goals and FAQ; display toggles | P0 — ✅ Done (Sprint 05) |
| EVT-002 | As a committee head, I submit; as the leader, I approve or request changes ⛔ Q-005 | P0 — ✅ Done (Sprint 05); approver = community leader (Q-005 default) |
| EVT-003 | As a visitor, I browse upcoming/past events with correct badges and dates | P0 — ✅ Done (Sprint 06); list rebuilt on v2 in Sprint 16 and PR #4 |
| EVT-004 | As an organizer, I cancel a published event and registrants are notified | P0 — ✅ Done (Sprint 06) |
| EVT-005 | Migrate the six existing events + redirects from numeric URLs | P0 — ✅ Done (Sprint 06): legacy events are rows; redirects in place |
| REG-001 | As a user, I register once for an open event and see my status | P0 — ✅ Done (Sprint 06); changed by ADR-013: guests register from a dialog without an account |
| REG-002 | As a user, I cancel my registration before the event | P1 — ✅ Done (Sprint 06) |
| REG-003 | As a committee head, I review registrations for my events (bulk accept/reject) ⛔ Q-018, Q-028 | P0 — ✅ Done (Sprint 06) |
| REG-004 | Capacity and waitlist ⛔ Q-029 | P1 — ✅ Done (Sprint 06): capacity and waiting list |
| REG-005 | Migrate legacy registrations | P0 — ✅ Done (Sprint 06) |
| PUB-002 | Public event pages from DB with all phase/registration states, KFUCS content blocks in the existing card style, skeletons — **no visual change** (visual-regression check) | P0 — ✅ Done (Sprint 06); rebuilt on v2 in Sprint 15 (RDS-013) |
| NOT-002 | Notifications module, email log, registration templates; retire `send-*-email` | P0 — ✅ Done (Sprint 06); by owner decision only acceptance e-mails are sent |

### EP-MBR / EP-MEM — Membership (Phase 3B)
| ID | Story | P |
| -- | ----- | - |
| MBR-001 | As the leader, I create and schedule a membership intake cycle ⛔ Q-011 | P0 — ✅ Done (Sprint 07) |
| MBR-002 | As a visitor, `/join` shows whether applications are open, upcoming or closed | P0 — ✅ Done (Sprint 07); v2 in Sprint 16 |
| MBR-003 | As a signed-in user, I apply while the cycle is open ⛔ Q-002 | P0 — ✅ Done (Sprint 07); changed by ADR-013: applying needs no account |
| MBR-004 | As a reviewer, I review and decide applications (bulk), and decisions are emailed ⛔ Q-013 | P0 — ✅ Done (Sprint 08) |
| MBR-005 | As an applicant, I see my application status and can withdraw | P1 — ✅ Done (Sprint 08) |
| MEM-001 | Reference data tables seeded from legacy values | P0 — ✅ Done (Sprint 07) |
| MEM-002 | Directory and profile from `member_directory` view with filters ⛔ Q-007 | P0 — ✅ Done (Sprint 08); rebuilt with per-field consent in Sprint 16 |
| MEM-003 | As a member, I edit my profile and directory visibility ⛔ Q-030 | P0 — ✅ Done (Sprint 08); consent switches added in Sprint 16 |
| MEM-004 | Legacy member import + claim flow ⛔ Q-026, Q-038 | P0 — ✅ Done (Sprint 08): claim flow at `/claim/[token]` |

### EP-ART — Articles (Phase 3C)
| ID | Story | P |
| -- | ----- | - |
| ART-001 | As a committee member, I write a bilingual article draft in Markdown ⛔ Q-006 | P0 — ✅ Done (Sprint 09) |
| ART-002 | Review → publish → archive lifecycle | P0 — ✅ Done (Sprint 09) |
| ART-003 | Public list/detail from DB; migrate six articles; redirects ⛔ Q-033 | P0 — ✅ Done (Sprint 09); v2 in Sprint 16 |
| NOT-003 | Remaining notification templates; email retry job | P1 — ✅ Done (Sprint 09) |

### EP-RPT / EP-ACC / EP-PUB — Management (Phase 4)
| ID | Story | P |
| -- | ----- | - |
| RPT-001 | Community dashboard ⛔ Q-008 | P0 — ✅ Done (Sprint 11) |
| RPT-002 | Committee dashboard | P0 — ✅ Done (Sprint 11) |
| REG-006 | Attendance sessions: open/close/finalize, QR + online + manual check-in, event finalization (ADR-012) | P0 — ✅ Done (Sprint 10) |
| REG-008 | Certificates: eligibility, PDF, delivery + retry ⛔ Q-020 | P2 — ✅ Done (Sprint 10), off behind the certificates setting (Q-020) |
| REG-007 | Registrant export (audited) | P1 — ✅ Done (Sprint 11) |
| ACC-005 | Audit log UI | P0 — ✅ Done (Sprint 11) |
| PUB-003 | `/events/[slug]/check-in` page (QR / online) | P0 — ✅ Done (Sprint 10); v2 in Sprint 15 (RDS-016) |
| PUB-004 | `/search` results page (or hide the header search until built) | P2 — ⬜ Not built; the header search stays hidden (Q-023) |
| ACC-006 | Reference data and site settings UIs | P1 — ✅ Done (Sprint 11) |
| CMT-003 | Committee management UI + public committee pages | P1 — ✅ Done (Sprint 10) |
| PUB-001 | Partners section ⛔ Q-021 | P2 — ✅ Done (Sprint 11): partners in settings; the Home band hides partners without a logo |

### EP-SEC / EP-LCH (Phases 5–6)
| ID | Story | P |
| -- | ----- | - |
| SEC-002 | CSP enforced, security headers | P0 — ✅ Done (Sprint 12) |
| SEC-003 | Privacy notice, consent capture, data-subject flows ⛔ Q-031 | P0 — 🔄 Built (Sprint 12); wording and retention periods wait on Q-031 |
| SEC-004 | Accessibility audit and fixes; axe blocking | P0 — ✅ Done (Sprint 12) |
| SEC-005 | Backup workflow + restore drill | P0 — ✅ Done (Sprint 12): backup workflow and restore drill |
| ENG-010 | Performance pass: `next/image` everywhere, Core Web Vitals budget in CI | P1 — ✅ Budgets written (Sprint 12); production Core Web Vitals check pending |
| LCH-001 | Production cutover runbook and rehearsal | P0 — ✅ Done (Sprint 13): runbook and rehearsal |
| LCH-002 | Contract migrations (drop legacy tables) | P0 — 🔄 Written in `supabase/contract/`, not applied; timing is the owner’s |
| LCH-003 | Production env, domain, e-mail domain verification, monitoring/keep-alive | P0 — ⬜ Owner action |
| LCH-004 | Handover: two system admins trained; runbooks; access inventory updated | P0 — ⬜ Owner action |
| LCH-005 | Launch announcement (ar/en) and release notes | P1 — ✅ Drafts ready ([announcement](./releases/launch-announcement.md)) |

### EP-RDS — Public redesign on Design System v2 (Phase 7, [ADR-014](../90-decisions/ADR-014-public-redesign-design-system-v2.md))

Specs: [design system](../10-design-system/README.md), [page specs](../10-design-system/PUBLIC-SCREENS-V2/README.md).

| ID | Story | Priority |
| -- | ----- | -------- |
| RDS-001 | v2 tokens, new primitives, Tailwind theme, contrast and hex checks in CI | P0 — ✅ Done 2026-10-10 (PR #2) |
| RDS-002 | One font stack via `next/font`, type scale utilities | P0 — ✅ Done 2026-10-10 (PR #2) |
| RDS-003 | Actions and labels components | P0 — ✅ Done 2026-10-10 (PR #2) |
| RDS-004 | Form components | P0 — ✅ Done 2026-10-10 (PR #2) |
| RDS-005 | Containers and feedback components (incl. ResultDialog, Progress) | P0 — ✅ Done 2026-10-10 (PR #2) |
| RDS-006 | In-page navigation components | P1 — ✅ Done 2026-10-10 (PR #2) |
| RDS-007 | SiteHeader, SiteFooter, Logo, locale and theme switches | P0 — ✅ Done 2026-10-10 (PR #2); gallery at `/design-gallery` |
| RDS-008 | Auth route layout without header and footer | P0 — ✅ Done 2026-10-10 (PR #2) |
| RDS-010 | Chrome roll-out on every public route | P0 — ✅ Done (PR #3) |
| RDS-011 | Event data additions (per-day place, what to bring, public certificate settings, presenters view) | P0 — ✅ Done (PR #3) |
| RDS-012 | Home page v2 | P0 — ✅ Done (PR #3); why-join and FAQ copy is draft (Q-H3, Q-H4) |
| RDS-013 | Event page v2, all states | P0 — ✅ Done (PR #3) |
| RDS-014 | Registration dialog v2 with the 1.5 s minimum progress and result dialogs | P0 — ✅ Done (PR #3) |
| RDS-015 | Add to calendar (.ics) | P1 — ✅ Done (PR #3) |
| RDS-016 | Check-in page v2 and venue QR card | P1 — ✅ Done (PR #3) |
| RDS-017 | Public stats view ⛔ Q-H2 | P1 — ✅ Done (PR #3): `public_stats` view, counts only |
| RDS-020 | Directory consent model (per-field, photo, participation) | P0 — ✅ Done (PR #3) |
| RDS-021 | Members directory v2 | P0 — ✅ Done (PR #3) |
| RDS-022 | Member profile v2 | P0 — ✅ Done (PR #3) |
| RDS-023 | Events list v2 | P0 — ✅ Done (PR #3); second pass in PR #4 (baselines pending) |
| RDS-024 | Articles list and reading page v2 | P1 — ✅ Done (PR #3) |
| RDS-025 | Committees index and committee page v2 | P1 — ✅ Done (PR #3) |
| RDS-026 | About v2 ⛔ Q-A1 | P1 — ✅ Done (PR #3, PR #4); copy is draft (Q-A1) |
| RDS-027 | Join v2 | P0 — ✅ Done (PR #3) |
| RDS-028 | Certificate verification v2 | P1 — ✅ Done (PR #3) |
| RDS-029 | Privacy and 404 v2; delete legacy public CSS; release `v1.1.0` | P0 — ✅ Done (PR #3): legacy public CSS deleted; `v1.1.0` not yet tagged |
| RDS-030 | Suggested additions marked *later* ([20-suggested-additions](../10-design-system/PUBLIC-SCREENS-V2/20-suggested-additions.md)) | P2 — unscheduled |

### Added during delivery (not in the initial backlog)

Work the team did because the situation changed or the owner asked. Ids are new.

| ID | Story | P |
| -- | ----- | - |
| REG-009 | Guest registration from a modal, no account, with honeypot, minimum fill time and e-mail and IP throttles; public check-in by registered e-mail; guest certificate link ([ADR-013](../90-decisions/ADR-013-accounts-for-members-only.md)) | P0 — ✅ Done 2026-10-03 |
| MBR-006 | Membership application without an account; acceptance creates the account and e-mails an activation link | P0 — ✅ Done 2026-10-03 |
| MEM-005 | Leaders, founders and admins add members directly (`members.create`) | P1 — ✅ Done 2026-10-03 |
| SEC-007 | Privacy notice, consent records, personal data export, deletion requests, weekly retention job | P0 — ✅ Done 2026-10-03 (wording: Q-031) |
| ENG-011 | Release pipeline: `release-please`, branch flow `develop` → `release/*` → `main` → `production`, database deploy per environment, nightly backup, keep-alive, manual E2E workflow | P0 — ✅ Done 2026-10-04 ([git workflow](../07-engineering/git-workflow.md)) |
| RDS-031 | New registration form: separate name parts, occupation (with "other"), international phone field, country list | P0 — ✅ Done 2026-10-10 (PR #3; migrations `guest_name_parts`, `guest_occupation`, `guest_occupation_other`). Open: a hydration warning in the phone field (country names differ between server and client) |
| RDS-032 | About and Events list second pass: count-up figures, topics marquee, values rows, spotlight card, filter card with phone sheet, shared event card, scroll motion (`page-motion.css`) | P1 — ✅ Done 2026-10-11 (PR #4); baselines pending |
| ENG-012 | Team test accounts and sample data for the hosted develop project (`supabase/dev-env-seed.sql`, idempotent, password supplied at run time) | P1 — 🔄 Run on the develop project 2026-10-17; file still untracked |

### Sprint 17 — Members and motion ([plan](./sprints/sprint-17-members-profiles-and-motion/plan.md))

| ID | Story | P |
| -- | ----- | - |
| MEM-011 | Member data model v3: middle names, headline, about, skills, projects, links, "open to", consent per block | P0 — ⬜ Sprint 17 |
| MEM-012 | Profile photo upload (bucket, policies, crop and resize, consent) | P0 — ⬜ Sprint 17 |
| MEM-013 | Member profile editor redesign with completeness and live preview | P0 — ⬜ Sprint 17 |
| MEM-014 | Add-member wizard with committee and position, one transaction | P0 — ⬜ Sprint 17 |
| MEM-015 | Dashboard members list and member detail with complete data | P0 — ⬜ Sprint 17 |
| ACC-007 | Assign-position dialog: working user search, states, keyboard | P0 — ⬜ Sprint 17 |
| RDS-033 | Members directory redesign (skills filter, richer cards) | P0 — ⬜ Sprint 17 ⛔ designs |
| RDS-034 | Member profile page redesign (LinkedIn-like) | P0 — ⬜ Sprint 17 ⛔ designs |
| RDS-035 | Home members marquee | P1 — ⬜ Sprint 17 ⛔ designs |
| MOT-001 | Motion foundation (`motion` library, shared presets, View Transitions, reduced motion, tests) | P0 — ⬜ Sprint 17 |
| MOT-002 | Motion roll-out on Home, event page, members, articles, committees, Join | P1 — ⬜ Sprint 17 ⛔ designs |

### Sprint 18 — Membership lifecycle ([plan](./sprints/sprint-18-membership-lifecycle/plan.md), [process](./sprints/sprint-18-membership-lifecycle/lifecycle.md))

| ID | Story | P |
| -- | ----- | - |
| MBR-007 | Applications data v2: split names, reference number, `info_requested`, tracking token | P0 — ⬜ Sprint 18 |
| MBR-008 | Join form redesign: steps, split names, phone with country, autosave, submission feedback | P0 — ⬜ Sprint 18 ⛔ designs |
| MBR-009 | Track my application without an account (status, correction, withdraw) | P1 — ⬜ Sprint 18 ⛔ designs |
| MBR-010 | Applications list redesign with bulk bar and phone cards | P0 — ⬜ Sprint 18 ⛔ designs |
| MBR-011 | Application review page redesign (all fields, duplicates, history, decision panel, request info) | P0 — ⬜ Sprint 18 ⛔ designs |
| MEM-016 | Membership term: dates, daily expiry job, reminders, renew (single and bulk) | P0 — ⬜ Sprint 18 |
| MEM-017 | Membership states v2 (`expired`, `ended` + reason, leave requests approved by leadership, suspension that stops access) | P0 — ⬜ Sprint 18 |
| MEM-018 | Members list bulk actions and leave-requests queue with per-row results | P0 — ⬜ Sprint 18 ⛔ designs |
| MEM-019 | Member detail lifecycle timeline and actions | P1 — ⬜ Sprint 18 ⛔ designs |
| ACC-008 | Block and unblock accounts (`users.block`), sign-in notices | P0 — ⬜ Sprint 18 |
| ACC-009 | Activation reminders, expired-link resend, onboarding screen after first sign-in | P0 — ⬜ Sprint 18 ⛔ designs |
| MBR-012 | Reviewer scoring rubric (criteria per cycle, scores and comments, summary on review page) | P1 — ⬜ Sprint 18 ⛔ designs |
| MBR-013 | Waitlist auto-promotion when accepted people do not activate in time | P1 — ⬜ Sprint 18 |
| MEM-020 | Digital membership card with QR code and public verification page | P1 — ⬜ Sprint 18 ⛔ designs |
| NOT-004 | Lifecycle e-mails (new templates, both languages, sent once, retried) | P0 — ⬜ Sprint 18 |
