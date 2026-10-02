# Product Backlog (Initial)

| Field            | Value      |
| ---------------- | ---------- |
| **Last Updated** | 2026-10-02 |
| **Status**       | Draft — mirror into GitHub Issues of `sdc-saudi/SDC_website` (one issue per story, label = epic) |

Story ids: `<EPIC>-<nnn>`. Sprint assignment: see each [sprint plan](./sprints/README.md#2-sprint-roadmap). Priority: P0 (must for the phase), P1 (should), P2 (could). Stories marked ⛔ are blocked by an open question and cannot enter a sprint ([DoR](./definition-of-ready.md)).

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

## Stories

### EP-FND — Foundation (Phase 0)
| ID | Story | P |
| -- | ----- | - |
| FND-001 | Review and approve the documentation set | P0 |
| FND-002 | Answer P1 open questions | P0 |
| FND-003 | Inspect remote Supabase project read-only; record schema, policies, grants, data volumes (Q-025) | P0 |
| FND-004 | Create/confirm GitHub org + repository; import code; protect `main`/`develop` (Q-024) | P0 |
| FND-005 | Access inventory: owners of GitHub, Vercel, Supabase, email, domain; shared password manager | P0 |
| SEC-001 | Containment migration for open RLS + email functions (only if FND-003 confirms exposure) | P0 |
| FND-006 | Put the local working copy on a branch of `sdc-saudi/SDC_website`, push, open PR to `main` (Q-024, D-010) | P0 — ⛔ local commits done 2026-10-02; **push on hold by owner instruction** |
| FND-007 | Agent skills + frozen-identity guardrail (D-009) | P1 — ✅ done 2026-10-02 ([AI agent skills](../07-engineering/ai-agent-skills.md)) |

### EP-ENG / EP-DB / EP-UI — Baseline (Phase 1)
| ID | Story | P |
| -- | ----- | - |
| ENG-001 | Upgrade Next.js/React to latest stable; regenerate `AGENTS.md` | P0 — ✅ done 2026-10-02 (Next 16.3.8 / React 19.3) |
| ENG-002 | TypeScript strict config; convert shared libs | P0 — ✅ done 2026-10-02 (all app code) |
| ENG-003 | ESLint flat config + Prettier + Husky/lint-staged; `.nvmrc` + `engines` | P0 — 🔄 ESLint, `.nvmrc`, `engines` done; Prettier + Husky pending (needs Git — Q-024) |
| ENG-004 | Vitest + Testing Library + Playwright + pgTAP scaffolding | P0 — ✅ Done (Sprint 01) |
| ENG-005 | GitHub Actions `ci.yml` with required checks; commitlint; Dependabot | P0 — 🔄 Written locally, not run (push on hold) |
| ENG-006 | Staging Supabase project; Vercel environments; `.env.example`; `lib/env.ts` | P0 — 🔄 `lib/env.ts` done; staging needs owners |
| ENG-007 | Remove dead code (`events.json`, `articlesData.json`, `Breadcrumb.jsx`, contact modal) | P1 — 🔄 files removed; contact modal kept (public page unchanged) |
| DB-001 | Complete `supabase/config.toml` (auth, storage, inbucket SMTP port) | P0 — ✅ Done (Sprint 02) |
| DB-002 | Baseline migration of legacy schema + `migration repair` on remote | P0 — 🔄 Local baseline done; remote repair deferred |
| DB-003 | Retire `seed_tables.sql`; synthetic `seed.sql` | P0 — ✅ Done (Sprint 02) |
| DB-004 | pgTAP regression: anon cannot write `members` / read registrations | P0 — ✅ Done (Sprint 01) |
| UI-001 | `tokens.css` (colors, type, spacing, radii, shadows, motion) both themes | P0 — ✅ Done (Sprint 02) |
| UI-002 | Configure Tailwind v4 mapped to tokens | P0 — ✅ Done (Sprint 02) |
| UI-003 | `[locale]` routing with next-intl; server `lang`/`dir`; message catalogues for shared chrome | P0 — ✅ Done (Sprint 02) |
| UI-004 | Primitives batch 1: Button, IconButton, Badge, Card, Field/Input, Alert, Dialog | P1 — ✅ Done (Sprint 02) |
| UI-005 | `next/font` and `next/image` adoption in layout/header/footer | P1 |

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
| EVT-001 | As a committee member, I can draft an event in the 4-step wizard (Identity → Logistics → Content → Review) with live preview and refresh-safe draft (ADR-012) | P0 |
| EVT-006 | Schedule types (single day / range / specific dates) with `event_dates`; presenters (accounts or guests); goals and FAQ; display toggles | P0 |
| EVT-002 | As a committee head, I submit; as the leader, I approve or request changes ⛔ Q-005 | P0 |
| EVT-003 | As a visitor, I browse upcoming/past events with correct badges and dates | P0 |
| EVT-004 | As an organizer, I cancel a published event and registrants are notified | P0 |
| EVT-005 | Migrate the six existing events + redirects from numeric URLs | P0 |
| REG-001 | As a user, I register once for an open event and see my status | P0 |
| REG-002 | As a user, I cancel my registration before the event | P1 |
| REG-003 | As a committee head, I review registrations for my events (bulk accept/reject) ⛔ Q-018, Q-028 | P0 |
| REG-004 | Capacity and waitlist ⛔ Q-029 | P1 |
| REG-005 | Migrate legacy registrations | P0 |
| PUB-002 | Public event pages from DB with all phase/registration states, KFUCS content blocks in the existing card style, skeletons — **no visual change** (visual-regression check) | P0 |
| NOT-002 | Notifications module, email log, registration templates; retire `send-*-email` | P0 |

### EP-MBR / EP-MEM — Membership (Phase 3B)
| ID | Story | P |
| -- | ----- | - |
| MBR-001 | As the leader, I create and schedule a membership intake cycle ⛔ Q-011 | P0 |
| MBR-002 | As a visitor, `/join` shows whether applications are open, upcoming or closed | P0 |
| MBR-003 | As a signed-in user, I apply while the cycle is open ⛔ Q-002 | P0 |
| MBR-004 | As a reviewer, I review and decide applications (bulk), and decisions are emailed ⛔ Q-013 | P0 |
| MBR-005 | As an applicant, I see my application status and can withdraw | P1 |
| MEM-001 | Reference data tables seeded from legacy values | P0 |
| MEM-002 | Directory and profile from `member_directory` view with filters ⛔ Q-007 | P0 |
| MEM-003 | As a member, I edit my profile and directory visibility ⛔ Q-030 | P0 |
| MEM-004 | Legacy member import + claim flow ⛔ Q-026, Q-038 | P0 |

### EP-ART — Articles (Phase 3C)
| ID | Story | P |
| -- | ----- | - |
| ART-001 | As a committee member, I write a bilingual article draft in Markdown ⛔ Q-006 | P0 |
| ART-002 | Review → publish → archive lifecycle | P0 |
| ART-003 | Public list/detail from DB; migrate six articles; redirects ⛔ Q-033 | P0 |
| NOT-003 | Remaining notification templates; email retry job | P1 |

### EP-RPT / EP-ACC / EP-PUB — Management (Phase 4)
| ID | Story | P |
| -- | ----- | - |
| RPT-001 | Community dashboard ⛔ Q-008 | P0 |
| RPT-002 | Committee dashboard | P0 |
| REG-006 | Attendance sessions: open/close/finalize, QR + online + manual check-in, event finalization (ADR-012) | P0 |
| REG-008 | Certificates: eligibility, PDF, delivery + retry ⛔ Q-020 | P2 |
| REG-007 | Registrant export (audited) | P1 |
| ACC-005 | Audit log UI | P0 |
| PUB-003 | `/events/[slug]/check-in` page (QR / online) | P0 |
| PUB-004 | `/search` results page (or hide the header search until built) | P2 |
| ACC-006 | Reference data and site settings UIs | P1 |
| CMT-003 | Committee management UI + public committee pages | P1 |
| PUB-001 | Partners section ⛔ Q-021 | P2 |

### EP-SEC / EP-LCH (Phases 5–6)
| ID | Story | P |
| -- | ----- | - |
| SEC-002 | CSP enforced, security headers | P0 |
| SEC-003 | Privacy notice, consent capture, data-subject flows ⛔ Q-031 | P0 |
| SEC-004 | Accessibility audit and fixes; axe blocking | P0 |
| SEC-005 | Backup workflow + restore drill | P0 |
| ENG-010 | Performance pass: `next/image` everywhere, Core Web Vitals budget in CI | P1 |
| LCH-001 | Production cutover runbook and rehearsal | P0 |
| LCH-002 | Contract migrations (drop legacy tables) | P0 |
| LCH-003 | Production env, domain, e-mail domain verification, monitoring/keep-alive | P0 |
| LCH-004 | Handover: two system admins trained; runbooks; access inventory updated | P0 |
| LCH-005 | Launch announcement (ar/en) and release notes | P1 |
